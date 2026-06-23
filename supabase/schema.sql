create extension if not exists pgcrypto;

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  whatsapp text not null check (whatsapp ~ '^55[0-9]{10,11}$'),
  created_at timestamptz not null default now(),
  unique (whatsapp)
);

create table public.betting_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  invite_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  admin_whatsapp text not null check (admin_whatsapp ~ '^55[0-9]{10,11}$'),
  pix_amount_cents integer not null check (pix_amount_cents > 0),
  currency text not null default 'BRL',
  bet_lock_minutes_before_match integer not null default 5,
  status text not null default 'active' check (status in ('active', 'closed')),
  rules jsonb not null default '{"exact_score":10,"result":5,"brazil_goals":2,"opponent_goals":2}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.betting_groups(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'blocked')),
  joined_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (group_id, participant_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.betting_groups(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_payment_id text unique,
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired', 'refunded')),
  pix_qr_code text,
  pix_qr_code_base64 text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  api_football_fixture_id bigint not null unique,
  home_team_id bigint,
  away_team_id bigint,
  home_team text not null,
  away_team text not null,
  starts_at timestamptz not null,
  status text not null default 'scheduled',
  home_score integer not null default 0,
  away_score integer not null default 0,
  elapsed integer,
  last_synced_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table public.group_matches (
  group_id uuid not null references public.betting_groups(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, match_id)
);

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.betting_groups(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  home_score_prediction integer not null check (home_score_prediction >= 0),
  away_score_prediction integer not null check (away_score_prediction >= 0),
  points integer,
  status text not null default 'open' check (status in ('open', 'locked', 'scored')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, participant_id, match_id)
);

create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  api_event_key text not null unique,
  event_type text not null,
  detail text,
  team_id bigint,
  team_name text,
  player_name text,
  elapsed integer,
  extra_time integer,
  home_score_snapshot integer,
  away_score_snapshot integer,
  raw_payload jsonb,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.betting_groups(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete cascade,
  type text not null,
  channel text not null default 'whatsapp',
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  payload jsonb not null,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.participants enable row level security;
alter table public.betting_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.payments enable row level security;
alter table public.matches enable row level security;
alter table public.group_matches enable row level security;
alter table public.bets enable row level security;
alter table public.match_events enable row level security;
alter table public.notifications enable row level security;

create policy "public can read active groups by invite" on public.betting_groups
  for select using (status = 'active');

create policy "public can read matches" on public.matches
  for select using (true);

create policy "public can read group matches" on public.group_matches
  for select using (true);

-- Mutations are intentionally performed through server routes using SUPABASE_SERVICE_ROLE_KEY.
