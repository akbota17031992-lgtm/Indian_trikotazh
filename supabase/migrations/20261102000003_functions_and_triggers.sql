-- ============================================================================
-- Migration: 20261102000003_functions_and_triggers.sql
-- Description: Triggers, security definer functions, order number generator & stock procedures
-- Author: India Trikotaj Engineering Team
-- ============================================================================

-- ============================================================================
-- 1. AUTOMATIC updated_at TIMESTAMP TRIGGER
-- ============================================================================
create or replace function public.trigger_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_stores_updated_at before update on public.stores for each row execute function public.trigger_set_updated_at();
create trigger set_categories_updated_at before update on public.categories for each row execute function public.trigger_set_updated_at();
create trigger set_products_updated_at before update on public.products for each row execute function public.trigger_set_updated_at();
create trigger set_product_variants_updated_at before update on public.product_variants for each row execute function public.trigger_set_updated_at();
create trigger set_inventory_levels_updated_at before update on public.inventory_levels for each row execute function public.trigger_set_updated_at();
create trigger set_customer_profiles_updated_at before update on public.customer_profiles for each row execute function public.trigger_set_updated_at();
create trigger set_addresses_updated_at before update on public.addresses for each row execute function public.trigger_set_updated_at();
create trigger set_promotions_updated_at before update on public.promotions for each row execute function public.trigger_set_updated_at();
create trigger set_orders_updated_at before update on public.orders for each row execute function public.trigger_set_updated_at();
create trigger set_reviews_updated_at before update on public.reviews for each row execute function public.trigger_set_updated_at();
create trigger set_carts_updated_at before update on public.carts for each row execute function public.trigger_set_updated_at();
create trigger set_cart_items_updated_at before update on public.cart_items for each row execute function public.trigger_set_updated_at();

-- ============================================================================
-- 2. FIELD SYNCHRONIZATION TRIGGERS
-- ============================================================================
create or replace function public.trigger_sync_product_fields()
returns trigger
language plpgsql
as $$
begin
  new.title_ru := coalesce(new.title_ru, new.name_ru);
  new.title_kz := coalesce(new.title_kz, new.name_kz);
  new.name_ru := coalesce(new.name_ru, new.title_ru);
  new.name_kz := coalesce(new.name_kz, new.title_kz);
  return new;
end;
$$;

create trigger sync_product_fields_trigger
before insert or update on public.products
for each row execute function public.trigger_sync_product_fields();

create or replace function public.trigger_sync_store_fields()
returns trigger
language plpgsql
as $$
begin
  new.district_ru := coalesce(new.district_ru, new.district);
  new.district := coalesce(new.district, new.district_ru);
  new.open_hours_ru := coalesce(new.open_hours_ru, new.schedule_ru);
  new.open_hours_kz := coalesce(new.open_hours_kz, new.schedule_kz);
  new.schedule_ru := coalesce(new.schedule_ru, new.open_hours_ru);
  new.schedule_kz := coalesce(new.schedule_kz, new.open_hours_kz);
  return new;
end;
$$;

create trigger sync_store_fields_trigger
before insert or update on public.stores
for each row execute function public.trigger_sync_store_fields();

create or replace function public.trigger_sync_order_fields()
returns trigger
language plpgsql
as $$
begin
  new.user_id := coalesce(new.user_id, new.customer_id);
  new.customer_id := coalesce(new.customer_id, new.user_id);
  new.delivery_type := coalesce(new.delivery_type, new.fulfillment_type);
  new.fulfillment_type := coalesce(new.fulfillment_type, new.delivery_type);
  new.store_id := coalesce(new.store_id, new.pickup_store_id);
  new.pickup_store_id := coalesce(new.pickup_store_id, new.store_id);
  new.shipping_address := coalesce(new.shipping_address, new.delivery_address);
  new.delivery_address := coalesce(new.delivery_address, new.shipping_address);
  return new;
end;
$$;

create trigger sync_order_fields_trigger
before insert or update on public.orders
for each row execute function public.trigger_sync_order_fields();

create or replace function public.trigger_sync_order_item_fields()
returns trigger
language plpgsql
as $$
begin
  if new.total_kzt is null and new.unit_price_kzt is not null and new.quantity is not null then
    new.total_kzt := new.unit_price_kzt * new.quantity;
  end if;
  new.total_price_kzt := coalesce(new.total_price_kzt, new.total_kzt);
  new.total_kzt := coalesce(new.total_kzt, new.total_price_kzt);
  return new;
end;
$$;

create trigger sync_order_item_fields_trigger
before insert or update on public.order_items
for each row execute function public.trigger_sync_order_item_fields();

-- ============================================================================
-- 3. SEQUENTIAL ORDER NUMBER GENERATOR (IT-YYYYMMDD-XXXX)
-- ============================================================================
create sequence if not exists public.order_number_seq;
grant usage, select on sequence public.order_number_seq to authenticated, anon;

