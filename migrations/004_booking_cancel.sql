-- Erweitert bookings um QStash-Message-ID, damit wir geplante Auto-Bookings
-- wieder stornieren können.
-- Im Supabase SQL Editor nach 002/003 ausführen.

alter table public.bookings
  add column if not exists qstash_message_id text;

create index if not exists idx_bookings_qstash on public.bookings(qstash_message_id)
  where qstash_message_id is not null;
