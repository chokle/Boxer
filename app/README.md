# Boxer AI — App (clean rebuild, Phase 2)

Expo SDK 54 + expo-router + TypeScript. This is a **clean rebuild** that reuses the
original app's routes, structure, and UI copy — not a port of its logic. (The shipped
APK's "AI analysis" was simulated on-device; nothing of that pipeline was kept.)

## What works right now

- Onboarding gate ("Step Into the Ring") → email auth (Supabase)
- 5 tabs mirroring the original: Dashboard, Analyze, Drills, Community, Profile
- Training journal (`/session/new`, `/session/[id]`)
- Analyze flow: pick/record video or photo → choose type (Shadowboxing / Bag Work /
  Sparring) → upload with **real** progress → poll the `analyses` row through honest
  job states (`queued → extracting → analyzing → done | failed`) → results screen
  renders `pose_metrics` + `result` JSON defensively (missing fields are skipped,
  never faked)
- Drills: reads the bundled `../drills/drills.json`; completion tracking goes to
  Supabase when signed in, AsyncStorage otherwise
- Community: Gyms → `clubs` table, Tournaments → `tournaments` table, Fighters →
  honest "coming soon"
- Profile: photo (expo-image-picker), style / weight-class / experience pickers,
  injury log → `profiles` / `injuries` tables with AsyncStorage fallback
- If Supabase isn't configured, screens say **"analysis service not connected"**
  plainly instead of simulating anything

## Setup

1. **Install**
   ```bash
   cd app
   npm install
   ```
2. **Backend** — create a Supabase project, then run the schema:
   - SQL editor → paste `../backend/schema.sql` (tables, RLS, `raw-media` /
     `keyframes` / `profile-photos` buckets)
   - Seed clubs: import `../seed/clubs.json` into the `clubs` table
3. **Env**
   ```bash
   cp .env.example .env
   # fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
   ```
4. **Run**
   ```bash
   npx expo start
   ```
   (Needs a dev build for camera/library: `npx expo run:android` / `run:ios`, or EAS.)

## Project layout

```
app/            ← this Expo app (routes, components, lib)
backend/        ← Supabase schema (schema.sql)
drills/         ← drills.json (bundled library; empty until authored) + README
reference/      ← APK extraction: APP_MAP.md, string_table.txt, app.config
seed/           ← clubs.json (30 verified Metro Vancouver clubs), tournaments.md
pipeline-design.md
```

## Contract with the backend (see pipeline-design.md)

- `analyses(id, user_id, media_path, keyframe_paths[], status, pose_metrics, result)`
- Storage buckets: `raw-media`, `keyframes`
- Job statuses: `queued` / `extracting` / `analyzing` / `done` / `failed`
- Uploads go to `raw-media/<user_id>/<timestamp>.<ext>` via signed URL + XHR PUT

## Still needed for end-to-end

1. **Analysis worker** (not in this repo yet): polls `analyses` where
   `status='queued'`, runs ffmpeg frame extraction → MediaPipe pose metrics →
   writes `keyframe_paths` + `pose_metrics`, sets `status='done'` (or `failed`
   with `error`). Phase 2b adds the vision-LLM layer writing `result`.
2. **Supabase project** with the schema applied and env vars set.
3. **Drill library content** (`drills/drills.json` + `drills` table seed) — needs
   real boxing coaching review.
4. EAS project / build profiles for store builds (`com.boxerai.app`).

## Permissions

Camera + photo library only. No location, no microphone (the image-picker config
explicitly sets `microphonePermission: false`), no background services.
Location can come back in Phase 3 to justify "gyms near me".
