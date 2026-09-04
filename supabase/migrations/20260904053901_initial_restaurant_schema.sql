-- Initial schema applied to the hosted CardapioOnline project.
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.user_role as enum ('employee', 'manager');
create type public.table_status as enum ('available', 'occupied');
create type public.session_status as enum ('open', 'closed', 'cancelled');
create type public.order_status as enum ('sent', 'preparing', 'ready', 'delivered', 'cancelled');
create type public.payment_method as enum ('cash', 'pix', 'credit', 'debit', 'other');

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  currency char(3) not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 80),
  email text not null,
  role public.user_role not null default 'employee',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  number smallint not null check (number > 0),
  label text,
  seats smallint not null default 4 check (seats between 1 and 30),
  status public.table_status not null default 'available',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, number)
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 60),
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text,
  price numeric(12, 2) not null check (price >= 0),
  position integer not null default 0,
  active boolean not null default true,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  table_id uuid not null references public.dining_tables(id) on delete restrict,
  opened_by uuid not null references public.profiles(id) on delete restrict,
  closed_by uuid references public.profiles(id) on delete restrict,
  status public.session_status not null default 'open',
  guest_count smallint not null default 1 check (guest_count between 1 and 99),
  notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint closed_session_has_timestamp check (
    (status = 'open' and closed_at is null)
    or (status <> 'open' and closed_at is not null)
  )
);

create unique index one_open_session_per_table
  on public.table_sessions (table_id)
  where status = 'open';

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  table_session_id uuid not null references public.table_sessions(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  status public.order_status not null default 'sent',
  notes text,
  idempotency_key uuid not null default gen_random_uuid(),
  sent_at timestamptz not null default now(),
  preparing_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, idempotency_key)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity smallint not null check (quantity between 1 and 99),
  notes text,
  subtotal numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  table_session_id uuid not null references public.table_sessions(id) on delete restrict,
  received_by uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12, 2) not null check (amount >= 0),
  method public.payment_method not null,
  created_at timestamptz not null default now()
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  status public.order_status not null,
  changed_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index profiles_restaurant_id_idx on public.profiles (restaurant_id);
create index dining_tables_restaurant_status_idx on public.dining_tables (restaurant_id, status) where active;
create index menu_categories_restaurant_position_idx on public.menu_categories (restaurant_id, position) where active;
create index menu_items_category_position_idx on public.menu_items (category_id, position) where active;
create index table_sessions_restaurant_status_idx on public.table_sessions (restaurant_id, status, opened_at desc);
create index orders_session_created_idx on public.orders (table_session_id, created_at desc);
create index orders_restaurant_status_idx on public.orders (restaurant_id, status, created_at);
create index order_items_order_id_idx on public.order_items (order_id);
create index payments_session_id_idx on public.payments (table_session_id);
create index order_status_history_order_id_idx on public.order_status_history (order_id, created_at);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger restaurants_set_updated_at
before update on public.restaurants
for each row execute function private.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger dining_tables_set_updated_at
before update on public.dining_tables
for each row execute function private.set_updated_at();

create trigger menu_categories_set_updated_at
before update on public.menu_categories
for each row execute function private.set_updated_at();

create trigger menu_items_set_updated_at
before update on public.menu_items
for each row execute function private.set_updated_at();

create trigger table_sessions_set_updated_at
before update on public.table_sessions
for each row execute function private.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function private.set_updated_at();

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_restaurant_id uuid;
begin
  select id into target_restaurant_id
  from public.restaurants
  order by created_at
  limit 1;

  if target_restaurant_id is null then
    raise exception 'Restaurant setup is incomplete';
  end if;

  insert into public.profiles (id, restaurant_id, name, email, role, active)
  values (
    new.id,
    target_restaurant_id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    'employee',
    false
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create function private.current_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select restaurant_id
  from public.profiles
  where id = (select auth.uid())
    and active = true
$$;

create function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select role = 'manager'
    from public.profiles
    where id = (select auth.uid())
      and active = true
  ), false)
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.current_restaurant_id() to authenticated;
grant execute on function private.is_manager() to authenticated;

alter table public.restaurants enable row level security;
alter table public.profiles enable row level security;
alter table public.dining_tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.table_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.order_status_history enable row level security;

create policy restaurants_select on public.restaurants
for select to authenticated
using (id = (select private.current_restaurant_id()));

create policy restaurants_update_manager on public.restaurants
for update to authenticated
using (id = (select private.current_restaurant_id()) and (select private.is_manager()))
with check (id = (select private.current_restaurant_id()) and (select private.is_manager()));

create policy profiles_select_coworkers on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or restaurant_id = (select private.current_restaurant_id())
);

