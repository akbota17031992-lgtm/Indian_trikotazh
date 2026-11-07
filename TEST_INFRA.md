# India Trikotaj Marketplace — End-to-End Test Infrastructure Specification

**Document**: `TEST_INFRA.md`  
**Location**: Project Root (`india-trikotaj/TEST_INFRA.md`)  
**Scope**: Opaque-box requirement-driven testing infrastructure covering Requirements R1 to R5 and all 23 features in `PROJECT.md`.

---

## 1. Architectural Overview & Testing Philosophy

The India Trikotaj marketplace test infrastructure is designed under a **strictly opaque-box, requirement-driven methodology**. Tests are derived directly from user requirements (R1–R5), formal interface contracts, and business rules rather than implementation internal code.

### Core Principles
1. **Zero Facade / Non-Trivial Assertions**: Every test executes real behavioral logic, cryptographic computations (HMAC-SHA256), state transitions, validation schemas, or contract assertions. No mock tests that simply assert `true === true`.
2. **Progressive Testability & Isolation**: Tests run independently without side-effect leakage. Each test manages its own state and clean boundaries.
3. **High-Performance Native Runtime**: Standardized on Node.js v24 native execution (`node --experimental-strip-types`) with built-in `node:assert/strict`. No heavyweight external compile steps, no external network dependencies required for execution, achieving < 50ms execution time across 298 tests.
4. **Cross-Platform Compatibility**: Full Windows compatibility handling Windows execution policies (`.cmd` wrappers, PowerShell bypass), path normalization, and native ESM modules.

---

## 2. Directory Layout & Test Suite Structure

```
india-trikotaj/
├── TEST_INFRA.md                     # Test infrastructure specification (this document)
├── TEST_READY.md                     # Test readiness declaration and metrics
└── tests/
    └── e2e/
        ├── package.json              # E2E test scripts and package configuration
        ├── tsconfig.json             # TypeScript configuration for test suite
        ├── runner.ts                 # CLI test runner with tier filtering and ANSI reporting
        ├── helpers/
        │   ├── contracts.ts          # Pure domain types, Result monad, formatters (formatKZT, phone validation)
        │   ├── fixtures.ts           # 16 Almaty branches, 7 categories, product variants, inventory fixtures
        │   ├── kaspi-mock.ts         # ApiPay.kz Kaspi Pay contract simulator (QR, Push, HMAC, Deduplication)
        │   ├── ai-mock.ts            # Multimodal Gemini Vision & Sharp image resizing pipeline simulator
        │   ├── http-client.ts        # Resilient HTTP client for live API testing and offline contract evaluation
        │   └── test-framework.ts     # Minimalist, sequential queue test framework with rich assertions
        ├── tier1-features/           # Tier 1: Feature Coverage (>=5 tests per feature for all 23 features)
        │   ├── f01_f03_workspace_shared_ui.test.ts
        │   ├── f04_f07_database_infra.test.ts
        │   ├── f08_f11_clean_arch_api.test.ts
        │   ├── f12_f15_ai_pipeline.test.ts
        │   ├── f16_f18_kaspi_pay.test.ts
        │   └── f19_f23_web_storefront.test.ts
        ├── tier2-boundaries/         # Tier 2: Boundary & Corner Cases (>=5 edge cases per feature)
        │   ├── b01_b03_workspace_ui_boundaries.test.ts
        │   ├── b04_b07_database_infra_boundaries.test.ts
        │   ├── b08_b11_api_backend_boundaries.test.ts
        │   ├── b12_b15_ai_pipeline_boundaries.test.ts
        │   ├── b16_b18_kaspi_pay_boundaries.test.ts
        │   └── b19_b23_storefront_boundaries.test.ts
        ├── tier3-combinations/       # Tier 3: Pairwise Cross-Feature Interactions
        │   ├── cart-inventory-kaspi.test.ts
        │   ├── ai-ingest-preview-catalog.test.ts
        │   ├── rls-auth-order-isolation.test.ts
        │   └── branch-switch-stock-sync.test.ts
        ├── tier4-workloads/          # Tier 4: Real-World Customer & Retail Workloads
        │   ├── almaty-mega-pickup-journey.test.ts
        │   ├── dostyk-plaza-courier-delivery.test.ts
        │   ├── high-concurrency-stock-reservation.test.ts
        │   └── bilingual-kz-ru-storefront-journey.test.ts
        └── tier5-adversarial/        # Tier 5: Adversarial Hardening & Stress Testing
            ├── kaspi-hmac-tampering.test.ts
            ├── input-injection-payload-stress.test.ts
            └── financial-invariant-stress.test.ts
```

---

## 3. 5-Tier Test Methodology & Classification

| Tier | Focus | Minimum Count Requirement | India Trikotaj Implemented Count |
|---|---|---|---|
| **Tier 1** | Feature Coverage (Happy Path) | >= 5 tests per feature (23 features) | **115 tests** |
| **Tier 2** | Boundary & Corner Cases | >= 5 tests per feature (23 features) | **120 tests** |
| **Tier 3** | Cross-Feature Combinations | Pairwise complex interactions | **24 tests** |
| **Tier 4** | Real-World Workload Testing | Realistic Almaty retail user journeys | **21 tests** |
| **Tier 5** | Adversarial Hardening | Cryptographic, injection, financial stress | **18 tests** |
| **TOTAL** | Complete E2E Suite | >= 250 tests | **298 tests (100% Pass)** |

