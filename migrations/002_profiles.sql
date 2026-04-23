-- Profiles + Bookings für die Friends-Version.
-- Im Supabase SQL Editor einmal ausführen.

-- === Profile pro User ===
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  vorname text not null,
  nachname text not null,
  telefon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- === Buchungen (eigene Historie) ===
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id int not null,
  course_date timestamptz not null,
  course_name text,
  course_wochentag text,
  course_uhrzeit text,
  course_trainer text,
  course_raum text,
  auto_book boolean not null default false,
  scheduled_target timestamptz,
  status text not null default 'pending' check (status in ('pending','scheduled','confirmed','failed','cancelled','waitlist')),
  external_message text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "Users can read own bookings" on public.bookings;
create policy "Users can read own bookings" on public.bookings
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own bookings" on public.bookings;
create policy "Users can insert own bookings" on public.bookings
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own bookings" on public.bookings;
create policy "Users can update own bookings" on public.bookings
  for update using (auth.uid() = user_id);

create index if not exists idx_bookings_user_date on public.bookings(user_id, course_date desc);

-- === Trigger: updated_at automatisch pflegen ===
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();
