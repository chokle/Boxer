// Runtime configuration. Everything is env-driven; no secrets in code.
//
// Required:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optional (defaults shown): POLL_INTERVAL_MS, WORK_DIR, MAX_KEYFRAMES,
//   EXTRACT_FPS, MIN_POSE_SCORE, GUARD_DROP_THRESHOLD, VISION_ENABLED,
//   FREE_MONTHLY_LIMIT, TIER_1_MONTHLY_LIMIT, TIER_2_MONTHLY_LIMIT,
//   FFMPEG_PATH, FFPROBE_PATH

function num(name: string, def: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return def;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`env ${name} must be a positive number, got ${JSON.stringify(v)}`);
  }
  return n;
}

function str(name: string, def?: string): string {
  const v = process.env[name];
  if (v !== undefined && v !== '') return v;
  if (def !== undefined) return def;
  throw new Error(`missing required env var ${name}`);
}

export interface WorkerConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  pollIntervalMs: number;
  workDir: string;
  maxKeyframes: number;
  extractFps: number;
  minPoseScore: number;
  guardDropThreshold: number;
  /** Phase 2b switch. false in 2a: jobs finish at pose metrics, result=null. */
  visionEnabled: boolean;
  ffmpegPath: string;
  ffprobePath: string;
}

let cached: WorkerConfig | null = null;

/**
 * Loads and validates env config. Called once at worker startup
 * (index.ts) — never at import time, so library modules (quota,
 * metrics, pose) stay importable in tests without credentials.
 */
export function getConfig(): WorkerConfig {
  if (cached) return cached;
  const minPoseScore = (() => {
    const v = process.env.MIN_POSE_SCORE;
    if (v === undefined || v === '') return 0.3;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error('MIN_POSE_SCORE must be 0..1');
    return n;
  })();
  const guardDropThreshold = (() => {
    const v = process.env.GUARD_DROP_THRESHOLD;
    if (v === undefined || v === '') return 0.35;
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error('GUARD_DROP_THRESHOLD must be a number');
    return n;
  })();
  cached = {
    supabaseUrl: str('SUPABASE_URL'),
    supabaseServiceKey: str('SUPABASE_SERVICE_ROLE_KEY'),
    pollIntervalMs: num('POLL_INTERVAL_MS', 5000),
    workDir: str('WORK_DIR', '/tmp/boxer-worker'),
    maxKeyframes: num('MAX_KEYFRAMES', 16),
    extractFps: num('EXTRACT_FPS', 2),
    minPoseScore,
    guardDropThreshold,
    visionEnabled: (process.env.VISION_ENABLED ?? 'false').toLowerCase() === 'true',
    ffmpegPath: str('FFMPEG_PATH', 'ffmpeg'),
    ffprobePath: str('FFPROBE_PATH', 'ffprobe'),
  };
  return cached;
}

// ---------------------------------------------------------------------------
// Monetization tiers — monthly analysis limits.
//
// FREE_MONTHLY_LIMIT is the default for new users.
// TIER_1/TIER_2 limits are marked TBD: Derek sets these when pricing is
// finalized. They are env-overridable so no code change is needed.
// byok=true (bring your own OpenAI key) bypasses counting entirely.
// ---------------------------------------------------------------------------
export const FREE_MONTHLY_LIMIT = num('FREE_MONTHLY_LIMIT', 5);
export const TIER_1_MONTHLY_LIMIT = num('TIER_1_MONTHLY_LIMIT', 50); // TBD
export const TIER_2_MONTHLY_LIMIT = num('TIER_2_MONTHLY_LIMIT', 200); // TBD

export function limitForTier(tier: string): number {
  switch (tier) {
    case 'tier_1':
      return TIER_1_MONTHLY_LIMIT;
    case 'tier_2':
      return TIER_2_MONTHLY_LIMIT;
    default:
      return FREE_MONTHLY_LIMIT;
  }
}
