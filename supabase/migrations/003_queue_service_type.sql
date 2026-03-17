-- Add required service_type to queue ('tattoo' | 'piercing')

alter table public.queue
  add column if not exists service_type text;

-- Backfill existing rows (default to tattoo)
update public.queue set service_type = 'tattoo' where service_type is null;

alter table public.queue
  alter column service_type set not null,
  alter column service_type set default 'tattoo';

alter table public.queue
  add constraint queue_service_type_check
  check (service_type in ('tattoo', 'piercing'));
