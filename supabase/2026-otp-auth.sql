create table if not exists public.participant_otps (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists participant_otps_participant_created_idx
  on public.participant_otps(participant_id, created_at desc);

create table if not exists public.participant_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists participant_sessions_participant_idx
  on public.participant_sessions(participant_id, expires_at desc);

alter table public.participant_otps enable row level security;
alter table public.participant_sessions enable row level security;

-- Mutations and reads are intentionally performed through server routes using SUPABASE_SERVICE_ROLE_KEY.
