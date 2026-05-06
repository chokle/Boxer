# Boxer AI

AI-powered boxing coaching app for performance analysis, drill recommendations, gym discovery, fighter rankings, and tournament tracking.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed-community` — seed gyms/fighters/tournaments
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

Required env vars: `DATABASE_URL`, `EXPO_PUBLIC_DOMAIN`, `EXPO_PUBLIC_REPL_ID`

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24 · **TypeScript**: 5.9
- **Mobile**: Expo SDK 54, expo-router, Reanimated, expo-linear-gradient
- **API**: Express 5, esbuild (CJS bundle)
- **Database**: PostgreSQL + Drizzle ORM + drizzle-zod
- **AI**: OpenAI GPT-4o via `@workspace/integrations-openai-ai-server`
- **Validation**: Zod v4

## Where things live

- `artifacts/mobile/` — Expo React Native app
  - `app/(tabs)/` — tab screens: index, analyze, drills, community, profile
  - `components/IntroVideo.tsx` — 6s boxing intro overlay (web=WebM, native=MP4)
  - `context/BoxingContext.tsx` — session state + AsyncStorage
  - `lib/aiCoach.ts` — API client for analysis
- `artifacts/api-server/src/routes/` — Express routes (analyze, community, health)
- `lib/db/src/schema/` — Drizzle schema: gyms, fighters, tournaments
- `artifacts/mobile/public/` — static assets: intro.webm, intro.mp4, intro.webm

## Architecture decisions

- **Dual video format**: `intro.webm` (VP9) served for web/headless Chromium; `intro.mp4` (H.264) bundled via `require()` for native — headless Chromium lacks proprietary codec support
- **Media-optional analysis**: AI can analyze boxing performance from images alone, or from description alone, or both — match_description is no longer required
- **Community DB seeded**: 5 gyms, 19 fighters across weight classes/levels, 5 upcoming tournaments — opponent matching uses win-rate proximity query
- **AsyncStorage sessions**: boxing sessions stored on-device (no user auth required)
- **Path-based proxy**: all services routed through shared reverse proxy; mobile at `/`, API at `/api`

## Product

- **Analyze**: upload photos/videos OR write a match summary (or both) → GPT-4o returns scores (stance, offense, defense, footwork, combos) + drill plan
- **Drills**: personalized drill recommendations from analysis
- **Community**: local gym directory, fighter rankings (amateur→pro by weight class), upcoming tournaments, opponent matching by win-rate
- **Dashboard**: session history, performance trends, streaks

## User preferences

- Brand color: `#fb923c` (orange/primary)
- Intro video: 6s boxing clip with "BOXER · AI / Step Into the Ring" overlay, skip button at 1.5s

## Gotchas

- Do NOT use `pnpm run dev` at workspace root — use `restart_workflow` instead
- Do NOT edit `artifact.toml` directly — use `verifyAndReplaceArtifactToml`
- API server uses `req.log` (pino), never `console.log`
- Expo web preview uses headless Chromium — H.264/AAC MP4 will fail; always serve WebM for web

## Pointers

- Pnpm workspace skill: `.local/skills/pnpm-workspace/`
- Expo skill: `.local/skills/expo/`
