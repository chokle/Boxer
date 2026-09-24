-- SUPERSEDED 2026-09-23 — do not use. The canonical schema is
-- backend/supabase/migrations/001_schema.sql (validated). This draft
-- is kept only for reference.
--
-- Boxer AI — Supabase schema (Phase 2)
-- Run in the Supabase SQL editor. Idempotent-ish: uses IF NOT EXISTS
-- where safe. Storage buckets are created below via storage API
-- inserts (works in SQL editor).

-- ── profiles ────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text,
  boxing_style text,      -- Orthodox | Southpaw | Brawler | Counter-Puncher | Aggressive | Defensive | Balanced
  weight_class text,       -- Mini Flyweight … Heavyweight
  experience text,         -- Beginner | Intermediate | Amateur | Pro
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── injuries (profile injury log) ───────────────────────────────
create table if not exists public.injuries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body_part text not null,  -- Head | Neck | Shoulder | Elbow | Ribs | Hip | Knee
  description text,
  created_at timestamptz default now()
);
create index if not exists injuries_user_idx on public.injuries (user_id);

-- ── analyses (coaching pipeline jobs) ───────────────────────────
-- status: queued → extracting → analyzing → done | failed
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  analysis_type text not null,        -- shadowboxing | bag_work | sparring
  media_path text not null,           -- path in raw-media bucket
  keyframe_paths text[] default '{}', -- paths in keyframes bucket
  status text not null default 'queued'
    check (status in ('queued','extracting','analyzing','done','failed')),
  pose_metrics jsonb,                 -- MediaPipe-derived metrics (Phase 2a)
  result jsonb,                       -- vision-LLM structured breakdown (Phase 2b)
  error text,                         -- failure reason when status = failed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists analyses_user_idx on public.analyses (user_id, created_at desc);
create index if not exists analyses_status_idx on public.analyses (status) where status in ('queued','extracting','analyzing');

-- ── sessions (training journal) ─────────────────────────────────
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  context text,
  notes text,
  media_urls text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists sessions_user_idx on public.sessions (user_id, created_at desc);

-- ── drills (seeded library; content authored separately) ─────────
create table if not exists public.drills (
  id text primary key,                -- e.g. 'guard-retention-2'
  title text not null,
  category text,                      -- footwork | defense | offense | conditioning
  difficulty text,                    -- beginner | intermediate | advanced
  instructions text not null,
  sets_reps text,
  coaching_points text[] default '{}',
  for_faults text[] default '{}'      -- fault keys this drill corrects
);

-- ── drill completions ───────────────────────────────────────────
create table if not exists public.drill_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  drill_id text not null references public.drills (id) on delete cascade,
  completed_at timestamptz default now(),
  unique (user_id, drill_id)
);

-- ── clubs (gym directory; seeded from ../seed/clubs.json) ───────
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  website text,
  phone text,
  email text,
  specialties text[] default '{}',
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now()
);

-- ── tournaments ─────────────────────────────────────────────────
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organizer text,                     -- e.g. 'Boxing BC'
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  registration_url text,
  deadline_text text,                 -- free-text deadline/eligibility (v1)
  source_url text,
  created_at timestamptz default now()
);
create index if not exists tournaments_starts_idx on public.tournaments (starts_at);

-- ── Row Level Security ──────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.injuries enable row level security;
alter table public.analyses enable row level security;
alter table public.sessions enable row level security;
alter table public.drill_completions enable row level security;
alter table public.drills enable row level security;
alter table public.clubs enable row level security;
alter table public.tournaments enable row level security;

-- Users own their rows.
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own injuries" on public.injuries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own analyses" on public.analyses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own drill completions" on public.drill_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Drill library, clubs, tournaments are public read; writes via service role.
create policy "public read drills" on public.drills for select using (true);
create policy "public read clubs" on public.clubs for select using (true);
create policy "public read tournaments" on public.tournaments for select using (true);

-- ── Storage buckets ─────────────────────────────────────────────
insert into storage.buckets (id, name, public) values
  ('raw-media', 'raw-media', false),
  ('keyframes', 'keyframes', false),
  ('profile-photos', 'profile-photos', false)
on conflict (id) do nothing;

-- Private buckets: users read/write only their own folder (<uid>/…).
create policy "own raw media" on storage.objects
  for all using (bucket_id = 'raw-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'raw-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own keyframes" on storage.objects
  for all using (bucket_id = 'keyframes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'keyframes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own profile photos" on storage.objects
  for all using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
