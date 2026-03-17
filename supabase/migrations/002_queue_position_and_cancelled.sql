-- Add position column and 'cancelled' status to queue

-- Add position (default 0); backfill by added_at within each status
alter table public.queue
  add column if not exists position int4 not null default 0;

-- Backfill position so existing rows keep their relative order per status
with ordered as (
  select id, row_number() over (partition by status order by added_at) - 1 as rn
  from public.queue
)
update public.queue q
set position = ordered.rn
from ordered
where q.id = ordered.id;

-- Allow 'cancelled' in status (drop existing check by type, then add new one)
do $$
declare
  c name;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.queue'::regclass and contype = 'c'
  loop
    execute format('alter table public.queue drop constraint %I', c);
  end loop;
end $$;

alter table public.queue
  add constraint queue_status_check
  check (status in ('waiting', 'notified', 'completed', 'cancelled'));

-- Index for ordering
create index if not exists idx_queue_position on public.queue(status, position);
