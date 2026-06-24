alter table public.betting_groups
  add column if not exists prize_status text not null default 'pending'
    check (prize_status in ('pending', 'paid', 'no_winner_pending_decision', 'rolled_over', 'refunded')),
  add column if not exists no_winner_decision text
    check (no_winner_decision is null or no_winner_decision in ('rollover', 'refund')),
  add column if not exists rollover_amount_cents integer not null default 0
    check (rollover_amount_cents >= 0),
  add column if not exists prize_decided_at timestamptz,
  add column if not exists prize_decision_note text;
