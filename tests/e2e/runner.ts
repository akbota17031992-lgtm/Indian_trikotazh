#!/usr/bin/env node
/**
 * India Trikotaj Marketplace — End-to-End Test Runner
 *
 * Usage:
 *   node --experimental-strip-types runner.ts
 *   node --experimental-strip-types runner.ts --tier=1
 *   node --experimental-strip-types runner.ts --tier=2
 *   node --experimental-strip-types runner.ts --tier=3
 *   node --experimental-strip-types runner.ts --tier=4
 *   node --experimental-strip-types runner.ts --tier=5
 *   node --experimental-strip-types runner.ts --tier=all
 *   node --experimental-strip-types runner.ts --verbose
 *   node --experimental-strip-types runner.ts --json
 */

import { registry } from './helpers/test-framework.ts';

// Tier 1 Suites
import { run as runT1F01F03 } from './tier1-features/f01_f03_workspace_shared_ui.test.ts';
import { run as runT1F04F07 } from './tier1-features/f04_f07_database_infra.test.ts';
import { run as runT1F08F11 } from './tier1-features/f08_f11_clean_arch_api.test.ts';
import { run as runT1F12F15 } from './tier1-features/f12_f15_ai_pipeline.test.ts';
import { run as runT1F16F18 } from './tier1-features/f16_f18_kaspi_pay.test.ts';
import { run as runT1F19F23 } from './tier1-features/f19_f23_web_storefront.test.ts';

// Tier 2 Suites
import { run as runT2B01B03 } from './tier2-boundaries/b01_b03_workspace_ui_boundaries.test.ts';
import { run as runT2B04B07 } from './tier2-boundaries/b04_b07_database_infra_boundaries.test.ts';
import { run as runT2B08B11 } from './tier2-boundaries/b08_b11_api_backend_boundaries.test.ts';
import { run as runT2B12B15 } from './tier2-boundaries/b12_b15_ai_pipeline_boundaries.test.ts';
import { run as runT2B16B18 } from './tier2-boundaries/b16_b18_kaspi_pay_boundaries.test.ts';
import { run as runT2B19B23 } from './tier2-boundaries/b19_b23_storefront_boundaries.test.ts';

// Tier 3 Suites
import { run as runT3CartKaspi } from './tier3-combinations/cart-inventory-kaspi.test.ts';
import { run as runT3AiCatalog } from './tier3-combinations/ai-ingest-preview-catalog.test.ts';
import { run as runT3RlsAuth } from './tier3-combinations/rls-auth-order-isolation.test.ts';
import { run as runT3BranchStock } from './tier3-combinations/branch-switch-stock-sync.test.ts';

// Tier 4 Suites
import { run as runT4MegaPickup } from './tier4-workloads/almaty-mega-pickup-journey.test.ts';
import { run as runT4CourierRed } from './tier4-workloads/dostyk-plaza-courier-delivery.test.ts';
import { run as runT4Concurrency } from './tier4-workloads/high-concurrency-stock-reservation.test.ts';
import { run as runT4KazakhJourney } from './tier4-workloads/bilingual-kz-ru-storefront-journey.test.ts';

// Tier 5 Suites
import { run as runT5KaspiHmac } from './tier5-adversarial/kaspi-hmac-tampering.test.ts';
import { run as runT5Injection } from './tier5-adversarial/input-injection-payload-stress.test.ts';
import { run as runT5Financial } from './tier5-adversarial/financial-invariant-stress.test.ts';

interface TierSuite {
  tier: number;
  name: string;
  run: () => Promise<void>;
}

const ALL_SUITES: TierSuite[] = [
  // Tier 1: Feature Coverage (Features 1-23, >=5 tests each)
  { tier: 1, name: 'Tier 1: F01-F03 Monorepo, Shared Contracts, UI Primitives', run: runT1F01F03 },
  { tier: 1, name: 'Tier 1: F04-F07 Database Schema, RLS, Almaty Seed Data, Docker', run: runT1F04F07 },
  { tier: 1, name: 'Tier 1: F08-F11 Clean Arch Entities, Use Cases, Adapters, REST', run: runT1F08F11 },
  { tier: 1, name: 'Tier 1: F12-F15 Gemini Vision AI, Resizing, Mock Mode, Seller Preview', run: runT1F12F15 },
  { tier: 1, name: 'Tier 1: F16-F18 Kaspi Pay Invoicing, Webhook Handler, Mock Adapter', run: runT1F16F18 },
  { tier: 1, name: 'Tier 1: F19-F23 Storefront App Router, Branch Selector, Bilingual, Cart', run: runT1F19F23 },

  // Tier 2: Boundary & Corner Cases (Features 1-23 boundaries)
  { tier: 2, name: 'Tier 2: B01-B03 Workspace, Formatter & UI Boundaries', run: runT2B01B03 },
  { tier: 2, name: 'Tier 2: B04-B07 Database, RLS, GPS Coordinates & Docker Boundaries', run: runT2B04B07 },
  { tier: 2, name: 'Tier 2: B08-B11 Entities, Use Cases, Repository & Express Boundaries', run: runT2B08B11 },
  { tier: 2, name: 'Tier 2: B12-B15 AI Image Aspect Ratios, WebP & Seller Edit Boundaries', run: runT2B12B15 },
  { tier: 2, name: 'Tier 2: B16-B18 Kaspi Limits, Whole Tenge, Secret & Adapter Boundaries', run: runT2B16B18 },
  { tier: 2, name: 'Tier 2: B19-B23 Storefront Query, Stock Cookie, Cyrillic & Cart Boundaries', run: runT2B19B23 },

  // Tier 3: Cross-Feature Combinations
  { tier: 3, name: 'Tier 3: Cart + Inventory Reservation + Kaspi Checkout + Webhook', run: runT3CartKaspi },
  { tier: 3, name: 'Tier 3: AI Photo Ingestion + Resizing + Seller Preview + Catalog Publish', run: runT3AiCatalog },
  { tier: 3, name: 'Tier 3: Database RLS + Customer Isolation + Store Manager RBAC', run: runT3RlsAuth },
  { tier: 3, name: 'Tier 3: Branch Selection + Live PDP Badge + Cross-Branch Pickup', run: runT3BranchStock },

  // Tier 4: Real-World Workload Testing
  { tier: 4, name: 'Tier 4: Almaty MEGA Alma-Ata Store Pickup Journey', run: runT4MegaPickup },
  { tier: 4, name: 'Tier 4: Courier Delivery in Medeu with Kaspi Red Installment (0-0-3)', run: runT4CourierRed },
  { tier: 4, name: 'Tier 4: High-Concurrency Stock Reservation during Peak Rush', run: runT4Concurrency },
  { tier: 4, name: 'Tier 4: Native Kazakh Language Storefront Journey & Kaspi Kredit', run: runT4KazakhJourney },

  // Tier 5: Adversarial Hardening
  { tier: 5, name: 'Tier 5: Kaspi Webhook HMAC Tampering & Timing Attacks', run: runT5KaspiHmac },
  { tier: 5, name: 'Tier 5: Injection Attacks, XSS, Path Traversal & Prototype Pollution', run: runT5Injection },
  { tier: 5, name: 'Tier 5: Financial Invariants, Tiyn Injection & Monetary Attacks', run: runT5Financial }
];

