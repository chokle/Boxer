// Job processing: queued -> extracting -> analyzing -> done | failed.
//
// One job = one row in public.analyses. The worker claims it by flipping
// queued -> extracting (index.ts), then:
//   1. download source from the raw-media bucket
//   2. extract motion-weighted keyframes (video) or use the photo directly
//   3. run pose estimation on each keyframe, compute metrics
//   4. upload keyframes to the keyframes bucket, save pose_metrics
//   5. Phase 2a ends here: status=done, result=null.
//      Phase 2b: runVisionAnalysis() fills result before done.
//
// Storage path contract (must match the RLS policies in 001_schema.sql):
//   raw-media/<user_id>/…            (client uploads here)
//   keyframes/<user_id>/<analysis_id>/frame_XXXX.jpg   (worker writes here)

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { getConfig } from './config';
import { computeFrameMetrics, computeSummary } from './metrics';
import { extractKeyframes } from './frames';
import { runVisionAnalysis } from './vision';
import type { PoseEstimator } from './pose';
import type { AnalysisRow, FrameResult, PoseMetricsJson } from './types';
import type { DbClient, StorageAdapter } from './supabase';

const RAW_BUCKET = 'raw-media';
const KEYFRAME_BUCKET = 'keyframes';

async function setStatus(db: DbClient, id: string, status: AnalysisRow['status'], patch: Record<string, unknown> = {}) {
  const { error } = await db
    .from('analyses')
    .update({ status, updated_at: new Date().toISOString(), ...patch })
    .eq('id', id);
  if (error) throw new Error(`failed to set status ${status} on ${id}: ${error.message}`);
}

export async function failJob(db: DbClient, id: string, reason: string): Promise<void> {
  await setStatus(db, id, 'failed', { error: reason.slice(0, 500) });
}

export interface PipelineDeps {
  db: DbClient;
  storage: StorageAdapter;
  pose: PoseEstimator;
}

export async function processJob(deps: PipelineDeps, job: AnalysisRow): Promise<void> {
  const { db, storage, pose } = deps;
  const jobDir = path.join(getConfig().workDir, job.id);

  try {
    // --- extracting ----------------------------------------------------
    const mediaBuf = await storage.download(RAW_BUCKET, job.media_path);
    await fs.mkdir(jobDir, { recursive: true });
    const srcPath = path.join(jobDir, job.media_type === 'photo' ? 'source.jpg' : 'source.mp4');
    await fs.writeFile(srcPath, mediaBuf);

    let localFrames: Array<{ file: string; t: number }>;
    if (job.media_type === 'photo') {
      const kf = path.join(jobDir, 'cand_0001.jpg');
      await fs.copyFile(srcPath, kf);
      localFrames = [{ file: kf, t: 0 }];
    } else {
      localFrames = await extractKeyframes(srcPath, path.join(jobDir, 'cands'), {
        fps: getConfig().extractFps,
        maxFrames: getConfig().maxKeyframes,
        ffmpegPath: getConfig().ffmpegPath,
        ffprobePath: getConfig().ffprobePath,
      });
    }

    // --- analyzing: pose ------------------------------------------------
    await setStatus(db, job.id, 'analyzing');

    const frames: FrameResult[] = [];
    for (let i = 0; i < localFrames.length; i++) {
      const lf = localFrames[i];
      const buf = await fs.readFile(lf.file);
      const detected = await pose.estimate(buf).catch((e) => {
        console.warn(`pose failed on frame ${i} of ${job.id}: ${e.message}`);
        return null;
      });

      const storagePath = `${job.user_id}/${job.id}/frame_${String(i + 1).padStart(4, '0')}.jpg`;
      await storage.upload(KEYFRAME_BUCKET, storagePath, buf, 'image/jpeg');

      if (!detected) {
        frames.push({
          t: lf.t,
          path: storagePath,
          person_detected: false,
          pose_score: null,
          keypoints: null,
          metrics: null,
        });
        continue;
      }
      const keypoints: FrameResult['keypoints'] = {};
      for (const k of detected.keypoints) {
        keypoints[k.name] = {
          x: Math.round(k.x * 10000) / 10000,
          y: Math.round(k.y * 10000) / 10000,
          score: Math.round(k.score * 1000) / 1000,
        };
      }
      frames.push({
        t: lf.t,
        path: storagePath,
        person_detected: true,
        pose_score: Math.round(detected.score * 1000) / 1000,
        keypoints,
        metrics: computeFrameMetrics(detected.keypoints),
      });
    }

    const poseMetrics: PoseMetricsJson = {
      model: 'movenet-singlepose-lightning (tfjs cpu backend)',
      frame_count: frames.length,
      frames,
      summary: computeSummary(frames, getConfig().guardDropThreshold),
    };

    const keyframePaths = frames.map((f) => f.path);
    await setStatus(db, job.id, 'analyzing', {
      keyframe_paths: keyframePaths,
      pose_metrics: poseMetrics,
    });

    // --- vision (Phase 2b) ----------------------------------------------
    // 2a terminal state: pose metrics are the product; result stays null.
    // (Slight deviation from "2a stops at analyzing": leaving jobs parked
    // at `analyzing` forever would be dishonest job status. `done` here
    // means "2a processing complete".)
    if (getConfig().visionEnabled) {
      const bufs = await Promise.all(localFrames.map((lf) => fs.readFile(lf.file)));
      const result = await runVisionAnalysis(bufs, poseMetrics, {
        apiKey: process.env.OPENAI_API_KEY ?? '',
        userId: job.user_id,
      });
      await setStatus(db, job.id, 'done', { result });
    } else {
      await setStatus(db, job.id, 'done', { result: null });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`job ${job.id} failed: ${msg}`);
    await failJob(db, job.id, msg).catch((dbErr) => {
      console.error(`could not mark job ${job.id} failed: ${dbErr.message}`);
    });
  } finally {
    await fs.rm(jobDir, { recursive: true, force: true });
  }
}
