-- RPC: Move a queue entry to a new status (column) and recalculate positions.
-- 1. Set the entry's status and position (end of new column; -1 if cancelled).
-- 2. Gap-fill the old column: decrement position for everyone with position > old position.

create or replace function public.move_queue_entry(
  p_queue_id uuid,
  p_new_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status text;
  v_old_position int4;
  v_new_position int4;
begin
  select status, position into v_old_status, v_old_position
  from public.queue
  where id = p_queue_id
  for update;

  if not found then
    return;
  end if;

  if v_old_status = p_new_status then
    return; /* no-op */
  end if;

  if p_new_status = 'cancelled' then
    update public.queue
    set status = 'cancelled', position = -1
    where id = p_queue_id;
  else
    select coalesce(max(position), -1) + 1 into v_new_position
    from public.queue
    where status = p_new_status;

    update public.queue
    set status = p_new_status, position = v_new_position
    where id = p_queue_id;
  end if;

  /* gap-fill old column */
  update public.queue
  set position = position - 1
  where status = v_old_status and position > v_old_position;
end;
$$;