async function main() {
  const args = process.argv.slice(2);
  const tierArg = args.find(a => a.startsWith('--tier='))?.split('=')[1] || 'all';
  const verbose = args.includes('--verbose') || args.includes('-v');
  const jsonOutput = args.includes('--json');

  let targetTiers: number[];
  if (tierArg === 'all') {
    targetTiers = [1, 2, 3, 4, 5];
  } else {
    const parsedTier = parseInt(tierArg, 10);
    if (isNaN(parsedTier) || parsedTier < 1 || parsedTier > 5) {
      console.error(`Invalid tier: ${tierArg}. Must be 1, 2, 3, 4, 5, or 'all'.`);
      process.exit(1);
    }
    targetTiers = [parsedTier];
  }

  const suitesToRun = ALL_SUITES.filter(s => targetTiers.includes(s.tier));

  if (!jsonOutput) {
    console.log('\n================================================================');
    console.log('  INDIA TRIKOTAJ MARKETPLACE — E2E TEST RUNNER');
    console.log('  Phase 1 (MVP) 4-Tier + Adversarial Hardening Test Suite');
    console.log('================================================================');
    console.log(`Target Tiers: [ ${targetTiers.join(', ')} ] | Total Suites: ${suitesToRun.length}\n`);
  }

  const overallStart = Date.now();
  registry.reset();

  for (const suite of suitesToRun) {
    registry.setTier(suite.tier);
    if (!jsonOutput && !verbose) {
      process.stdout.write(`  Running ${suite.name} ... `);
    } else if (verbose && !jsonOutput) {
      console.log(`\n--- Running ${suite.name} ---`);
    }

    const suiteStart = Date.now();
    try {
      await suite.run();
      const suiteDuration = Date.now() - suiteStart;
      if (!jsonOutput && !verbose) {
        console.log(`[PASS] (${suiteDuration}ms)`);
      }
    } catch (err: any) {
      if (!jsonOutput && !verbose) {
        console.log(`[FAIL]`);
      }
      console.error(`Error in suite ${suite.name}:`, err);
    }
  }

  const totalDuration = Date.now() - overallStart;
  const summary = registry.getSummary();

  if (jsonOutput) {
    console.log(JSON.stringify({
      targetTiers,
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      durationMs: totalDuration,
      results: summary.results
    }, null, 2));
    process.exit(summary.failed > 0 ? 1 : 0);
  }

  console.log('\n================================================================');
  console.log('  TEST EXECUTION SUMMARY');
  console.log('================================================================');

  for (const t of targetTiers) {
    const tierSummary = registry.getSummary(t);
    const tierLabels: Record<number, string> = {
      1: 'Tier 1 (Feature Coverage, F01-F23)',
      2: 'Tier 2 (Boundary & Corner Cases)',
      3: 'Tier 3 (Cross-Feature Combinations)',
      4: 'Tier 4 (Real-World Customer Journeys)',
      5: 'Tier 5 (Adversarial Hardening)'
    };
    console.log(`  ${tierLabels[t].padEnd(42)} : ${tierSummary.passed}/${tierSummary.total} passed in ${tierSummary.durationMs}ms`);
  }

  console.log('----------------------------------------------------------------');
  console.log(`  Total Tests Run : ${summary.total}`);
  console.log(`  Passed          : ${summary.passed}`);
  console.log(`  Failed          : ${summary.failed}`);
  console.log(`  Total Duration  : ${totalDuration}ms`);
  console.log('================================================================\n');

  if (summary.failed > 0) {
    console.error(`\nFAILED TEST DETAILS (${summary.failed} failures):`);
    for (const f of summary.results.filter(r => !r.passed)) {
      console.error(`  [X] (Tier ${f.tier}) ${f.suiteName} -> ${f.testName}`);
      console.error(`      Error: ${f.error?.message || f.error}\n`);
    }
    console.error(`[FAIL] ${summary.failed} tests failed! Review failures above.`);
    process.exit(1);
  } else {
    console.log(`[SUCCESS] 100% of tests passed! E2E Test Suite is fully ready.\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
