-- Credits für Paid-Tier (Stripe-gefüttert)
-- Im Supabase SQL Editor nach 002_profiles.sql ausführen.

create table if not exists public.credit_balance (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits int not null default 0 check (credits >= 0),
  updated_at timestamptz not null default now()
);

alter table public.credit_balance enable row level security;

drop policy if exists "Users can read own balance" on public.credit_balance;
create policy "Users can read own balance" on public.credit_balance
  for select using (auth.uid() = user_id);

-- INSERT/UPDATE nur über Service-Role (Stripe-Webhook), daher keine RLS-Policy dafür.

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,
  reason text not null,
  stripe_session_id text unique,
  course_id int,
  created_at timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;

drop policy if exists "Users can read own transactions" on public.credit_transactions;
create policy "Users can read own transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);

create index if not exists idx_credit_tx_user on public.credit_transactions(user_id, created_at desc);

-- RPC: Credit atomar abziehen (returns {ok, remaining})
create or replace function public.consume_credit(
  p_user_id uuid,
  p_reason text,
  p_course_id int default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_balance int;
begin
  select credits into v_balance from public.credit_balance where user_id = p_user_id for update;
  if v_balance is null or v_balance < 1 then
    return jsonb_build_object('ok', false, 'remaining', coalesce(v_balance, 0));
  end if;
  update public.credit_balance
    set credits = credits - 1, updated_at = now()
    where user_id = p_user_id;
  insert into public.credit_transactions(user_id, delta, reason, course_id)
    values (p_user_id, -1, p_reason, p_course_id);
  return jsonb_build_object('ok', true, 'remaining', v_balance - 1);
end $$;

-- RPC: Credit gutschreiben (vom Stripe-Webhook genutzt — service role only)
create or replace function public.add_credits(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_stripe_session_id text default null
)
returns int language plpgsql security definer as $$
declare
  v_new int;
begin
  insert into public.credit_balance(user_id, credits)
    values (p_user_id, p_amount)
    on conflict (user_id) do update
      set credits = public.credit_balance.credits + p_amount,
          updated_at = now()
    returning credits into v_new;
  insert into public.credit_transactions(user_id, delta, reason, stripe_session_id)
    values (p_user_id, p_amount, p_reason, p_stripe_session_id)
    on conflict (stripe_session_id) do nothing;
  return v_new;
end $$;

-- RPC: Credit zurückgeben (bei QStash-Fehler)
create or replace function public.refund_credit(
  p_user_id uuid,
  p_reason text
)
returns int language plpgsql security definer as $$
declare
  v_new int;
begin
  insert into public.credit_balance(user_id, credits)
    values (p_user_id, 1)
    on conflict (user_id) do update
      set credits = public.credit_balance.credits + 1,
          updated_at = now()
    returning credits into v_new;
  insert into public.credit_transactions(user_id, delta, reason)
    values (p_user_id, 1, p_reason);
  return v_new;
end $$;