create policy dining_tables_select on public.dining_tables
for select to authenticated
using (restaurant_id = (select private.current_restaurant_id()));

create policy dining_tables_insert_manager on public.dining_tables
for insert to authenticated
with check (restaurant_id = (select private.current_restaurant_id()) and (select private.is_manager()));

create policy dining_tables_update on public.dining_tables
for update to authenticated
using (restaurant_id = (select private.current_restaurant_id()))
with check (restaurant_id = (select private.current_restaurant_id()));

create policy dining_tables_delete_manager on public.dining_tables
for delete to authenticated
using (restaurant_id = (select private.current_restaurant_id()) and (select private.is_manager()));

create policy menu_categories_select on public.menu_categories
for select to authenticated
using (restaurant_id = (select private.current_restaurant_id()));

create policy menu_categories_manage on public.menu_categories
for all to authenticated
using (restaurant_id = (select private.current_restaurant_id()) and (select private.is_manager()))
with check (restaurant_id = (select private.current_restaurant_id()) and (select private.is_manager()));

create policy menu_items_select on public.menu_items
for select to authenticated
using (restaurant_id = (select private.current_restaurant_id()));

create policy menu_items_manage on public.menu_items
for all to authenticated
using (restaurant_id = (select private.current_restaurant_id()) and (select private.is_manager()))
with check (restaurant_id = (select private.current_restaurant_id()) and (select private.is_manager()));

create policy table_sessions_select on public.table_sessions
for select to authenticated
using (restaurant_id = (select private.current_restaurant_id()));

create policy table_sessions_insert on public.table_sessions
for insert to authenticated
with check (
  restaurant_id = (select private.current_restaurant_id())
  and opened_by = (select auth.uid())
);

create policy table_sessions_update on public.table_sessions
for update to authenticated
using (restaurant_id = (select private.current_restaurant_id()))
with check (restaurant_id = (select private.current_restaurant_id()));

create policy orders_select on public.orders
for select to authenticated
using (restaurant_id = (select private.current_restaurant_id()));

create policy orders_insert on public.orders
for insert to authenticated
with check (
  restaurant_id = (select private.current_restaurant_id())
  and created_by = (select auth.uid())
);

create policy orders_update on public.orders
for update to authenticated
using (restaurant_id = (select private.current_restaurant_id()))
with check (restaurant_id = (select private.current_restaurant_id()));

create policy order_items_select on public.order_items
for select to authenticated
using (restaurant_id = (select private.current_restaurant_id()));

create policy order_items_insert on public.order_items
for insert to authenticated
with check (restaurant_id = (select private.current_restaurant_id()));

create policy payments_select on public.payments
for select to authenticated
using (restaurant_id = (select private.current_restaurant_id()));

create policy payments_insert on public.payments
for insert to authenticated
with check (
  restaurant_id = (select private.current_restaurant_id())
  and received_by = (select auth.uid())
);

create policy order_status_history_select on public.order_status_history
for select to authenticated
using (restaurant_id = (select private.current_restaurant_id()));

revoke all on all tables in schema public from anon, authenticated;
grant select, update on public.restaurants to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.dining_tables to authenticated;
grant select, insert, update, delete on public.menu_categories to authenticated;
grant select, insert, update, delete on public.menu_items to authenticated;
grant select, insert, update on public.table_sessions to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select, insert on public.payments to authenticated;
grant select on public.order_status_history to authenticated;

create function private.sync_table_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.dining_tables set status = 'occupied' where id = new.table_id;
  elsif old.status = 'open' and new.status <> 'open' then
    update public.dining_tables set status = 'available' where id = new.table_id;
  end if;

  return new;
end;
$$;

create trigger table_sessions_sync_table_status
after insert or update of status on public.table_sessions
for each row execute function private.sync_table_status();

create function private.validate_order_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = new.status then
    return new;
  end if;

  if not (
    (old.status = 'sent' and new.status in ('preparing', 'ready', 'cancelled'))
    or (old.status = 'preparing' and new.status in ('ready', 'cancelled'))
    or (old.status = 'ready' and new.status in ('delivered', 'cancelled'))
  ) then
    raise exception 'Invalid order status transition: % -> %', old.status, new.status;
  end if;

  if new.status = 'preparing' then
    new.preparing_at = coalesce(new.preparing_at, now());
  elsif new.status = 'ready' then
    new.preparing_at = coalesce(new.preparing_at, now());
    new.ready_at = coalesce(new.ready_at, now());
  elsif new.status = 'delivered' then
    new.delivered_at = coalesce(new.delivered_at, now());
  end if;

  return new;
end;
$$;

create trigger orders_validate_status_transition
before update of status on public.orders
for each row execute function private.validate_order_status_transition();