create or replace function public.generate_order_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  date_part text;
  seq_num text;
begin
  if new.order_number is null or new.order_number = '' then
    date_part := to_char(now() at time zone 'Asia/Almaty', 'YYYYMMDD');
    seq_num := lpad(nextval('public.order_number_seq')::text, 4, '0');
    new.order_number := 'IT-' || date_part || '-' || seq_num;
  end if;
  return new;
end;
$$;

create trigger set_order_number
before insert on public.orders
for each row
execute function public.generate_order_number();

-- ============================================================================
-- 4. NEW USER AUTOMATIC PROFILE CREATION
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.customer_profiles (id, phone, full_name, language_preference)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'language_preference', 'ru')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================================
-- 5. AUTHORIZATION HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('staff', 'store_manager', 'manager', 'admin')
  );
$$;

create or replace function public.can_manage_store(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and (
        role = 'admin'
        or (role in ('staff', 'store_manager', 'manager') and (store_id is null or store_id = p_store_id))
      )
  );
$$;

-- Grant execution permissions
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.is_staff() to authenticated, anon;
grant execute on function public.can_manage_store(uuid) to authenticated, anon;

-- Helper function enabling guest and authenticated order item insertion under RLS
create or replace function public.can_insert_order_item(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order_id
      and (
        (o.user_id is not null and (o.user_id = (select auth.uid()) or o.customer_id = (select auth.uid())))
        or (o.user_id is null and o.status in ('pending', 'pending_payment') and (select auth.role()) in ('anon', 'authenticated'))
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = (select auth.uid())
            and ur.role in ('staff', 'store_manager', 'manager', 'admin')
        )
      )
  );
$$;

grant execute on function public.can_insert_order_item(uuid) to authenticated, anon;

-- ============================================================================
-- 6. INVENTORY RESERVATION & TRANSACTIONS STORED PROCEDURES
-- ============================================================================
create or replace function public.reserve_stock(
  p_store_id uuid,
  p_variant_id uuid,
  p_quantity integer,
  p_reference_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_available integer;
begin
  if p_quantity <= 0 then
    return false;
  end if;

  select (quantity - reserved_quantity)
  into v_available
  from public.inventory_levels
  where store_id = p_store_id and variant_id = p_variant_id
  for update;

  if v_available is null or v_available < p_quantity then
    return false;
  end if;

  update public.inventory_levels
  set reserved_quantity = reserved_quantity + p_quantity,
      updated_at = now()
  where store_id = p_store_id and variant_id = p_variant_id;

  insert into public.inventory_transactions (
    store_id,
    variant_id,
    change_quantity,
    reason,
    reference_id,
    created_by
  )
  values (
    p_store_id,
    p_variant_id,
    p_quantity,
    'reservation',
    p_reference_id,
    (select auth.uid())
  );

  return true;
end;
$$;

create or replace function public.release_stock(
  p_store_id uuid,
  p_variant_id uuid,
  p_quantity integer,
  p_reference_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_quantity <= 0 then
    return false;
  end if;

  update public.inventory_levels
  set reserved_quantity = greatest(0, reserved_quantity - p_quantity),
      updated_at = now()
  where store_id = p_store_id and variant_id = p_variant_id;

  if not found then
    return false;
  end if;

  insert into public.inventory_transactions (
    store_id,
    variant_id,
    change_quantity,
    reason,
    reference_id,
    created_by
  )
  values (
    p_store_id,
    p_variant_id,
    -p_quantity,
    'reservation_cancellation',
    p_reference_id,
    (select auth.uid())
  );

  return true;
end;
$$;

create or replace function public.commit_stock_deduction(
  p_store_id uuid,
  p_variant_id uuid,
  p_quantity integer,
  p_reference_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_quantity <= 0 then
    return false;
  end if;

  update public.inventory_levels
  set quantity = greatest(0, quantity - p_quantity),
      reserved_quantity = greatest(0, reserved_quantity - p_quantity),
      updated_at = now()
  where store_id = p_store_id and variant_id = p_variant_id;

  if not found then
    return false;
  end if;

  insert into public.inventory_transactions (
    store_id,
    variant_id,
    change_quantity,
    reason,
    reference_id,
    created_by
  )
  values (
    p_store_id,
    p_variant_id,
    -p_quantity,
    'sale',
    p_reference_id,
    (select auth.uid())
  );

  return true;
end;
$$;

-- Restrict execution grants:
revoke execute on function public.release_stock(uuid, uuid, integer, text) from anon, authenticated, public;
revoke execute on function public.commit_stock_deduction(uuid, uuid, integer, text) from anon, authenticated, public;
grant execute on function public.release_stock(uuid, uuid, integer, text) to service_role;
grant execute on function public.commit_stock_deduction(uuid, uuid, integer, text) to service_role;
grant execute on function public.reserve_stock(uuid, uuid, integer, text) to authenticated, anon, service_role;
