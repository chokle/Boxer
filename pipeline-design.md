# Boxer AI — Coaching Pipeline Design

Date: 2026-09-23. Phase 1 design for the rebuild. The shipped APK's
"AI analysis" was simulated on-device with no backend; this design
replaces it with a real pipeline. UI copy, routes, and the 5-tab
structure from `reference/` are reused; everything below is new.

## Architecture

```
Phone (Expo app)                Backend (Supabase + worker)
─────────────────               ──────────────────────────
Record/pick video or photo
        │                       1. Upload → Supabase Storage
        │                          (720p cap, chunked upload)
        ▼                       2. Job queued (analyses table,
Pick analysis type:             status=queued → processing)
 - Shadowboxing form check      3. Worker: ffmpeg extracts
 - Bag/pad work review             8–16 keyframes @ ~2fps
 - Sparring breakdown           4. Pose estimation (MediaPipe):
        │                          joint angles, guard height,
        ▼                          stance width, hip rotation
   Poll / push when done        5. Vision LLM: frames + pose
                                   metrics + coaching rubric
                                6. Structured JSON result:
                                   punch events w/ timestamps,
                                   per-category scores,
                                   faults → drill mapping
                                7. Results saved, history updated
```

Analysis is **async by design**: upload returns immediately, a job
runs server-side (30–120s), results arrive via push/realtime. No
fake staged progress — the client shows honest job status
(queued → extracting → analyzing → done) with real progress events.

## Why two layers (pose + vision LLM)

- **Pose estimation is deterministic.** MediaPipe pose landmarks give
  measurable facts: guard height relative to chin, elbow flare angle,
  stance width, weight distribution, head displacement between frames.
  No hallucination possible.
- **Vision LLM gives coaching judgment** the pose data can't: punch
  identification, combination fluidity, timing, defensive reads,
  intent. It receives the frames AND the pose metrics, so its
  feedback is grounded in measurements, not vibes.
- Scores are presented as coaching guidance with confidence notes,
  never as ground truth. The old app faked certainty; this one
  doesn't.

## Data flow details

1. **Capture.** `expo-image-picker` / `expo-camera` for video+photo.
   Client compresses to 720p before upload (keeps uploads fast on
   mobile data). Max 90 seconds per analysis.
2. **Storage.** Supabase Storage bucket `raw-media`, per-user paths,
   signed URLs. Auto-delete raw video 7 days after analysis (keep
   keyframes + results; saves storage cost, honest privacy story).
3. **Frame extraction.** Worker runs ffmpeg, extracts ~2fps up to
   16 frames, evenly spaced plus motion-weighted picks (frames with
   most inter-frame difference get priority — punches are fast).
4. **Pose.** MediaPipe Pose (server-side, or on-device TF Lite later
   as an optimization) → per-frame 33 landmarks → derived metrics:
   guard height, chin tuck proxy, elbow angles, stance width,
   hip/shoulder rotation, head movement amplitude.
5. **Vision analysis.** Prompt = coaching rubric + frames + pose
   metrics. Model returns strict JSON (validated server-side):
   ```json
   {
     "punches": [{"type": "jab", "t0": 1.2, "t1": 1.6,
                  "notes": "…", "score": 7}],
     "categories": {"stance": 6, "guard": 5, "footwork": 7,
                    "head_movement": 4, "combinations": 6},
     "faults": [{"fault": "drops right hand on cross",
                 "severity": "high", "frames": [3, 7],
                 "cue": "…"}],
     "drill_ids": ["guard-retention-2", "slip-rope-1"]
   }
   ```
6. **Drill mapping.** Faults map to a seeded drill library
   (~50 drills authored as content: instructions, sets/reps,
   coaching points). Deterministic lookup, not LLM-generated —
   drills must be safe and correct every time.
7. **History.** `analyses` table per user; scores over time feed
   the Dashboard's progress charts (replaces the fake
   PerformanceChart with real data).

## Backend shape

- **Supabase**: auth, Postgres, Storage. Replaces AsyncStorage-only
  local data (keep AsyncStorage as offline cache, not source of
  truth).
- **Worker**: small Node service (or Supabase Edge Function +
  external job runner — Edge Functions cap execution time, so a
  dedicated worker with a queue is safer for 60–120s jobs).
- **Queue**: Postgres-backed job table with `pgmq`-style polling,
  or a hosted queue. v1: simple status-polled table is fine.

## Cost estimate (per analysis)

- Storage: negligible (720p, 7-day retention).
- Vision LLM: ~16 frames + prompt ≈ the dominant cost; roughly
  $0.05–0.25/analysis depending on provider and frame count.
  Mitigations: 2fps cap, 720p frames, cache nothing (each video
  is unique). Free tier: N analyses/month, then paywall or
  bring-your-own-key — Derek's call.
- Pose: free (open source, own compute).

## Phases

- **Phase 2a**: upload → job queue → worker → frame extraction →
  pose metrics → results screen showing measured metrics only.
  (Real value, no LLM cost yet — "your guard drops 12cm on
  every cross" is already coaching.)
- **Phase 2b**: add vision LLM layer → full breakdown JSON →
  faults → drill recommendations → progress history.
- **Phase 3**: club/gym directory (seeded, `seed/clubs.json`),
  fighter rosters (club-claimed profiles), tournament listings
  (scraped from Boxing BC / Boxing Canada calendars — no API
  exists; store registration URL + deadline text, don't try to
  normalize registration flows in v1).

## Permissions (corrected from APK)

- Keep: camera, photo library, network.
- Add back only when justified: location → justified for
  "gyms near me" in Phase 3. Microphone → only if we add
  coach voice notes. Draw-over-apps → never.
- Strip: expo-location background service, SYSTEM_ALERT_WINDOW.

## Decisions (2026-09-23, Derek)

1. **Vision provider: OpenAI.**
2. **Clean rebuild** reusing the extracted UI copy/routes from `reference/` — not a port of the APK logic.
3. **Monetization**: limited free analyses/month; subscription unlocks more across 2 paid tiers; BYOK (bring your own OpenAI key) also supported.
4. **Drill library**: Dot researches real boxing coaching content online and authors the ~50-drill library grounded in it (paraphrased, not copied).

## Data contract (app ↔ backend)

- **Tables**: `profiles` (id→auth.users, display_name, weight_class, experience, stance), `analyses` (id, user_id, media_path, keyframe_paths[], status, pose_metrics jsonb, result jsonb), `drills` (id, title, instructions, sets_reps, coaching_points[], targets_faults[]), `clubs` (seeded), `tournaments` (seeded/scraped), `analysis_usage` (user_id, month, count, tier, byok).
- **Storage**: `raw-media` (private, per-user; auto-delete 7d), `keyframes` (private).
- **Job statuses**: `queued → extracting → analyzing → done | failed`. Client shows these honestly.
- **Tiers**: free (5 analyses/mo default), tier_1, tier_2 (names/limits TBD), byok flag bypasses quota counting.

## Open decisions for Derek

~~All decided 2026-09-23: OpenAI for vision; clean rebuild reusing extracted copy; limited free analyses + 2 paid subscription tiers + BYOK; Dot researches and authors the drill library from real coaching sources.~~
