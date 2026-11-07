-- ============================================================================
-- Migration: 20261102000001_initial_schema.sql
-- Description: Core relational schema for India Trikotaj (16 tables + auth fallback)
-- Author: India Trikotaj Engineering Team
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS & AUTH SCHEMA FALLBACK
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- Standalone / Local Auth Schema Fallback for Local Docker & Offline Execution
create schema if not exists auth;

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon');
$$;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 1. STORES (Retail branches in Almaty)
-- ============================================================================
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  slug text not null unique,
  name_ru text not null,
  name_kz text not null,
  district text not null default 'Бостандыкский',
  district_ru text,
  district_kz text,
  address_ru text not null,
  address_kz text not null,
  latitude double precision not null,
  longitude double precision not null,
  phone text not null,
  email text,
  schedule_ru text not null default 'Ежедневно с 10:00 до 22:00',
  schedule_kz text not null default 'Күн сайын 10:00-ден 22:00-ге дейін',
  open_hours_ru text,
  open_hours_kz text,
  schedule_json jsonb not null default '{"daily": {"open": "10:00", "close": "22:00"}}'::jsonb,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. CATEGORIES (Hierarchical catalog navigation)
-- ============================================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  parent_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  name_ru text not null,
  name_kz text not null,
  description_ru text,
  description_kz text,
  image_url text,
  sort_order integer not null default 0,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 3. PRODUCTS (Bilingual clothing catalog)
-- ============================================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique,
  name_ru text not null,
  name_kz text not null,
  title_ru text,
  title_kz text,
  description_ru text not null,
  description_kz text not null,
  material_ru text not null,
  material_kz text not null,
  season text not null default 'all-season' check (season in ('all_season', 'summer', 'winter', 'demi_season', 'all-season', 'demi-season')),
  gender text not null default 'unisex' check (gender in ('unisex', 'men', 'women', 'kids', 'boys', 'girls', 'kids_unisex')),
  base_price_kzt numeric(12, 2) not null default 0 check (base_price_kzt >= 0),
  tags text[] not null default '{}',
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  is_published boolean not null default true,
  is_featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 4. PRODUCT VARIANTS (SKUs, sizes, colors, KZT prices)
-- ============================================================================
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  barcode text unique,
  size text not null,
  color_ru text not null,
  color_kz text not null,
  color_hex text not null check (color_hex ~* '^#[0-9a-f]{6}$'),
  price_kzt numeric(12, 2) not null check (price_kzt >= 0),
  old_price_kzt numeric(12, 2) check (old_price_kzt is null or old_price_kzt > price_kzt),
  weight_grams integer check (weight_grams is null or weight_grams > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 5. PRODUCT IMAGES (Multi-resolution, primary tag, variant link)
-- ============================================================================
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  url text not null,
  url_full text,
  url_card text,
  url_thumbnail text,
  thumbnail_url text,
  alt_ru text,
  alt_kz text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 6. INVENTORY LEVELS (Per-store stock tracking)
-- ============================================================================
create table public.inventory_levels (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0 and reserved_quantity <= quantity),
  available_quantity integer generated always as (quantity - reserved_quantity) stored,
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  constraint uq_inventory_store_variant unique (store_id, variant_id)
);

-- Compatibility View: store_inventory alias
create or replace view public.store_inventory as
select
  id,
  store_id,
  variant_id,
  quantity,
  reserved_quantity,
  available_quantity,
  low_stock_threshold,
  updated_at
from public.inventory_levels;

-- Stock Movement / Audit Log
create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  change_quantity integer not null,
  reason text not null check (reason in ('initial_load', 'restock', 'sale', 'reservation', 'reservation_cancellation', 'return', 'adjustment', 'transfer')),
  reference_id text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 7. USERS, PROFILES, ROLES & ADDRESSES
-- ============================================================================
create table public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  full_name text,
  language_preference text not null default 'ru' check (language_preference in ('ru', 'kz')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'staff', 'store_manager', 'manager', 'admin')),
  store_id uuid references public.stores(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint uq_user_role unique (user_id, role)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  city text not null default 'Алматы',
  district text not null default 'Бостандыкский',
  district_ru text,
  district_kz text,
  street text not null,
  building text not null,
  apartment text,
  floor text,
  entrance text,
  intercom text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  delivery_notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 8. PROMOTIONS & DISCOUNTS
-- ============================================================================
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  title_ru text not null,
  title_kz text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount')),
  discount_value numeric(12, 2) not null check (discount_value > 0),
  min_order_kzt numeric(12, 2) not null default 0 check (min_order_kzt >= 0),
  max_discount_kzt numeric(12, 2) check (max_discount_kzt is null or max_discount_kzt > 0),
  valid_from timestamptz not null,
  valid_to timestamptz not null check (valid_to > valid_from),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 9. ORDERS & ORDER ITEMS (Courier vs Store Pickup, Kaspi Pay)
-- ============================================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  status text not null default 'pending' check (status in ('pending', 'pending_payment', 'paid', 'processing', 'ready_for_pickup', 'shipping', 'in_transit', 'delivered', 'cancelled', 'refunded')),
  delivery_type text check (delivery_type in ('pickup', 'pickup_from_store', 'courier')),
  fulfillment_type text check (fulfillment_type in ('pickup', 'pickup_from_store', 'courier')),
  store_id uuid references public.stores(id) on delete restrict,
  pickup_store_id uuid references public.stores(id) on delete restrict,
  shipping_address jsonb,
  delivery_address jsonb,
  subtotal_kzt numeric(12, 2) not null check (subtotal_kzt >= 0),
  discount_kzt numeric(12, 2) not null default 0 check (discount_kzt >= 0),
  delivery_fee_kzt numeric(12, 2) not null default 0 check (delivery_fee_kzt >= 0),
  total_kzt numeric(12, 2) not null check (total_kzt >= 0),
  promotion_id uuid references public.promotions(id) on delete set null,
  payment_method text check (payment_method is null or payment_method in ('kaspi_gold', 'kaspi_red', 'kaspi_kredit', 'kaspi_pay', 'qr', 'cash_on_delivery', 'card_on_delivery', 'KaspiGold', 'KaspiRed', 'KaspiKredit', 'QR')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'authorized', 'captured', 'paid', 'failed', 'refunded')),
  kaspi_invoice_id text,
  kaspi_transaction_id text,
  kaspi_payment_mode text,
  kaspi_payment_data jsonb not null default '{}'::jsonb,
  customer_comment text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  sku text,
  product_name text,
  size text,
  color text,
  product_snapshot jsonb not null default '{}'::jsonb,
  unit_price_kzt numeric(12, 2) not null check (unit_price_kzt >= 0),
  quantity integer not null check (quantity > 0),
  total_kzt numeric(12, 2) not null check (total_kzt >= 0),
  total_price_kzt numeric(12, 2),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 10. REVIEWS & RATINGS
-- ============================================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  pros text,
  cons text,
  is_verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 11. SHOPPING CARTS & CART ITEMS
-- ============================================================================
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_cart_variant unique (cart_id, variant_id)
);
