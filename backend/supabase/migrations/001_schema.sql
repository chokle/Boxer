-- Boxer AI backend schema — Phase 2 (reconciled 2026-09-23)
-- Canonical schema. An older draft at backend/schema.sql is superseded by this file.
-- Run via: supabase db push  (or paste into the Supabase SQL editor)
--
-- Conventions:
--   * All app tables live in `public`.
--   * `auth.users` is managed by Supabase Auth; user-owned tables
--     reference it with ON DELETE CASCADE.
--   * Service role (the analysis worker) bypasses RLS; end-user clients
--     go through the policies below.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  name          text,
  boxing_style  text,      -- Orthodox | Southpaw | Brawler | Counter-Puncher | ...
  weight_class  text,      -- Mini Flyweight … Heavyweight
  experience    text,      -- Beginner | Intermediate | Amateur | Pro
  stance        text,      -- 'orthodox' | 'southpaw' | 'switch'
  photo_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- injuries
-- Profile injury log.
create table public.injuries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  body_part   text not null,   -- Head | Neck | Shoulder | Elbow | Ribs | Hip | Knee
  description text,
  created_at  timestamptz not null default now()
);
create index injuries_user_idx on public.injuries (user_id, created_at desc);

-- ---------------------------------------------------------------- analyses
-- Job queue + results. Status lifecycle:
--   queued -> extracting -> analyzing -> done
--                                          \-> failed
-- In Phase 2a `result` stays null and `done` means "pose metrics complete".
-- Phase 2b fills `result` via the OpenAI vision step.
create table public.analyses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  media_path     text not null,   -- path inside the raw-media bucket, "<user_id>/…"
  media_type     text not null default 'video'
                   check (media_type in ('video', 'photo')),
  analysis_type  text,            -- 'shadowboxing' | 'bag' | 'sparring'
  keyframe_paths text[] not null default '{}',  -- paths inside keyframes bucket
  status         text not null default 'queued'
                   check (status in ('queued', 'extracting', 'analyzing', 'done', 'failed')),
  pose_metrics   jsonb,           -- Phase 2a output (see worker/src/metrics.ts)
  result         jsonb,           -- Phase 2b output (OpenAI structured breakdown)
  error          text,            -- failure reason when status = 'failed'
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Worker pickup: find oldest queued job fast.
create index analyses_pickup_idx
  on public.analyses (created_at)
  where status = 'queued';
-- User history view.
create index analyses_user_idx
  on public.analyses (user_id, created_at desc);

-- ---------------------------------------------------------------- sessions
-- Training journal.
create table public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text,
  context    text,
  notes      text,
  media_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sessions_user_idx on public.sessions (user_id, created_at desc);

-- ------------------------------------------------------------------- drills
-- Seeded drill library (content authored from real coaching sources).
-- `id` is a stable slug, e.g. 'guard-retention-2'.
create table public.drills (
  id              text primary key,
  title           text not null,
  instructions    text[] not null default '{}',
  sets_reps       text,
  coaching_points text[] not null default '{}',
  targets_faults  text[] not null default '{}',  -- fault slugs this drill fixes
  difficulty      text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  equipment       text,          -- e.g. 'heavy bag', 'none', 'slip rope'
  category        text           -- e.g. 'footwork', 'defense', 'combinations'
);

-- ------------------------------------------------------- drill_completions
create table public.drill_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  drill_id     text not null references public.drills (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, drill_id)
);

-- -------------------------------------------------------------------- clubs
-- Gym directory, seeded from seed/clubs.json (Phase 3).
create table public.clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  city        text,
  website     text,
  phone       text,
  email       text,
  specialties text[] not null default '{}',
  lat         double precision,
  lng         double precision,
  verified    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index clubs_city_idx on public.clubs (city);

-- -------------------------------------------------------------- tournaments
-- Scraped from Boxing BC / Boxing Canada calendars (Phase 3).
-- Registration is fragmented across providers, so we store the URL +
-- deadline text rather than normalizing flows.
create table public.tournaments (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  organizer        text,   -- e.g. 'Boxing BC'
  starts_at        timestamptz,
  ends_at          timestamptz,
  location         text,
  registration_url text,
  deadline_text    text,   -- free-text deadline/eligibility (v1)
  source_url       text,
  created_at       timestamptz not null default now()
);
create index tournaments_starts_idx on public.tournaments (starts_at);

-- ----------------------------------------------------------- analysis_usage
-- Monthly quota ledger. One row per (user, YYYY-MM). The worker
-- upserts + increments atomically at job pickup.
create table public.analysis_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month   text not null,                    -- 'YYYY-MM'
  count   integer not null default 0,
  tier    text not null default 'free'
            check (tier in ('free', 'tier_1', 'tier_2')),
  byok    boolean not null default false,   -- bring-your-own-key: skips counting
  primary key (user_id, month)
);

-- ================================================================ RLS ====
alter table public.profiles           enable row level security;
alter table public.injuries           enable row level security;
alter table public.analyses           enable row level security;
alter table public.sessions           enable row level security;
alter table public.drills             enable row level security;
alter table public.drill_completions  enable row level security;
alter table public.clubs              enable row level security;
alter table public.tournaments        enable row level security;
alter table public.analysis_usage     enable row level security;

-- Users manage their own rows.
create policy profiles_owner on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy injuries_owner on public.injuries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy analyses_owner on public.analyses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy sessions_owner on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy drill_completions_owner on public.drill_completions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can read their own usage; the worker (service role) writes it.
create policy analysis_usage_owner_read on public.analysis_usage
  for select
  using (auth.uid() = user_id);

-- Reference content is public read, service-role write.
create policy drills_public_read on public.drills
  for select using (true);
create policy clubs_public_read on public.clubs
  for select using (true);
create policy tournaments_public_read on public.tournaments
  for select using (true);

-- ============================================================ storage ====
-- Private buckets; objects live under "<user_id>/…" paths.

insert into storage.buckets (id, name, public)
values
  ('raw-media', 'raw-media', false),
  ('keyframes', 'keyframes', false),
  ('profile-photos', 'profile-photos', false)
on conflict (id) do nothing;

-- raw-media: users can manage objects under their own folder.
create policy raw_media_owner on storage.objects
  for all
  using (
    bucket_id = 'raw-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'raw-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- keyframes: users can read their own; the worker (service role) writes.
create policy keyframes_owner_read on storage.objects
  for select
  using (
    bucket_id = 'keyframes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- profile-photos: users manage their own.
create policy profile_photos_owner on storage.objects
  for all
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================== updated_at trigger ====
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger analyses_touch
  before update on public.analyses
  for each row execute function public.touch_updated_at();

create trigger sessions_touch
  before update on public.sessions
  for each row execute function public.touch_updated_at();
