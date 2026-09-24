// Analysis worker entrypoint — Phase 2a.
//
// Polls public.analyses for status='queued', claims one job atomically
// (queued -> extracting, guarded by a WHERE status='queued' so two
// workers can't claim the same row), checks the monthly quota, then
// runs the pipeline.
//
// Run:  npm run build && npm start        (env from .env / environment)
// Stop: SIGINT / SIGTERM shuts down gracefully after the current job.

import { getConfig, FREE_MONTHLY_LIMIT } from './config';
import { createDbClient, SupabaseStorageAdapter, type DbClient } from './supabase';
import { checkAndConsumeQuota } from './quota';
import { failJob, processJob } from './pipeline';
import { MoveNetPoseEstimator } from './pose';
import type { AnalysisRow } from './types';

let shuttingDown = false;
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    console.log(`received ${sig}, finishing current job then exiting…`);
    shuttingDown = true;
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Atomically claim the oldest queued job. Returns null when none (or lost race). */
async function claimNextJob(db: DbClient): Promise<AnalysisRow | null> {
  const { data: next, error: selErr } = await db
    .from('analyses')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (selErr) throw new Error(`job poll failed: ${selErr.message}`);
  if (!next) return null;

  const { data: claimed, error: claimErr } = await db
    .from('analyses')
    .update({ status: 'extracting', updated_at: new Date().toISOString() })
    .eq('id', (next as AnalysisRow).id)
    .eq('status', 'queued') // lost the race if this matches 0 rows
    .select('*')
    .maybeSingle();
  if (claimErr) throw new Error(`job claim failed: ${claimErr.message}`);
  return (claimed as AnalysisRow | null) ?? null;
}

async function main(): Promise<void> {
  console.log('boxer-ai worker starting (phase 2a: pose metrics only)');
  console.log(
    `poll=${getConfig().pollIntervalMs}ms maxKeyframes=${getConfig().maxKeyframes} ` +
      `fps=${getConfig().extractFps} vision=${getConfig().visionEnabled ? 'ON (2b)' : 'off (2a)'} ` +
      `freeLimit=${FREE_MONTHLY_LIMIT}/mo`,
  );

  const db = createDbClient(getConfig().supabaseUrl, getConfig().supabaseServiceKey);
  const storage = new SupabaseStorageAdapter(db);
  const pose = new MoveNetPoseEstimator(getConfig().minPoseScore);

  console.log('loading pose model…');
  await pose.load();
  console.log('pose model ready');

  while (!shuttingDown) {
    try {
      const job = await claimNextJob(db);
      if (!job) {
        await sleep(getConfig().pollIntervalMs);
        continue;
      }
      console.log(`claimed job ${job.id} (user ${job.user_id}, ${job.media_type})`);

      const quota = await checkAndConsumeQuota(db, job.user_id);
      if (!quota.allowed) {
        console.log(`job ${job.id} denied: ${quota.reason}`);
        await failJob(db, job.id, quota.reason ?? 'quota_exceeded');
        continue;
      }

      await processJob({ db, storage, pose }, job);
      console.log(`job ${job.id} finished`);
    } catch (e) {
      console.error('worker loop error:', e instanceof Error ? e.message : e);
      await sleep(getConfig().pollIntervalMs);
    }
  }

  console.log('shutting down');
  await pose.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('fatal:', e);
  process.exit(1);
});
