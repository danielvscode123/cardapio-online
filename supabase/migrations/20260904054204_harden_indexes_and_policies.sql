-- Follow-up hardening based on the Supabase security and performance advisors.
create index if not exists menu_items_restaurant_id_idx
on public.menu_items (restaurant_id);

create index if not exists order_items_menu_item_id_idx
on public.order_items (menu_item_id);

create index if not exists order_items_restaurant_id_idx
on public.order_items (restaurant_id);

create index if not exists order_status_history_changed_by_idx
on public.order_status_history (changed_by);

create index if not exists order_status_history_restaurant_id_idx
on public.order_status_history (restaurant_id);

create index if not exists orders_created_by_idx
on public.orders (created_by);

create index if not exists payments_received_by_idx
on public.payments (received_by);

create index if not exists payments_restaurant_id_idx
on public.payments (restaurant_id);

create index if not exists table_sessions_closed_by_idx
on public.table_sessions (closed_by);

create index if not exists table_sessions_opened_by_idx
on public.table_sessions (opened_by);

drop policy if exists menu_categories_manage on public.menu_categories;

create policy menu_categories_insert_manager on public.menu_categories
for insert to authenticated
with check (
  restaurant_id = (select private.current_restaurant_id())
  and (select private.is_manager())
);

create policy menu_categories_update_manager on public.menu_categories
for update to authenticated
using (
  restaurant_id = (select private.current_restaurant_id())
  and (select private.is_manager())
)
with check (
  restaurant_id = (select private.current_restaurant_id())
  and (select private.is_manager())
);

create policy menu_categories_delete_manager on public.menu_categories
for delete to authenticated
using (
  restaurant_id = (select private.current_restaurant_id())
  and (select private.is_manager())
);

drop policy if exists menu_items_manage on public.menu_items;

create policy menu_items_insert_manager on public.menu_items
for insert to authenticated
with check (
  restaurant_id = (select private.current_restaurant_id())
  and (select private.is_manager())
);

create policy menu_items_update_manager on public.menu_items
for update to authenticated
using (
  restaurant_id = (select private.current_restaurant_id())
  and (select private.is_manager())
)
with check (
  restaurant_id = (select private.current_restaurant_id())
  and (select private.is_manager())
);

create policy menu_items_delete_manager on public.menu_items
for delete to authenticated
using (
  restaurant_id = (select private.current_restaurant_id())
  and (select private.is_manager())
);

create or replace function public.claim_initial_manager(p_full_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  claimed_profile public.profiles;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtext('mesa_boa_initial_manager'));

  if (select count(*) from public.profiles) <> 1 then
    raise exception 'Initial manager has already been claimed';
  end if;

  update public.profiles
  set name = trim(p_full_name), role = 'manager', active = true
  where id = current_user_id
    and active = false
  returning * into claimed_profile;

  if claimed_profile.id is null then
    raise exception 'Current user cannot claim manager access';
  end if;

  execute 'revoke execute on function public.claim_initial_manager(text) from authenticated';

  return jsonb_build_object(
    'id', claimed_profile.id,
    'name', claimed_profile.name,
    'role', claimed_profile.role,
    'active', claimed_profile.active
  );
end;
$$;
