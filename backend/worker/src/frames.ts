// Video → candidate frames (ffmpeg) → motion-weighted keyframe selection.
//
// Strategy: dump candidates at EXTRACT_FPS, score each candidate by
// inter-frame motion (mean absolute pixel difference on a downsampled
// grayscale version), then pick MAX_KEYFRAMES frames by taking the
// highest-motion candidate inside each of N equal temporal segments.
// This guarantees full-video coverage while biasing toward fast action
// (punches) instead of uniform sampling, which would waste frames on
// static guard-holding.

import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface Keyframe {
  /** Local temp path of the extracted JPEG. */
  file: string;
  /** Approximate seconds into the source video. */
  t: number;
}

export async function getDurationSec(videoPath: string, ffprobePath: string): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync(ffprobePath, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      videoPath,
    ]);
    const d = Number(stdout.trim());
    return Number.isFinite(d) && d > 0 ? d : null;
  } catch {
    return null; // ffprobe missing or failed — proceed without duration
  }
}

/** Mean absolute difference between two downsampled grayscale frames. */
function motionScore(prev: Buffer, curr: Buffer, width: number, height: number): number {
  // Inputs are raw grayscale buffers, same dimensions.
  let sum = 0;
  let n = 0;
  const stride = 16; // sample every 16th pixel — plenty for a motion signal
  for (let i = 0; i < prev.length; i += stride) {
    sum += Math.abs(prev[i] - curr[i]);
    n++;
  }
  return n ? sum / n : 0;
}

function toGrayscaleDownsampled(
  rgba: { data: Buffer | Uint8Array; width: number; height: number },
  targetW = 80,
): { buf: Buffer; w: number; h: number } {
  const { data, width, height } = rgba;
  const scale = targetW / width;
  const w = targetW;
  const h = Math.max(1, Math.round(height * scale));
  const buf = Buffer.alloc(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.min(width - 1, Math.floor(x / scale));
      const sy = Math.min(height - 1, Math.floor(y / scale));
      const si = (sy * width + sx) * 4;
      buf[y * w + x] = Math.round((data[si] + data[si + 1] + data[si + 2]) / 3);
    }
  }
  return { buf, w, h };
}

export async function extractKeyframes(
  videoPath: string,
  workDir: string,
  opts: { fps: number; maxFrames: number; ffmpegPath: string; ffprobePath: string },
): Promise<Keyframe[]> {
  await fs.mkdir(workDir, { recursive: true });
  const pattern = path.join(workDir, 'cand_%04d.jpg');

  await execFileAsync(opts.ffmpegPath, [
    '-y',
    '-loglevel',
    'error',
    '-i',
    videoPath,
    '-vf',
    `fps=${opts.fps}`,
    '-q:v',
    '4',
    pattern,
  ]);

  const files = (await fs.readdir(workDir))
    .filter((f) => f.startsWith('cand_') && f.endsWith('.jpg'))
    .sort();
  if (files.length === 0) {
    throw new Error('ffmpeg extracted 0 candidate frames — unsupported or corrupt video?');
  }

  const candidates: Keyframe[] = files.map((f, i) => ({
    file: path.join(workDir, f),
    t: Math.round((i / opts.fps) * 100) / 100,
  }));

  if (candidates.length <= opts.maxFrames) return candidates;

  // Motion-weighted selection: highest-motion candidate per temporal segment.
  const jpeg = (await import('jpeg-js')).default;
  const gray: Array<{ buf: Buffer; w: number; h: number }> = [];
  for (const c of candidates) {
    const raw = jpeg.decode(await fs.readFile(c.file), { useTArray: true, maxMemoryUsageInMB: 256 });
    gray.push(toGrayscaleDownsampled({ data: Buffer.from(raw.data), width: raw.width, height: raw.height }));
  }
  const scores = candidates.map((_, i) =>
    i === 0 ? 0 : motionScore(gray[i - 1].buf, gray[i].buf, gray[i].w, gray[i].h),
  );

  const n = opts.maxFrames;
  const segSize = candidates.length / n;
  const picked: Keyframe[] = [];
  for (let s = 0; s < n; s++) {
    const lo = Math.floor(s * segSize);
    const hi = Math.min(candidates.length, Math.floor((s + 1) * segSize));
    let best = lo;
    for (let i = lo + 1; i < hi; i++) {
      if (scores[i] > scores[best]) best = i;
    }
    picked.push(candidates[best]);
  }
  picked.sort((a, b) => a.t - b.t);

  // Clean up unpicked candidates to keep disk use small.
  const pickedSet = new Set(picked.map((p) => p.file));
  await Promise.all(
    candidates.filter((c) => !pickedSet.has(c.file)).map((c) => fs.unlink(c.file).catch(() => {})),
  );
  return picked;
}