create function private.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.order_status_history (restaurant_id, order_id, status, changed_by)
    values (new.restaurant_id, new.id, new.status, auth.uid());
  end if;

  return new;
end;
$$;

create trigger orders_log_status
after insert or update of status on public.orders
for each row execute function private.log_order_status();

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.current_restaurant_id() to authenticated;
grant execute on function private.is_manager() to authenticated;

create function public.claim_initial_manager(p_full_name text)
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

  return jsonb_build_object(
    'id', claimed_profile.id,
    'name', claimed_profile.name,
    'role', claimed_profile.role,
    'active', claimed_profile.active
  );
end;
$$;

create function public.open_table_session(p_table_id uuid, p_guest_count smallint default 1)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_restaurant uuid := private.current_restaurant_id();
  existing_session uuid;
  created_session uuid;
begin
  select id into existing_session
  from public.table_sessions
  where table_id = p_table_id and status = 'open';

  if existing_session is not null then
    return existing_session;
  end if;

  if not exists (
    select 1 from public.dining_tables
    where id = p_table_id and restaurant_id = current_restaurant and active = true
  ) then
    raise exception 'Table is unavailable';
  end if;

  insert into public.table_sessions (restaurant_id, table_id, opened_by, guest_count)
  values (current_restaurant, p_table_id, auth.uid(), p_guest_count)
  returning id into created_session;

  return created_session;
end;
$$;

