-- Phase 2 Schema für das Credit-System (Supabase / Postgres)
-- Wird erst benötigt sobald FREE_MODE=false und Paid-Tier live geht.

create extension if not exists "pgcrypto";

-- Users (falls nicht Supabase Auth verwendet wird, sonst weglassen)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz not null default now()
);

-- Credit-Saldo (1 Zeile pro User)
create table if not exists public.credit_balance (
  user_id uuid primary key references public.users(id) on delete cascade,
  credits int not null default 0 check (credits >= 0),
  monthly_allowance int not null default 0,
  next_refill_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Transaktionen (Audit-Log)
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  delta int not null,
  reason text not null,
  stripe_session_id text,
  course_id int,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_tx_user on public.credit_transactions(user_id, created_at desc);

-- Geplante Auto-Bookings (Verknüpfung zu QStash-Message)
create table if not exists public.scheduled_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  course_id int not null,
  course_date timestamptz not null,
  target_time timestamptz not null,
  qstash_message_id text,
  status text not null default 'scheduled' check (status in ('scheduled','executed','failed','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_sched_user on public.scheduled_bookings(user_id, target_time);

-- RPC: Credit atomar konsumieren
create or replace function public.consume_credit(p_user_id uuid, p_reason text, p_course_id int default null)
returns table(ok boolean, remaining int) language plpgsql as $$
declare
  v_balance int;
begin
  select credits into v_balance from public.credit_balance where user_id = p_user_id for update;
  if v_balance is null or v_balance < 1 then
    return query select false, coalesce(v_balance, 0);
    return;
  end if;
  update public.credit_balance set credits = credits - 1, updated_at = now() where user_id = p_user_id;
  insert into public.credit_transactions(user_id, delta, reason, course_id) values (p_user_id, -1, p_reason, p_course_id);
  return query select true, v_balance - 1;
end $$;

-- RPC: Credits gutschreiben (Stripe-Webhook)
create or replace function public.add_credits(p_user_id uuid, p_amount int, p_reason text, p_stripe_session_id text default null)
returns int language plpgsql as $$
declare
  v_new int;
begin
  insert into public.credit_balance(user_id, credits)
    values (p_user_id, p_amount)
    on conflict (user_id) do update set credits = credit_balance.credits + p_amount, updated_at = now()
    returning credits into v_new;
  insert into public.credit_transactions(user_id, delta, reason, stripe_session_id)
    values (p_user_id, p_amount, p_reason, p_stripe_session_id);
  return v_new;
end $$;
