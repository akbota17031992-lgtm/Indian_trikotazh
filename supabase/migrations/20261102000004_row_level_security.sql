-- ============================================================================
-- Migration: 20261102000004_row_level_security.sql
-- Description: High-performance Row Level Security policies with cached subqueries
-- Author: India Trikotaj Engineering Team
-- ============================================================================

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_levels enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.addresses enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- ============================================================================
-- 2. STORES POLICIES
-- ============================================================================
create policy "Public can read active stores"
  on public.stores for select
  using (is_active = true or (select public.is_staff()));

create policy "Staff can manage stores"
  on public.stores for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ============================================================================
-- 3. CATEGORIES POLICIES
-- ============================================================================
create policy "Public can read active categories"
  on public.categories for select
  using (is_active = true or (select public.is_staff()));

create policy "Staff can manage categories"
  on public.categories for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ============================================================================
-- 4. PRODUCTS POLICIES
-- ============================================================================
create policy "Public can read published products"
  on public.products for select
  using ((is_published = true and status = 'active') or (select public.is_staff()));

create policy "Staff can modify products"
  on public.products for all
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ============================================================================
-- 5. PRODUCT VARIANTS & IMAGES POLICIES
-- ============================================================================
create policy "Public can read active variants"
  on public.product_variants for select
  using (is_active = true or (select public.is_staff()));

create policy "Staff can modify variants"
  on public.product_variants for all
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "Public can read product images"
  on public.product_images for select
  using (true);

create policy "Staff can modify product images"
  on public.product_images for all
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ============================================================================
-- 6. INVENTORY LEVELS & TRANSACTIONS POLICIES
-- ============================================================================
create policy "Public can check store stock"
  on public.inventory_levels for select
  using (true);

create policy "Staff can modify inventory"
  on public.inventory_levels for all
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "Staff can view inventory transactions"
  on public.inventory_transactions for select
  to authenticated
  using ((select public.is_staff()));

create policy "System can insert inventory transactions"
  on public.inventory_transactions for insert
  to authenticated
  with check ((select public.is_staff()));

-- ============================================================================
-- 7. CUSTOMER PROFILES & ROLES POLICIES
-- ============================================================================
create policy "Users read own profile or staff view"
  on public.customer_profiles for select
  using (id = (select auth.uid()) or (select public.is_staff()));

create policy "Users update own profile"
  on public.customer_profiles for update
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "Users insert own profile"
  on public.customer_profiles for insert
  with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "Users read own roles or admin view all"
  on public.user_roles for select
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Admin manage user roles"
  on public.user_roles for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ============================================================================
-- 8. ADDRESSES POLICIES
-- ============================================================================
create policy "Users read own addresses"
  on public.addresses for select
  using (user_id = (select auth.uid()) or (select public.is_staff()));

create policy "Users insert own addresses"
  on public.addresses for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users update/delete own addresses"
  on public.addresses for all
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

-- ============================================================================
-- 9. PROMOTIONS POLICIES
-- ============================================================================
create policy "Public view active promotions"
  on public.promotions for select
  using ((is_active = true and now() between valid_from and valid_to) or (select public.is_staff()));

create policy "Admin manage promotions"
  on public.promotions for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ============================================================================
-- 10. ORDERS & ORDER ITEMS POLICIES
-- ============================================================================
create policy "Customers read own orders or staff view branch orders"
  on public.orders for select
  using (
    user_id = (select auth.uid())
    or customer_id = (select auth.uid())
    or (select public.can_manage_store(store_id))
    or (select public.is_admin())
  );

create policy "Customers can place orders"
  on public.orders for insert
  with check (
    user_id = (select auth.uid())
    or customer_id = (select auth.uid())
    or (user_id is null and (select auth.role()) in ('anon', 'authenticated'))
    or (select public.is_staff())
  );

create policy "Staff or branch manager can update orders"
  on public.orders for update
  to authenticated
  using (
    (select public.is_admin())
    or (select public.can_manage_store(store_id))
  )
  with check (
    (select public.is_admin())
    or (select public.can_manage_store(store_id))
  );

create policy "Read order items for accessible orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.user_id = (select auth.uid())
          or o.customer_id = (select auth.uid())
          or (select public.can_manage_store(o.store_id))
          or (select public.is_admin())
        )
    )
  );

create policy "Insert order items for orders"
  on public.order_items for insert
  with check ((select public.can_insert_order_item(order_id)));

create policy "Staff manage order items"
  on public.order_items for all
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ============================================================================
-- 11. REVIEWS POLICIES
-- ============================================================================
create policy "Public read approved reviews"
  on public.reviews for select
  using (status = 'approved' or user_id = (select auth.uid()) or (select public.is_staff()));

create policy "Authenticated users create reviews"
  on public.reviews for insert
  to authenticated
  with check (
    (
      user_id = (select auth.uid())
      and status = 'pending'
      and is_verified = false
    )
    or (select public.is_staff())
  );

create policy "Users edit pending reviews or staff moderate"
  on public.reviews for update
  to authenticated
  using ((user_id = (select auth.uid()) and status = 'pending') or (select public.is_staff()))
  with check ((user_id = (select auth.uid()) and status = 'pending') or (select public.is_staff()));

-- ============================================================================
-- 12. SHOPPING CARTS & CART ITEMS POLICIES
-- ============================================================================
create policy "Manage own cart"
  on public.carts for all
  using (
    (user_id is not null and user_id = (select auth.uid()))
    or (user_id is null and (select auth.role()) = 'anon')
    or (select public.is_staff())
  )
  with check (
    (user_id is not null and user_id = (select auth.uid()))
    or (user_id is null and (select auth.role()) = 'anon')
    or (select public.is_staff())
  );

create policy "Manage own cart items"
  on public.cart_items for all
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
        and (
          (c.user_id is not null and c.user_id = (select auth.uid()))
          or (c.user_id is null and (select auth.role()) = 'anon')
          or (select public.is_staff())
        )
    )
  )
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
        and (
          (c.user_id is not null and c.user_id = (select auth.uid()))
          or (c.user_id is null and (select auth.role()) = 'anon')
          or (select public.is_staff())
        )
    )
  );
