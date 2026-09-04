alter table public.profiles
add column deleted_at timestamptz;

alter table public.profiles
add constraint profiles_deleted_must_be_inactive
check (deleted_at is null or active = false);

create index profiles_active_employees_idx
on public.profiles (restaurant_id, name)
where role = 'employee' and deleted_at is null;

drop policy profiles_select_coworkers on public.profiles;

create policy profiles_select_coworkers on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or (
    restaurant_id = (select private.current_restaurant_id())
    and deleted_at is null
  )
);

comment on column public.profiles.deleted_at is
'Timestamp used to archive employee access while preserving operational history.';
