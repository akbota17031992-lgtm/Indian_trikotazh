-- ============================================================================
-- Migration: 20261102000002_indexes_and_constraints.sql
-- Description: Foreign key B-tree indexes, composite stock indexes & GIN trigram indexes
-- Author: India Trikotaj Engineering Team
-- ============================================================================

-- ============================================================================
-- 1. FOREIGN KEY B-TREE INDEXES (100% Coverage Rule)
-- ============================================================================
create index if not exists categories_parent_id_idx on public.categories (parent_id);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);
create index if not exists product_images_product_id_idx on public.product_images (product_id);
create index if not exists product_images_variant_id_idx on public.product_images (variant_id);

create index if not exists inventory_levels_store_id_idx on public.inventory_levels (store_id);
create index if not exists inventory_levels_variant_id_idx on public.inventory_levels (variant_id);

create index if not exists inventory_transactions_store_id_idx on public.inventory_transactions (store_id);
create index if not exists inventory_transactions_variant_id_idx on public.inventory_transactions (variant_id);
create index if not exists inventory_transactions_created_by_idx on public.inventory_transactions (created_by);

create index if not exists user_roles_user_id_idx on public.user_roles (user_id);
create index if not exists user_roles_store_id_idx on public.user_roles (store_id);

create index if not exists addresses_user_id_idx on public.addresses (user_id);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_store_id_idx on public.orders (store_id);
create index if not exists orders_pickup_store_id_idx on public.orders (pickup_store_id);
create index if not exists orders_promotion_id_idx on public.orders (promotion_id);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_variant_id_idx on public.order_items (variant_id);

create index if not exists reviews_product_id_idx on public.reviews (product_id);
create index if not exists reviews_user_id_idx on public.reviews (user_id);
create index if not exists reviews_order_id_idx on public.reviews (order_id);

create index if not exists carts_user_id_idx on public.carts (user_id);
create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);
create index if not exists cart_items_variant_id_idx on public.cart_items (variant_id);

-- ============================================================================
-- 2. COMPOSITE, COVERING & QUERY HOT-PATH INDEXES
-- ============================================================================
-- Composite index for real-time branch stock queries: (store_id, variant_id, quantity)
create index if not exists inventory_levels_store_stock_idx on public.inventory_levels (store_id, variant_id, quantity);
create index if not exists inventory_levels_available_stock_idx on public.inventory_levels (store_id, variant_id, available_quantity);

-- Catalog filtering hot paths
create index if not exists products_category_published_idx on public.products (category_id, is_published);
create index if not exists products_gender_season_idx on public.products (gender, season);
create index if not exists products_status_active_idx on public.products (status) where status = 'active';
create index if not exists products_published_idx on public.products (is_published) where is_published = true;

-- Variant lookup and price ordering
create index if not exists product_variants_product_active_idx on public.product_variants (product_id, is_active);
create index if not exists product_variants_price_idx on public.product_variants (price_kzt);
create index if not exists product_variants_sku_idx on public.product_variants (sku);
create index if not exists product_variants_barcode_idx on public.product_variants (barcode) where barcode is not null;

-- Order lookups by status, invoice, and timestamp
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_desc_idx on public.orders (created_at desc);
create index if not exists orders_kaspi_invoice_idx on public.orders (kaspi_invoice_id) where kaspi_invoice_id is not null;

-- Reviews approved rating query
create index if not exists reviews_approved_rating_idx on public.reviews (product_id, rating) where status = 'approved';

-- Promotions active window query
create index if not exists promotions_active_dates_idx on public.promotions (code, valid_from, valid_to) where is_active = true;

-- Active stores lookup
create index if not exists stores_active_idx on public.stores (is_active) where is_active = true;

-- ============================================================================
-- 3. GIN TRIGRAM & FULL-TEXT SEARCH FALLBACK INDEXES
-- ============================================================================
create index if not exists products_tags_gin_idx on public.products using gin (tags);
create index if not exists products_name_ru_trgm_idx on public.products using gin (name_ru gin_trgm_ops);
create index if not exists products_name_kz_trgm_idx on public.products using gin (name_kz gin_trgm_ops);
create index if not exists products_description_ru_trgm_idx on public.products using gin (description_ru gin_trgm_ops);
create index if not exists products_description_kz_trgm_idx on public.products using gin (description_kz gin_trgm_ops);

create index if not exists stores_name_ru_trgm_idx on public.stores using gin (name_ru gin_trgm_ops);
create index if not exists stores_name_kz_trgm_idx on public.stores using gin (name_kz gin_trgm_ops);
create index if not exists stores_address_ru_trgm_idx on public.stores using gin (address_ru gin_trgm_ops);