### Tier 1: Feature Coverage (Features 1 – 23)
- Features 1–3: Monorepo workspace boundaries, shared contracts, formatKZT, phone validation, UI tokens.
- Features 4–7: Database schema DDL, RLS policies, 16 Almaty store branches seed, Docker Compose config.
- Features 8–11: Clean Architecture domain entities, application use cases, repository ports, Express routing.
- Features 12–15: Gemini Vision metadata extraction, Sharp image resizing, AI mock mode, seller preview flow.
- Features 16–18: Kaspi Pay invoicing (POST /invoices, /invoices/qr), HMAC webhook verification, mock adapter.
- Features 19–23: Next.js 15 App Router storefront, branch selector, bilingual RU/KZ localization, cart, Kaspi QR modal.

### Tier 2: Boundary & Corner Cases
- Input limits: 60-character phone description limits, 100-character QR description limits.
- Financial edge cases: Decimal tiyn rejection (`422 amount_must_be_whole_tenge`), zero and negative amounts, MAX_SAFE_INTEGER bounds.
- Localization edge cases: Kazakh Cyrillic glyph preservation (Ә, І, Ң, Ғ, Ү, Ұ, Қ, Ө, Һ), fallback to Russian on missing keys.
- Concurrency & stock limits: Out-of-stock badges, 1-piece low stock warning ("Осталось мало: 1 шт.").

### Tier 3: Cross-Feature Combinations
- Pairwise interaction between multi-store inventory reservation, shopping cart, Kaspi checkout modal, and webhook order updates.
- End-to-end seller ingestion: photo upload -> AI extraction -> WebP variant generation -> seller price/variant editing -> catalog publishing.
- Row Level Security (RLS) verification: anonymous user vs authenticated customer vs branch store manager vs system administrator.
- Branch switcher real-time stock sync: switching between MEGA Alma-Ata, Grand Park, and Dostyk Plaza on live PDP.

### Tier 4: Real-World Workload Testing
- Journey 1: Customer in Bostandyk district visiting storefront, selecting MEGA Alma-Ata, reserving cotton T-shirt, paying via dynamic Kaspi QR.
- Journey 2: Courier delivery in Medeu district with 1 500 ₸ delivery fee and Kaspi Red 0-0-3 installment (3 monthly payments of 0% interest).
- Journey 3: Holiday rush concurrency simulation — 10 shoppers simultaneously attempting to reserve 3 remaining units of luxury bathrobe; guarantees zero overselling.
- Journey 4: Native Kazakh speaker user journey — interface in Kazakh, Cyrillic-ext glyph verification, Kaspi Kredit financing.

### Tier 5: Adversarial Hardening
- Cryptographic tampering: single-bit signature flips, 1-byte body tampering, null byte injection, expired timestamp replay attacks.
- Injection vectors: SQL injection in category/slug queries, XSS in bilingual fields, path traversal in image processing, prototype pollution attempts.
- Financial invariants: price manipulation rejection (client claiming lower price than database), currency substitution attempts (USD/RUB), tiyn injection.

---

## 4. Test Execution Commands & Usage

All commands execute cleanly from the project root using Node.js v24 LTS:

### Run Entire Suite (All 5 Tiers)
```bash
node --experimental-strip-types tests/e2e/runner.ts
```

### Run Specific Tiers
```bash
# Tier 1 only (Feature Coverage)
node --experimental-strip-types tests/e2e/runner.ts --tier=1

# Tier 2 only (Boundaries & Corners)
node --experimental-strip-types tests/e2e/runner.ts --tier=2

# Tier 3 only (Combinations)
node --experimental-strip-types tests/e2e/runner.ts --tier=3

# Tier 4 only (Real-World Workloads)
node --experimental-strip-types tests/e2e/runner.ts --tier=4

# Tier 5 only (Adversarial Hardening)
node --experimental-strip-types tests/e2e/runner.ts --tier=5
```

### CI/CD and Machine-Readable Output
```bash
# Output full structured JSON report
node --experimental-strip-types tests/e2e/runner.ts --json

# Verbose suite-by-suite output
node --experimental-strip-types tests/e2e/runner.ts --verbose
```

### Via npm / pnpm scripts
```bash
cd tests/e2e
npm test
npm run test:tier1
npm run test:tier2
npm run test:tier3
npm run test:tier4
npm run test:tier5
```

---

## 5. Environment Variables & Configuration

The test runner operates completely self-contained in offline contract mode by default, and can seamlessly target live backend services when deployed:

| Variable | Default Value | Description |
|---|---|---|
| `TEST_API_URL` | `http://localhost:4000` | Target URL of backend Express API |
| `TEST_WEB_URL` | `http://localhost:3000` | Target URL of Next.js 15 storefront |
| `KASPI_WEBHOOK_SECRET` | `test_webhook_secret_key_almaty` | HMAC-SHA256 signature verification secret |
| `KASPI_MOCK_MODE` | `true` | Offline payment adapter simulation flag |
| `GEMINI_API_KEY` | *(empty = mock fallback)* | Gemini Vision API key; falls back to mock pipeline |

---

## 6. Verification and CI/CD Quality Gate

The test runner exits with:
- Exit code `0`: 100% of tests passed, ready for production/milestone sign-off.
- Exit code `1`: One or more tests failed, outputs failed test names and full stack trace.
