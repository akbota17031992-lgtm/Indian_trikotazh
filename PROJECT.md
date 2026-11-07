# Project: India Trikotaj Phase 1 (MVP) Marketplace

## Architecture
- **Monorepo**: pnpm workspaces (`apps/api`, `apps/web`, `packages/ai`, `packages/ui`, `packages/shared`, `packages/config`).
- **Backend API (`apps/api`)**: Clean Architecture (`domain` -> `use-cases` -> `adapters` -> `infrastructure`), TypeScript, Node.js.
- **Database & Security**: PostgreSQL 16 schema via Supabase migrations (`supabase/migrations/`) with strict Row Level Security (RLS) policies, foreign key indexing, and seed data (`supabase/seed.sql`) containing 16 Almaty store branches and realistic bilingual clothing catalog.
- **AI Processing Pipeline (`packages/ai`)**: Multimodal Gemini Vision API prompt and schema for bilingual metadata extraction (`name_ru`, `name_kz`, `description_ru`, `description_kz`, `category`, `subcategory`, `colors[]`, `material`, `season`, `gender`, `tags[]`), background removal with rembg/Sharp fallback, Sharp WebP variants (`thumbnail`, `card`, `full`), mock generator, and seller preview draft workflow.
- **Kaspi Pay Integration (R5)**: ApiPay.kz REST API client supporting Kaspi Gold, Kaspi Red (installment), and Kaspi Kredit, dynamic QR (`POST /invoices/qr`), phone push (`POST /invoices`), secure webhook receiver (`POST /api/payments/kaspi/callback`) with HMAC-SHA256 signature verification and timing-safe equality, plus offline `MockKaspiPaymentAdapter`.
- **Web Storefront (`apps/web`)**: Next.js 15 App Router, Tailwind CSS, shadcn/ui components (`packages/ui`), persistent Almaty store branch selector, real-time store stock availability indicator, bilingual RU/KZ locale switching, shopping cart, and Kaspi Pay checkout modal displaying prices in Kazakhstani Tenge (KZT, ₸).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Monorepo Workspace & Build Matrix | pnpm workspaces root setup, tsconfig base, build scripts, Windows execution policy compatibility | M1 | R1 |
| 2 | Shared Domain Models & Contracts | Pure TypeScript interfaces, Zod validation schemas, currency formatters, and Result types | M1 | R1 |
| 3 | Shared UI Component Library | Base shadcn/ui primitives, Tailwind config, Radix UI wrappers in packages/ui | M1 | R1, R3 |
| 4 | Database Relational Schema | PostgreSQL DDL for stores, categories, products, variants, images, inventory, orders, reviews, promotions | M2 | R2 |
| 5 | Row Level Security (RLS) & RBAC | Strict policies for public read catalog, customer-restricted orders/profiles, and admin functions | M2 | R2 |
| 6 | Almaty Stores & Clothing Seed Data | 16 real-world Almaty shopping center branches (GPS, schedules) and catalog across 7 categories | M2 | R2 |
| 7 | Local Docker Compose & Env | PostgreSQL 16, Meilisearch 1.7, and fallback .env.example for self-contained offline execution | M2 | R2 |
| 8 | Clean Architecture Domain & Entities | Domain entities (Store, Product, Variant, Inventory, Order, Money, Sku) with zero dependencies | M3 | R1 |
| 9 | Application Use Cases & Ports | ListStores, ListProducts, CheckStoreStock, CreateOrder, GetOrder, and repository port interfaces | M3 | R1 |
| 10 | PostgreSQL Repository Adapters | Concrete repository implementations using connection pool and parameterized SQL | M3 | R1, R2 |
| 11 | REST API Server & Express Routing | /api/v1 routes for stores, catalog, inventory, orders, and error-handling middlewares | M3 | R1 |
| 12 | Gemini Vision Metadata Extraction | Multimodal vision prompt extracting structured bilingual RU/KZ clothing metadata | M4 | R4 |
| 13 | Image Background Removal & Resizing | Rembg integration with Sharp fallback and WebP presets (thumbnail, card, full) | M4 | R4 |
| 14 | AI Mock Mode & Unit Tests | Deterministic offline mock generator and test suite for AI processing pipeline | M4 | R4 |
| 15 | Seller Preview Verification Flow | Draft state workflow allowing seller review and edits before catalog publishing | M4 | R4 |
| 16 | Kaspi Pay Invoicing API | POST /api/payments/kaspi/create endpoint generating ApiPay.kz QR or phone push invoice | M5 | R5 |
| 17 | Kaspi Webhook Handler & Security | POST /api/payments/kaspi/callback with HMAC-SHA256 signature verification and order state update | M5 | R5 |
| 18 | Mock Kaspi Payment Adapter | Offline payment provider supporting automated simulation and interactive checkout tests | M5 | R5 |
| 19 | Next.js 15 Storefront App Router | Server-rendered pages for homepage, category catalog, and product details in apps/web | M6 | R3 |
| 20 | Almaty Branch Selector & Stock Badge | Persistent store selector and PDP real-time stock indicator ("В наличии в ТРЦ MEGA: 5 шт.") | M6 | R3 |
| 21 | Bilingual Localization (RU / KZ) | Instant locale switcher with Cyrillic-ext glyph support and translated interface | M6 | R3 |
| 22 | Cart & Kaspi Checkout Modal | Client cart management, branch pickup selection, and Kaspi QR modal countdown | M6 | R3 |
| 23 | E2E Integration & Verification | Pass 100% of opaque-box E2E tests (Tiers 1-4) and adversarial coverage hardening (Tier 5) | M7 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Monorepo Foundation & Shared Core | Workspace config, packages/config, packages/shared, packages/ui | none | DONE |
| M2 | Database, Migrations & Local Infra | PostgreSQL schema, Supabase migrations, RLS policies, seed data, docker-compose | M1 | DONE |
| M3 | Clean Architecture Backend API | apps/api domain, use-cases, repositories, controllers, Express server | M1, M2 | DONE |
| M4 | AI Product Ingestion Pipeline | packages/ai Gemini extraction, Sharp resizing, rembg, mock mode, seller preview | M1 | DONE |
| M5 | Kaspi Pay Payment Integration | apps/api payment endpoints (create, callback), ApiPay.kz client, mock adapter | M1, M3 | DONE |
| M7 | Final Milestone: E2E Pass & Hardening | Pass 100% of E2E test suite (Tiers 1-4) and adversarial coverage hardening (Tier 5) | M1-M6, E2E Track | DONE |


