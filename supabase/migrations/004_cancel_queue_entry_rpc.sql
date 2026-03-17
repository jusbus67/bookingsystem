-- RPC: Cancel a queue entry and fill the position gap in one transaction.
-- 1. Set the cancelled row to status = 'cancelled', position = -1.
-- 2. Decrement position by 1 for every other row in the same column (status) with position > cancelled position.

create or replace function public.cancel_queue_entry(p_queue_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_position int4;
begin
  select status, position into v_status, v_position
  from public.queue
  where id = p_queue_id
  for update;

  if not found then
    return;
  end if;

  update public.queue
  set status = 'cancelled', position = -1
  where id = p_queue_id;

  update public.queue
  set position = position - 1
  where status = v_status and position > v_position;
end;
$$;
