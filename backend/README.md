# Boxer AI — backend (Phase 2a)

Supabase schema + analysis worker. Phase 2a ships the deterministic
pipeline: **video/photo → keyframes → pose metrics**. The OpenAI vision
layer (punch breakdown, faults, drill mapping) lands in Phase 2b behind
`VISION_ENABLED`.

```
backend/
  supabase/migrations/001_schema.sql   # tables, RLS, storage buckets
  worker/
    src/
      index.ts      # poll loop: claim job → quota → process
      pipeline.ts   # extracting → analyzing → done|failed
      frames.ts     # ffmpeg extraction + motion-weighted keyframe pick
      pose.ts       # MoveNet pose estimation (pure-JS tfjs)
      metrics.ts    # deterministic coaching metrics (pure geometry)
      quota.ts      # monthly quota enforcement
      vision.ts     # Phase 2b stub: runVisionAnalysis() throws in 2a
      supabase.ts   # service-role client + storage adapter
      config.ts     # env config + tier limits
      types.ts
    Dockerfile
    .env.example
```

## 1. Database

Prerequisite: a Supabase project (or `supabase` CLI with a local stack).

Apply the migration:

```bash
# via CLI (from backend/):
supabase db push
# or: paste supabase/migrations/001_schema.sql into the SQL editor.
```

This creates:

- `profiles`, `analyses`, `drills`, `clubs`, `tournaments`, `analysis_usage`
- RLS: users read/write only their own `profiles`/`analyses`/`analysis_usage`;
  `drills`/`clubs`/`tournaments` are public-read, service-role-write.
- Storage buckets `raw-media` and `keyframes` (both private) with
  per-user path policies: objects must live under `<user_id>/…`.

The migration was validated against real Postgres (PGlite): tables,
check constraints, defaults, RLS policies, and bucket inserts all apply.

## 2. Worker

Prerequisites: Node ≥ 20, ffmpeg + ffprobe on PATH.

```bash
cd worker
cp .env.example .env   # fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm install
npm run build
npm start
```

Docker:

```bash
cd worker
docker build -t boxer-ai-worker .
docker run --env-file .env boxer-ai-worker
```

The worker needs network egress to your Supabase project and, on first
start, to TFHub (one-time ~15MB MoveNet download, then cached).

### Status lifecycle

`queued → extracting → analyzing → done`, or `→ failed` with `error`
text. In 2a, `done` means "pose metrics complete" and `result` stays
`null`. The client should render these statuses honestly — no fake
staged progress.

### Storage path contract

The RLS policies require per-user prefixes:

- Client uploads source to `raw-media/<user_id>/…`
- Worker writes `keyframes/<user_id>/<analysis_id>/frame_XXXX.jpg`

### Quota

Enforced at job pickup in `quota.ts`:

- `free`: `FREE_MONTHLY_LIMIT`/month (default 5)
- `tier_1` / `tier_2`: higher limits — **constants marked TBD**;
  Derek sets them when pricing is finalized (env-overridable, no code change).
- `byok=true`: bypasses counting entirely.

Over quota → job `failed` with `error: "quota_exceeded"`. Quota is
consumed at pickup (not on success) so retry-spam isn't free. The
increment uses optimistic locking; a lost race fails closed. Month
buckets are UTC `YYYY-MM`. Rows are created lazily as `free`; the app
server updates `tier`/`byok` on subscribe / key-add.

### pose_metrics JSON shape

Stored in `analyses.pose_metrics` (see `src/types.ts` for the exact type):

```json
{
  "model": "movenet-singlepose-lightning (tfjs cpu backend)",
  "frame_count": 16,
  "frames": [
    {
      "t": 1.5,
      "path": "<user_id>/<analysis_id>/frame_0003.jpg",
      "person_detected": true,
      "pose_score": 0.62,
      "keypoints": { "nose": {"x":0.51,"y":0.22,"score":0.9}, "...": {} },
      "metrics": {
        "guard_height_proxy": 0.83,
        "elbow_angle_left": 92.4,
        "elbow_angle_right": 88.1,
        "stance_width_ratio": 1.5,
        "head_x": 0.49, "head_y": 0.21
      }
    }
  ],
  "summary": {
    "frames_with_person": 14,
    "avg_guard_height": 0.81,
    "min_guard_height": 0.62,
    "guard_drop_events": 3,
    "avg_stance_width": 1.42,
    "head_displacement": 0.18
  }
}
```

Notes:

- `guard_height_proxy` is **normalized, not centimeters**: 1.0 ≈ wrist
  at chin level, 0.5 ≈ chest, ≤0 ≈ dropped. Real-world scale is
  unknowable from one uncalibrated camera — the field name says "proxy"
  on purpose.
- Frames with no confident detection get `person_detected: false` and
  null metrics rather than invented numbers.
- `guard_drop_events` counts frames below `GUARD_DROP_THRESHOLD`.

### Where the OpenAI step plugs in (Phase 2b)

`src/vision.ts` — implement `runVisionAnalysis(keyframes, poseMetrics,
{apiKey, userId})` to return the structured breakdown (contract in the
file's header comment and in `pipeline-design.md`), then set
`VISION_ENABLED=true`. The pipeline already calls it in the right place
and saves the result; the stub currently throws "not implemented in 2a".

## Production notes

- **Throughput**: the pure-JS tfjs CPU backend does ~1.7s/frame
  (16 frames ≈ 30s/analysis). To speed up, swap in `@tensorflow/tfjs-node`
  — `pose-detection` abstracts the runtime, so it's a small change in
  `pose.ts` `load()`. (tfjs-node's native install was fragile in the
  build sandbox, which is why 2a ships the pure-JS backend.)
- **Concurrency**: the claim is atomic (`WHERE status='queued'`), but
  run one worker per queue in 2a; the quota increment is
  optimistic-locked, not a true serializable transaction.
- **Raw media retention**: the design calls for auto-deleting raw video
  7 days after analysis. Not implemented — add a scheduled job
  (`delete from storage.objects where bucket_id='raw-media' and
  created_at < now() - interval '7 days'`) once the app is live.
- **Pre-warming the pose model**: first startup downloads ~15MB from
  TFHub. In Docker, add a build step that imports `pose.ts` and calls
  `load()` once, so the image ships warm.
- **Photo analyses** skip frame extraction (single keyframe, `t: 0`).