create function public.send_order(
  p_table_session_id uuid,
  p_items jsonb,
  p_notes text default null,
  p_idempotency_key uuid default gen_random_uuid()
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_restaurant uuid := private.current_restaurant_id();
  created_order uuid;
  existing_order uuid;
  inserted_items integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  select id into existing_order
  from public.orders
  where restaurant_id = current_restaurant and idempotency_key = p_idempotency_key;

  if existing_order is not null then
    return existing_order;
  end if;

  if not exists (
    select 1 from public.table_sessions
    where id = p_table_session_id
      and restaurant_id = current_restaurant
      and status = 'open'
  ) then
    raise exception 'Table session is not open';
  end if;

  insert into public.orders (
    restaurant_id,
    table_session_id,
    created_by,
    notes,
    idempotency_key
  ) values (
    current_restaurant,
    p_table_session_id,
    auth.uid(),
    nullif(trim(p_notes), ''),
    p_idempotency_key
  ) returning id into created_order;

  with parsed_items as (
    select
      (item ->> 'menu_item_id')::uuid as menu_item_id,
      (item ->> 'quantity')::smallint as quantity,
      nullif(trim(item ->> 'notes'), '') as notes
    from jsonb_array_elements(p_items) as item
  )
  insert into public.order_items (
    restaurant_id,
    order_id,
    menu_item_id,
    product_name,
    unit_price,
    quantity,
    notes
  )
  select
    current_restaurant,
    created_order,
    menu_item.id,
    menu_item.name,
    menu_item.price,
    parsed.quantity,
    parsed.notes
  from parsed_items parsed
  join public.menu_items menu_item on menu_item.id = parsed.menu_item_id
  where menu_item.restaurant_id = current_restaurant
    and menu_item.active = true
    and menu_item.available = true
    and parsed.quantity between 1 and 99;

  get diagnostics inserted_items = row_count;

  if inserted_items <> jsonb_array_length(p_items) then
    raise exception 'One or more order items are invalid or unavailable';
  end if;

  return created_order;
end;
$$;

create function public.set_order_status(p_order_id uuid, p_status public.order_status)
returns public.orders
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_order public.orders;
begin
  update public.orders
  set status = p_status
  where id = p_order_id
    and restaurant_id = private.current_restaurant_id()
  returning * into updated_order;

  if updated_order.id is null then
    raise exception 'Order not found';
  end if;

  return updated_order;
end;
$$;

create function public.close_table_session(
  p_table_session_id uuid,
  p_payment_method public.payment_method
)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_restaurant uuid := private.current_restaurant_id();
  session_total numeric(12, 2);
begin
  if not exists (
    select 1 from public.table_sessions
    where id = p_table_session_id
      and restaurant_id = current_restaurant
      and status = 'open'
    for update
  ) then
    raise exception 'Table session is not open';
  end if;

  if exists (
    select 1
    from public.orders
    where table_session_id = p_table_session_id
      and status in ('sent', 'preparing')
  ) then
    raise exception 'There are orders still being prepared';
  end if;

  update public.orders
  set status = 'delivered'
  where table_session_id = p_table_session_id
    and status = 'ready';

  select coalesce(sum(item.subtotal), 0)
  into session_total
  from public.orders order_row
  join public.order_items item on item.order_id = order_row.id
  where order_row.table_session_id = p_table_session_id
    and order_row.status <> 'cancelled';

  if session_total > 0 then
    insert into public.payments (restaurant_id, table_session_id, received_by, amount, method)
    values (current_restaurant, p_table_session_id, auth.uid(), session_total, p_payment_method);
  end if;

  update public.table_sessions
  set status = 'closed', closed_by = auth.uid(), closed_at = now()
  where id = p_table_session_id;

  return session_total;
end;
$$;

revoke all on function public.claim_initial_manager(text) from public, anon;
revoke all on function public.open_table_session(uuid, smallint) from public, anon;
revoke all on function public.send_order(uuid, jsonb, text, uuid) from public, anon;
revoke all on function public.set_order_status(uuid, public.order_status) from public, anon;
revoke all on function public.close_table_session(uuid, public.payment_method) from public, anon;

grant execute on function public.claim_initial_manager(text) to authenticated;
grant execute on function public.open_table_session(uuid, smallint) to authenticated;
grant execute on function public.send_order(uuid, jsonb, text, uuid) to authenticated;
grant execute on function public.set_order_status(uuid, public.order_status) to authenticated;
grant execute on function public.close_table_session(uuid, public.payment_method) to authenticated;

create view public.session_totals
with (security_invoker = true)
as
select
  session_row.id as table_session_id,
  session_row.restaurant_id,
  coalesce(sum(item.subtotal) filter (where order_row.status <> 'cancelled'), 0)::numeric(12, 2) as total,
  coalesce((
    select sum(payment.amount)
    from public.payments payment
    where payment.table_session_id = session_row.id
  ), 0)::numeric(12, 2) as paid
from public.table_sessions session_row
left join public.orders order_row on order_row.table_session_id = session_row.id
left join public.order_items item on item.order_id = order_row.id
group by session_row.id, session_row.restaurant_id;

grant select on public.session_totals to authenticated;

insert into public.restaurants (name, slug)
values ('Mesa Boa', 'mesa-boa')
on conflict (slug) do update set name = excluded.name;

insert into public.dining_tables (restaurant_id, number, seats)
select restaurant.id, table_number, 4
from public.restaurants restaurant
cross join generate_series(1, 12) as table_number
where restaurant.slug = 'mesa-boa'
on conflict (restaurant_id, number) do nothing;

insert into public.menu_categories (restaurant_id, name, position)
select restaurant.id, category.name, category.position
from public.restaurants restaurant
cross join (
  values
    ('Entradas', 10),
    ('Pratos', 20),
    ('Bebidas', 30),
    ('Sobremesas', 40)
) as category(name, position)
where restaurant.slug = 'mesa-boa'
on conflict (restaurant_id, name) do nothing;

insert into public.menu_items (
  restaurant_id,
  category_id,
  name,
  description,
  price,
  position
)
select
  restaurant.id,
  category.id,
  seed.name,
  seed.description,
  seed.price,
  seed.position
from public.restaurants restaurant
join (
  values
    ('Entradas', 'Dadinho de tapioca', 'Seis unidades com geleia de pimenta.', 28.00::numeric, 10),
    ('Entradas', 'Batata rústica', 'Batatas douradas, alecrim e aioli da casa.', 24.00::numeric, 20),
    ('Pratos', 'Burger da casa', 'Pão brioche, carne, queijo, picles e fritas.', 39.00::numeric, 10),
    ('Pratos', 'Frango grelhado', 'Frango, arroz de ervas e legumes tostados.', 42.00::numeric, 20),
    ('Pratos', 'Massa ao pomodoro', 'Massa fresca, tomate, manjericão e parmesão.', 38.00::numeric, 30),
    ('Bebidas', 'Água mineral', 'Com ou sem gás, 500 ml.', 6.00::numeric, 10),
    ('Bebidas', 'Refrigerante', 'Lata 350 ml.', 8.00::numeric, 20),
    ('Bebidas', 'Suco da fruta', 'Copo 400 ml.', 12.00::numeric, 30),
    ('Bebidas', 'Cerveja long neck', 'Garrafa 330 ml.', 14.00::numeric, 40),
    ('Sobremesas', 'Pudim da casa', 'Pudim cremoso com calda de caramelo.', 16.00::numeric, 10),
    ('Sobremesas', 'Brownie quente', 'Brownie, sorvete de creme e calda.', 22.00::numeric, 20)
) as seed(category_name, name, description, price, position) on true
join public.menu_categories category
  on category.restaurant_id = restaurant.id
 and category.name = seed.category_name
where restaurant.slug = 'mesa-boa';

alter publication supabase_realtime add table
  public.dining_tables,
  public.table_sessions,
  public.orders,
  public.order_items,
  public.payments;
