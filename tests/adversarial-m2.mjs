/**
 * EMPIRICAL ADVERSARIAL CHALLENGER SUITE — MILESTONE 2
 * Author: Teamwork Challenger M2_2
 * Scope: RLS Policies, Atomic Stock Procedures, Concurrency/Deadlocks, Docker Compose & Schema Constraints
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const findings = [];

function assert(condition, testName, details = '', severity = 'INFO') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedChecks++;
    const msg = `  ✗ FAIL [${severity}]: ${testName} ${details ? '— ' + details : ''}`;
    console.error(msg);
    findings.push({ testName, severity, details });
  }
}

console.log('================================================================');
console.log('EMPIRICAL CHALLENGER M2: DATABASE SCHEMA, RLS & INFRA AUDIT');
console.log('================================================================\n');

// Load SQL Migration files
const migDir = path.join(projectRoot, 'supabase', 'migrations');
const mig1 = fs.readFileSync(path.join(migDir, '20261102000001_initial_schema.sql'), 'utf8');
const mig2 = fs.readFileSync(path.join(migDir, '20261102000002_indexes_and_constraints.sql'), 'utf8');
const mig3 = fs.readFileSync(path.join(migDir, '20261102000003_functions_and_triggers.sql'), 'utf8');
const mig4 = fs.readFileSync(path.join(migDir, '20261102000004_row_level_security.sql'), 'utf8');
const seed = fs.readFileSync(path.join(projectRoot, 'supabase', 'seed.sql'), 'utf8');
const dockerCompose = fs.readFileSync(path.join(projectRoot, 'docker-compose.yml'), 'utf8');
const envExample = fs.readFileSync(path.join(projectRoot, '.env.example'), 'utf8');
const envFile = fs.readFileSync(path.join(projectRoot, '.env'), 'utf8');

// ----------------------------------------------------------------------------
// SUITE 1: RLS PERFORMANCE & SUBQUERY WRAPPING
// ----------------------------------------------------------------------------
console.log('--- SUITE 1: RLS Performance & Policy Subquery Wrapping ---');

// Rule: auth.uid() and auth.role() must be wrapped in (select auth.uid()) / (select auth.role())
// to prevent per-row evaluation on large table scans.
const lines4 = mig4.split('\n');
let unwrappedAuthUid = 0;
let unwrappedAuthRole = 0;

lines4.forEach((line, idx) => {
  const lineNum = idx + 1;
  const trimmed = line.trim();
  if (trimmed.startsWith('--')) return;

  // Check auth.uid() occurrences not preceded by (select
  const uidRegex = /(?<!\(\s*select\s+)auth\.uid\(\)/gi;
  if (uidRegex.test(trimmed)) {
    console.warn(`    Line ${lineNum}: Unwrapped auth.uid(): ${trimmed}`);
    unwrappedAuthUid++;
  }

  // Check auth.role() occurrences not preceded by (select
  const roleRegex = /(?<!\(\s*select\s+)auth\.role\(\)/gi;
  if (roleRegex.test(trimmed)) {
    console.warn(`    Line ${lineNum}: Unwrapped auth.role(): ${trimmed}`);
    unwrappedAuthRole++;
  }
});

assert(unwrappedAuthUid === 0, 'Zero unwrapped auth.uid() calls in RLS policies', `${unwrappedAuthUid} found`, 'CRITICAL');
assert(unwrappedAuthRole === 0, 'Zero unwrapped auth.role() calls in RLS policies', `${unwrappedAuthRole} found`, 'CRITICAL');

// Verify all 16 tables have RLS enabled
const expectedTables = [
  'stores', 'categories', 'products', 'product_variants', 'product_images',
  'inventory_levels', 'inventory_transactions', 'customer_profiles',
  'user_roles', 'addresses', 'promotions', 'orders', 'order_items',
  'reviews', 'carts', 'cart_items'
];

for (const tbl of expectedTables) {
  const rlsRegex = new RegExp(`alter\\s+table\\s+public\\.${tbl}\\s+enable\\s+row\\s+level\\s+security`, 'i');
  assert(rlsRegex.test(mig4), `RLS enabled on table public.${tbl}`, '', 'HIGH');
}

// ----------------------------------------------------------------------------
// SUITE 2: ADVERSARIAL RLS SECURITY & POLICY BYPASS
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Adversarial RLS Security & Policy Bypass ---');

// Challenge: Cart Policy Bypass Check
// In 20261102000004_row_level_security.sql:
// create policy "Manage own cart" on public.carts for all
//   using (user_id = (select auth.uid()) or (select auth.role()) in ('anon', 'authenticated'))
const cartPolicyMatch = mig4.match(/create\s+policy\s+"Manage own cart"[\s\S]*?using\s*\(([\s\S]*?)\)\s*with\s+check/i);
if (cartPolicyMatch) {
  const cartUsingExpr = cartPolicyMatch[1].trim();
  // Simulate evaluation of policy expression for authenticated user Alice reading Bob's cart:
  const evaluateCartUsing = (cartUserId, requestUserId, requestRole, isStaff = false) => {
    const hasStrictIsolation = cartUsingExpr.includes('user_id is not null and user_id = (select auth.uid())')
      && cartUsingExpr.includes("user_id is null and (select auth.role()) = 'anon'");
    if (hasStrictIsolation) {
      const isOwner = cartUserId !== null && cartUserId === requestUserId;
      const isGuestCartAndAnon = cartUserId === null && requestRole === 'anon';
      return isOwner || isGuestCartAndAnon || isStaff;
    }
    // Flawed legacy condition: user_id = (select auth.uid()) or (select auth.role()) in ('anon', 'authenticated')
    return (cartUserId === requestUserId) || ['anon', 'authenticated'].includes(requestRole);
  };

  const aliceId = '11111111-1111-1111-1111-111111111111';
  const bobId = '22222222-2222-2222-2222-222222222222';
  const canAliceReadBobCart = evaluateCartUsing(bobId, aliceId, 'authenticated');

  assert(
    !canAliceReadBobCart,
    'Cart RLS policy must isolate user carts (Alice cannot read/mutate Bob cart)',
    `Current policy condition "${cartUsingExpr}" allows Alice (role 'authenticated') to access Bob's cart!`,
    'CRITICAL'
  );
} else {
  assert(false, 'Cart policy "Manage own cart" exists', 'Not found in migration 4', 'CRITICAL');
}

// Challenge: Inventory Transactions direct insert policy
// create policy "System can insert inventory transactions" on public.inventory_transactions for insert with check (true);
const invTxPolicyMatch = mig4.match(/create\s+policy\s+"System can insert inventory transactions"[\s\S]*?with\s+check\s*\(([\s\S]*?)\)/i);
if (invTxPolicyMatch) {
  const withCheckExpr = invTxPolicyMatch[1].trim();
  const isDirectInsertPermittedToAll = withCheckExpr === 'true';
  assert(
    !isDirectInsertPermittedToAll,
    'inventory_transactions insert policy should restrict unprivileged direct insertions',
    `Policy allows arbitrary public insert: "with check (${withCheckExpr})" — audit log forging risk`,
    'MEDIUM'
  );
}

// ----------------------------------------------------------------------------
// SUITE 3: ATOMIC STOCK PROCEDURES & CONCURRENCY
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Atomic Stock Procedures & Concurrency ---');

// Check reserve_stock:
const reserveStockMatch = mig3.match(/create\s+or\s+replace\s+function\s+public\.reserve_stock[\s\S]*?\$\$([\s\S]*?)\$\$;/i);
assert(Boolean(reserveStockMatch), 'reserve_stock function exists', '', 'HIGH');

if (reserveStockMatch) {
  const body = reserveStockMatch[1];
  assert(body.includes('for update'), 'reserve_stock uses FOR UPDATE row-level lock', '', 'CRITICAL');
  assert(/if\s+p_quantity\s*<=\s*0\s+then/i.test(body), 'reserve_stock rejects non-positive quantity (<= 0)', '', 'HIGH');
  assert(body.includes('inventory_transactions'), 'reserve_stock inserts audit trail in inventory_transactions', '', 'HIGH');
  assert(/reason[\s\S]*?'reservation'/i.test(body), 'reserve_stock logs reason as "reservation"', '', 'HIGH');
  assert(body.includes('(select auth.uid())'), 'reserve_stock records created_by as (select auth.uid())', '', 'MEDIUM');
}

// Check release_stock:
const releaseStockMatch = mig3.match(/create\s+or\s+replace\s+function\s+public\.release_stock[\s\S]*?\$\$([\s\S]*?)\$\$;/i);
assert(Boolean(releaseStockMatch), 'release_stock function exists', '', 'HIGH');

if (releaseStockMatch) {
  const body = releaseStockMatch[1];
  assert(/if\s+p_quantity\s*<=\s*0\s+then/i.test(body), 'release_stock rejects non-positive quantity (<= 0)', '', 'HIGH');
  assert(body.includes('greatest(0,'), 'release_stock prevents reserved_quantity underflow using greatest(0, ...)', '', 'HIGH');
  assert(/reason[\s\S]*?'reservation_cancellation'/i.test(body), 'release_stock logs reason as "reservation_cancellation"', '', 'HIGH');
  assert(body.includes('-p_quantity'), 'release_stock logs negative delta (-p_quantity)', '', 'HIGH');

  // Check whether release_stock validates row existence (FOUND or rowcount)
  const checksRowExistence = /if\s+not\s+found/i.test(body) || /get\s+diagnostics/i.test(body);
  assert(
    checksRowExistence,
    'release_stock verifies target row exists before returning true / logging transaction',
    'Function returns true unconditionally even if 0 rows updated in inventory_levels',
    'MEDIUM'
  );
}

// Check commit_stock_deduction:
const commitStockMatch = mig3.match(/create\s+or\s+replace\s+function\s+public\.commit_stock_deduction[\s\S]*?\$\$([\s\S]*?)\$\$;/i);
assert(Boolean(commitStockMatch), 'commit_stock_deduction function exists', '', 'HIGH');

if (commitStockMatch) {
  const body = commitStockMatch[1];
  assert(/if\s+p_quantity\s*<=\s*0\s+then/i.test(body), 'commit_stock_deduction rejects non-positive quantity (<= 0)', '', 'HIGH');
  assert(body.includes('greatest(0,'), 'commit_stock_deduction prevents quantity underflow using greatest(0, ...)', '', 'HIGH');
  assert(/reason[\s\S]*?'sale'/i.test(body), 'commit_stock_deduction logs reason as "sale"', '', 'HIGH');

  const checksRowExistence = /if\s+not\s+found/i.test(body) || /get\s+diagnostics/i.test(body);
  assert(
    checksRowExistence,
    'commit_stock_deduction verifies target row exists before returning true / logging transaction',
    'Function returns true unconditionally even if 0 rows updated in inventory_levels',
    'MEDIUM'
  );
}

// Check Concurrency / Multi-item Deadlock Prevention:
// When reserving multiple items, if transactions lock in varying orders, deadlock can occur.
// Is there a batch reservation function or should application sort by variant_id?
const hasBatchReserve = /create\s+or\s+replace\s+function\s+public\.reserve_stock_batch/i.test(mig3);
console.log(`    Note: Batch atomic reservation function present: ${hasBatchReserve} (Application must enforce deterministic variant order to avoid multi-item deadlocks)`);

// ----------------------------------------------------------------------------
// SUITE 4: DOCKER COMPOSE CONFIGURATION & INIT SCRIPTS
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Docker Compose Configuration & Init Scripts ---');

// 1. Port mappings
assert(dockerCompose.includes('"${POSTGRES_PORT:-5432}:5432"'), 'PostgreSQL port mapping defaults to 5432', '', 'HIGH');
assert(dockerCompose.includes('"${MEILISEARCH_PORT:-7700}:7700"'), 'Meilisearch port mapping defaults to 7700', '', 'HIGH');

// 2. Health checks
assert(dockerCompose.includes('pg_isready'), 'PostgreSQL service has pg_isready healthcheck', '', 'HIGH');
assert(dockerCompose.includes('wget -q --spider http://localhost:7700/health'), 'Meilisearch service has HTTP healthcheck', '', 'HIGH');

// 3. Env defaults
assert(dockerCompose.includes('${POSTGRES_USER:-postgres}'), 'POSTGRES_USER defaults to postgres', '', 'MEDIUM');
assert(dockerCompose.includes('${POSTGRES_PASSWORD:-postgres}'), 'POSTGRES_PASSWORD defaults to postgres', '', 'MEDIUM');
assert(dockerCompose.includes('${POSTGRES_DB:-india_trikotaj}'), 'POSTGRES_DB defaults to india_trikotaj', '', 'MEDIUM');
assert(dockerCompose.includes('${MEILISEARCH_MASTER_KEY:-india_trikotaj_local_master_key_2026}'), 'MEILI_MASTER_KEY has fallback default', '', 'MEDIUM');

// 4. Volume persistence
assert(dockerCompose.includes('postgres_data:/var/lib/postgresql/data'), 'PostgreSQL named volume mount defined', '', 'HIGH');
assert(dockerCompose.includes('meili_data:/meili_data'), 'Meilisearch named volume mount defined', '', 'HIGH');

// 5. Initdb mounts and execution order
const initdbMounts = [];
const mountRegex = /-\s*([^:]+):\/docker-entrypoint-initdb\.d\/([^\s:]+)/g;
let m;
while ((m = mountRegex.exec(dockerCompose)) !== null) {
  initdbMounts.push({ src: m[1], dest: m[2] });
}

console.log('    Found /docker-entrypoint-initdb.d/ mounts:');
initdbMounts.forEach(mt => console.log(`      ${mt.dest} <- ${mt.src}`));

// Check for duplicate mounts to the same destination or duplicate files
const destCounts = {};
for (const mt of initdbMounts) {
  destCounts[mt.dest] = (destCounts[mt.dest] || 0) + 1;
}

let hasDuplicateDest = false;
for (const [dest, count] of Object.entries(destCounts)) {
  if (count > 1) {
    hasDuplicateDest = true;
    console.warn(`    Duplicate mount to /docker-entrypoint-initdb.d/${dest} (${count} times)`);
  }
}
assert(!hasDuplicateDest, 'No duplicate mount destinations in /docker-entrypoint-initdb.d/', '', 'HIGH');

// Check if seed.sql is mounted multiple times (e.g. 02_seed.sql AND 05_seed.sql)
const seedMounts = initdbMounts.filter(mt => mt.src.includes('seed.sql'));
const seedMountedMultipleTimes = seedMounts.length > 1;
assert(
  !seedMountedMultipleTimes,
  'seed.sql is mounted exactly once in /docker-entrypoint-initdb.d/',
  `seed.sql mounted ${seedMounts.length} times: ${seedMounts.map(s => s.dest).join(', ')}. In PostgreSQL entrypoint, 02_seed.sql executes before 03/04, and running 05_seed.sql afterwards crashes with duplicate key violation!`,
  'CRITICAL'
);

// ----------------------------------------------------------------------------
// SUITE 5: FOREIGN KEY INDEX 100% COVERAGE & CONSTRAINTS
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Foreign Key Index Coverage & Schema Constraints ---');

// Extract all FK constraints from mig1, ignoring primary keys which already have unique B-tree indexes
const fkRegex = /([a-z0-9_]+)\s+uuid(?:(?!primary\s+key)[^\n,])*references\s+([a-z0-9_.]+)\s*\(\s*([a-z0-9_]+)\s*\)/gi;
const fks = [];
let fkm;
while ((fkm = fkRegex.exec(mig1)) !== null) {
  const col = fkm[1];
  const targetTable = fkm[2];
  fks.push({ col, targetTable });
}

// Also check index creation in mig2
let missingFkIndex = 0;
for (const fk of fks) {
  // Look for index on fk.col in mig2
  const idxPattern = new RegExp(`create\\s+index[^;]*\\([^)]*\\b${fk.col}\\b[^)]*\\)`, 'i');
  const hasIndex = idxPattern.test(mig2);
  if (!hasIndex) {
    console.warn(`    Warning: FK column '${fk.col}' referencing '${fk.targetTable}' might lack explicit B-tree index`);
    missingFkIndex++;
  }
}

assert(missingFkIndex === 0, '100% of detected foreign key columns are indexed in migration 2', `${missingFkIndex} missing indexes`, 'HIGH');

// Check monetary columns have numeric(12, 2)
const monetaryCols = ['base_price_kzt', 'price_kzt', 'subtotal_kzt', 'total_kzt', 'discount_kzt', 'delivery_fee_kzt', 'unit_price_kzt'];
let missingNumeric = 0;
for (const col of monetaryCols) {
  const numRegex = new RegExp(`${col}\\s+numeric\\s*\\(\\s*12\\s*,\\s*2\\s*\\)`, 'i');
  if (!numRegex.test(mig1)) {
    console.warn(`    Monetary column '${col}' not defined as numeric(12, 2)`);
    missingNumeric++;
  }
}
assert(missingNumeric === 0, 'All monetary columns use exact numeric(12, 2) KZT precision', `${missingNumeric} non-numeric(12,2) cols`, 'HIGH');

// ----------------------------------------------------------------------------
// SUITE 6: REAL-WORLD ALMATY SEED DATA HARDENING
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 6: Real-World Almaty Seed Data Hardening ---');

// 1. Stores count & bounds
const storeRegex = /\(\s*'([0-9a-f-]+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([0-9.]+),\s*([0-9.]+)/g;
const seededStores = [];
let sm;
while ((sm = storeRegex.exec(seed)) !== null) {
  seededStores.push({
    id: sm[1],
    slug: sm[3],
    name_ru: sm[4],
    lat: parseFloat(sm[11]),
    lng: parseFloat(sm[12])
  });
}

assert(seededStores.length >= 16, `Seed populates at least 16 Almaty stores (found ${seededStores.length})`, '', 'HIGH');

let oobStores = 0;
for (const s of seededStores) {
  const inBounds = s.lat >= 43.15 && s.lat <= 43.40 && s.lng >= 76.75 && s.lng <= 77.15;
  if (!inBounds) {
    console.error(`    Store '${s.slug}' out of Almaty bounding box: (${s.lat}, ${s.lng})`);
    oobStores++;
  }
}
assert(oobStores === 0, '100% of seeded stores have coordinates within Almaty bounding box [43.15-43.40, 76.75-77.15]', `${oobStores} out of bounds`, 'HIGH');

// 2. Categories
const expectedCats = ['t-shirts', 'long-sleeves', 'robes', 'pajamas', 'thermal-underwear', 'kids-clothing', 'home-textiles'];
let missingCats = 0;
for (const cat of expectedCats) {
  if (!seed.includes(`'${cat}'`)) {
    missingCats++;
  }
}
assert(missingCats === 0, '100% of required clothing categories present in seed.sql', `${missingCats} missing categories`, 'HIGH');

// ============================================================================
// AUDIT SUMMARY & VERDICT RECOMMENDATION
// ============================================================================
console.log('\n================================================================');
console.log('AUDIT SUMMARY');
console.log('================================================================');
console.log(`Total Checks:  ${totalChecks}`);
console.log(`Passed Checks: ${passedChecks}`);
console.log(`Failed Checks: ${failedChecks}`);
console.log('----------------------------------------------------------------');

if (findings.length > 0) {
  console.log('\nDISCOVERED FINDINGS:');
  findings.forEach((f, i) => {
    console.log(`${i + 1}. [${f.severity}] ${f.testName}`);
    if (f.details) console.log(`   Details: ${f.details}`);
  });
}

console.log('\n================================================================\n');

// Exit code based on findings
process.exit(failedChecks > 0 ? 1 : 0);