## Interface Contracts

### 1. packages/shared ↔ apps/api, apps/web, packages/ai
- Types: `Store`, `Category`, `Product`, `ProductVariant`, `ProductImage`, `StoreInventory`, `Order`, `OrderItem`, `DeliveryAddress`, `KaspiPaymentMode`, `KaspiCreateInvoiceInput`, `KaspiCreateInvoiceOutput`, `KaspiWebhookCallback`.
- Helpers: `formatKZT(amount: number): string` -> `"14 990 ₸"`, `validateKazakhstanPhone(phone: string): boolean`.
- Envelopes: `ApiResponse<T>`, `ApiErrorResponse`, `Result<T, E>`.

### 2. apps/api ↔ Kaspi Pay (ApiPay.kz Contract)
- `POST /api/payments/kaspi/create`:
  - Request: `{ orderId: string, amountKzt: number, phone: string, paymentMode: 'KaspiGold' | 'KaspiRed' | 'KaspiKredit' | 'QR', description: string, returnUrl: string }`
  - Response: `{ paymentId: string, orderId: string, providerInvoiceId: string, status: string, qrTokenUrl: string, qrImageUrl: string, paymentUrl: string, isMock: boolean }`
- `POST /api/payments/kaspi/callback`:
  - Header: `X-Webhook-Signature: sha256=<hex>`
  - Body: `{ invoiceId: string, orderId: string, amount: number, status: 'SUCCESS' | 'FAILED' | 'REFUNDED', transactionId: string, paymentMethod: string }`
  - Verification: HMAC-SHA256 over raw body with timing-safe comparison. Idempotent deduplication by `(invoiceId, status)`.

### 3. packages/ai ↔ apps/api (Product Ingestion Pipeline)
- `ingestProductImage(input: { imageBuffer: Buffer, mimeType: string, options?: { removeBg?: boolean } }): Promise<ProcessedProductDraft>`
- Output Schema:
  - `metadata`: `{ name_ru: string, name_kz: string, description_ru: string, description_kz: string, category: string, subcategory: string, colors: string[], material: string, season: string, gender: string, tags: string[], suggestedPriceKzt: number }`
  - `images`: `{ thumbnail: Buffer, card: Buffer, full: Buffer }`
  - `variants`: Array of default clothing sizes and colors.

### 4. apps/api ↔ apps/web (Storefront REST Endpoints)
- `GET /api/v1/stores`: Array of active Almaty branches with coordinates, district, address, schedule, and phones.
- `GET /api/v1/categories`: Hierarchical category tree.
- `GET /api/v1/products`: Filterable product catalog (`category`, `gender`, `season`, `storeId`, `inStock`, `page`, `limit`).
- `GET /api/v1/products/:slug`: Product detail with variants, images, and inventory breakdown per Almaty store.
- `GET /api/v1/inventory/availability?variantId={id}`: Stock availability across all 16 Almaty branches.
- `POST /api/v1/orders`: Create order with store pickup or courier delivery.
- `GET /api/v1/orders/:id`: Order details and current fulfillment/payment status.

## Code Layout
```
india-trikotaj/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── docker-compose.yml
├── .env.example
├── supabase/
│   ├── migrations/
│   │   ├── 20261102000001_initial_schema.sql
│   │   ├── 20261102000002_indexes_and_constraints.sql
│   │   ├── 20261102000003_functions_and_triggers.sql
│   │   └── 20261102000004_row_level_security.sql
│   └── seed.sql
├── packages/
│   ├── config/
│   │   ├── package.json
│   │   └── tsconfig.base.json
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types/
│   │       ├── schemas/
│   │       └── utils/
│   ├── ui/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── components/
│   └── ai/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── vision/
│           ├── image/
│           └── mock/
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── config/
│   │       ├── domain/
│   │       ├── use-cases/
│   │       ├── adapters/
│   │       └── infrastructure/
│   └── web/
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       └── src/
│           ├── app/
│           ├── components/
│           ├── lib/
│           └── hooks/
└── tests/
    └── e2e/
        ├── package.json
        ├── tsconfig.json
        ├── runner.ts
        ├── tier1-features/
        ├── tier2-boundaries/
        ├── tier3-combinations/
        ├── tier4-workloads/
        └── tier5-adversarial/
```
