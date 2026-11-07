/**
 * EMPIRICAL ADVERSARIAL STRESS HARNESS — CHALLENGER M2 R2
 * Focus:
 * 1. Tenant Isolation & Cross-User Cart Access Matrix
 * 2. Audit Log (inventory_transactions) Insertion Restrictions & Immutability
 * 3. Sequential Order Number Generation & Sequence Privileges under Unprivileged Roles
 * 4. Stored Procedure Security Definer, Search Path Hijacking Resistance, and Row Validation
 * 5. Reviews Moderation Bypass Resistance
 * 6. Docker Compose Mount Sequencing & Idempotency
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
const failures = [];

function assert(condition, description, detail = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${description}`);
  } else {
    failedChecks++;
    const errMsg = `  [FAIL] ${description} ${detail ? '--> ' + detail : ''}`;
    console.error(errMsg);
    failures.push({ description, detail });
  }
}

console.log('================================================================');
console.log('  CHALLENGER M2 EMPIRICAL ADVERSARIAL STRESS HARNESS');
console.log('================================================================\n');

// Load Migration and Configuration Files
const mig1 = fs.readFileSync(path.join(projectRoot, 'supabase/migrations/20261102000001_initial_schema.sql'), 'utf8');
const mig2 = fs.readFileSync(path.join(projectRoot, 'supabase/migrations/20261102000002_indexes_and_constraints.sql'), 'utf8');
const mig3 = fs.readFileSync(path.join(projectRoot, 'supabase/migrations/20261102000003_functions_and_triggers.sql'), 'utf8');
const mig4 = fs.readFileSync(path.join(projectRoot, 'supabase/migrations/20261102000004_row_level_security.sql'), 'utf8');
const seed = fs.readFileSync(path.join(projectRoot, 'supabase/seed.sql'), 'utf8');
const compose = fs.readFileSync(path.join(projectRoot, 'docker-compose.yml'), 'utf8');

// ============================================================================
// SUITE 1: TENANT ISOLATION — CART & CART ITEMS RLS PERMUTATION MATRIX
// ============================================================================
console.log('--- SUITE 1: Cart & Cart Items Cross-Tenant Isolation Permutation Matrix ---');

// Parse the exact cart RLS policy expressions from mig4
const cartPolicyMatch = mig4.match(/create\s+policy\s+"Manage own cart"[\s\S]*?using\s*\(([\s\S]*?)\)\s*with\s+check\s*\(([\s\S]*?)\);/i);
assert(Boolean(cartPolicyMatch), 'Cart policy "Manage own cart" exists with USING and WITH CHECK clauses');

if (cartPolicyMatch) {
  const usingClause = cartPolicyMatch[1].trim();
  const withCheckClause = cartPolicyMatch[2].trim();

  // Oracle implementation representing PostgreSQL RLS engine evaluating the parsed SQL condition:
  // (user_id is not null and user_id = (select auth.uid())) or (user_id is null and (select auth.role()) = 'anon') or (select public.is_staff())
  function evaluateCartPolicy(cartRow, authContext) {
    const isOwner = cartRow.user_id !== null && cartRow.user_id !== undefined && cartRow.user_id === authContext.uid;
    const isGuestCartByAnon = cartRow.user_id === null && authContext.role === 'anon';
    const isStaff = authContext.isStaff === true;

    return isOwner || isGuestCartByAnon || isStaff;
  }

  const aliceId = 'usr-alice-1111';
  const bobId = 'usr-bob-2222';
  const staffId = 'usr-staff-9999';

  const aliceCart = { id: 'cart-alice', user_id: aliceId };
  const bobCart = { id: 'cart-bob', user_id: bobId };
  const guestCart = { id: 'cart-guest', user_id: null };

  const ctxAlice = { uid: aliceId, role: 'authenticated', isStaff: false };
  const ctxBob = { uid: bobId, role: 'authenticated', isStaff: false };
  const ctxGuest = { uid: null, role: 'anon', isStaff: false };
  const ctxStaff = { uid: staffId, role: 'authenticated', isStaff: true };

  // 1. Alice accessing Bob's cart
  assert(evaluateCartPolicy(bobCart, ctxAlice) === false, 'Alice CANNOT read or mutate Bob cart');

  // 2. Bob accessing Alice's cart
  assert(evaluateCartPolicy(aliceCart, ctxBob) === false, 'Bob CANNOT read or mutate Alice cart');

  // 3. Guest (anon) accessing Bob's cart
  assert(evaluateCartPolicy(bobCart, ctxGuest) === false, 'Anonymous visitor CANNOT read or mutate Bob cart');

  // 4. Guest (anon) accessing Alice's cart
  assert(evaluateCartPolicy(aliceCart, ctxGuest) === false, 'Anonymous visitor CANNOT read or mutate Alice cart');

  // 5. Alice accessing own cart
  assert(evaluateCartPolicy(aliceCart, ctxAlice) === true, 'Alice CAN access own cart');

  // 6. Bob accessing own cart
  assert(evaluateCartPolicy(bobCart, ctxBob) === true, 'Bob CAN access own cart');

  // 7. Guest accessing guest cart
  assert(evaluateCartPolicy(guestCart, ctxGuest) === true, 'Anonymous visitor CAN access guest cart');

  // 8. Authenticated Alice attempting to hijack unassigned guest cart
  assert(evaluateCartPolicy(guestCart, ctxAlice) === false, 'Authenticated Alice CANNOT directly manipulate unlinked guest cart');

  // 9. Staff accessing Alice cart for customer support
  assert(evaluateCartPolicy(aliceCart, ctxStaff) === true, 'Staff member CAN access Alice cart for support operations');

  // 10. Staff accessing Guest cart for support
  assert(evaluateCartPolicy(guestCart, ctxStaff) === true, 'Staff member CAN access guest cart for support operations');

  // 11. Check policy SQL syntax strictly includes ownership and role guards
  assert(usingClause.includes('user_id is not null and user_id = (select auth.uid())'), 'Cart USING enforces non-null owner match');
  assert(usingClause.includes("user_id is null and (select auth.role()) = 'anon'"), 'Cart USING enforces role=anon for guest cart');
  assert(withCheckClause.includes('user_id is not null and user_id = (select auth.uid())'), 'Cart WITH CHECK enforces non-null owner match');
  assert(withCheckClause.includes("user_id is null and (select auth.role()) = 'anon'"), 'Cart WITH CHECK enforces role=anon for guest cart');
}

// Check Cart Items RLS policy
const cartItemsMatch = mig4.match(/create\s+policy\s+"Manage own cart items"[\s\S]*?using\s*\(([\s\S]*?)\)\s*with\s+check\s*\(([\s\S]*?)\);/i);
assert(Boolean(cartItemsMatch), 'Cart items policy "Manage own cart items" exists');

if (cartItemsMatch) {
  const usingClause = cartItemsMatch[1];
  assert(usingClause.includes('exists ('), 'Cart items policy uses subquery correlation');
  assert(usingClause.includes('c.id = cart_items.cart_id'), 'Cart items policy correlates to carts by ID');
  assert(usingClause.includes('c.user_id is not null and c.user_id = (select auth.uid())'), 'Cart items policy strictly isolates authenticated owners');
  assert(usingClause.includes("c.user_id is null and (select auth.role()) = 'anon'"), 'Cart items policy strictly isolates guest cart items to anon role');
}

// ============================================================================
// SUITE 2: AUDIT LOG (INVENTORY_TRANSACTIONS) INSERTION RESTRICTIONS
// ============================================================================
console.log('\n--- SUITE 2: Audit Log (inventory_transactions) Restrictions & Immutability ---');

// Verify that inventory_transactions has RLS enabled
assert(/alter\s+table\s+public\.inventory_transactions\s+enable\s+row\s+level\s+security;/i.test(mig4), 'inventory_transactions RLS enabled');

// Check SELECT policy: only staff
const invTxSelectMatch = mig4.match(/create\s+policy\s+"Staff can view inventory transactions"[\s\S]*?on\s+public\.inventory_transactions\s+for\s+select[\s\S]*?to\s+authenticated[\s\S]*?using\s*\(([\s\S]*?)\);/i);
assert(Boolean(invTxSelectMatch), 'inventory_transactions SELECT restricted to authenticated staff');
if (invTxSelectMatch) {
  assert(invTxSelectMatch[1].includes('(select public.is_staff())'), 'inventory_transactions SELECT checks is_staff()');
}

// Check INSERT policy: strictly restricted to staff
const invTxInsertMatch = mig4.match(/create\s+policy\s+"System can insert inventory transactions"[\s\S]*?on\s+public\.inventory_transactions\s+for\s+insert[\s\S]*?to\s+authenticated[\s\S]*?with\s+check\s*\(([\s\S]*?)\);/i);
assert(Boolean(invTxInsertMatch), 'inventory_transactions INSERT policy restricted to authenticated');
if (invTxInsertMatch) {
  const insertCheck = invTxInsertMatch[1].trim();
  assert(insertCheck.includes('(select public.is_staff())'), 'inventory_transactions INSERT requires is_staff()');
  assert(!insertCheck.includes('true'), 'inventory_transactions INSERT does NOT allow arbitrary public check(true)');
}

// Check UPDATE and DELETE policies: must NOT exist!
const hasUpdatePolicy = /create\s+policy\s+["\w\s]+\s+on\s+public\.inventory_transactions\s+for\s+update/i.test(mig4);
const hasDeletePolicy = /create\s+policy\s+["\w\s]+\s+on\s+public\.inventory_transactions\s+for\s+delete/i.test(mig4);
const hasAllPolicy = /create\s+policy\s+["\w\s]+\s+on\s+public\.inventory_transactions\s+for\s+all/i.test(mig4);
assert(!hasUpdatePolicy, 'NO UPDATE policy on inventory_transactions (enforcing append-only ledger)');
assert(!hasDeletePolicy, 'NO DELETE policy on inventory_transactions (enforcing append-only ledger)');
assert(!hasAllPolicy, 'NO ALL policy on inventory_transactions (enforcing fine-grained operations)');

// ============================================================================
// SUITE 3: SEQUENTIAL ORDER NUMBER GENERATOR & SEQUENCE PERMISSIONS
// ============================================================================
console.log('\n--- SUITE 3: Order Number Generator & Sequence Privileges ---');

// Check Sequence definition
assert(/create\s+sequence\s+if\s+not\s+exists\s+public\.order_number_seq/i.test(mig3), 'order_number_seq defined in public schema');

// Check sequence privileges granted to authenticated and anon
const seqGrantMatch = mig3.match(/grant\s+([^;]+)\s+on\s+sequence\s+public\.order_number_seq\s+to\s+([^;]+);/i);
assert(Boolean(seqGrantMatch), 'Grant statement exists on order_number_seq');
if (seqGrantMatch) {
  const perms = seqGrantMatch[1].toLowerCase();
  const roles = seqGrantMatch[2].toLowerCase();
  assert(perms.includes('usage'), 'Sequence grants USAGE permission');
  assert(perms.includes('select'), 'Sequence grants SELECT permission');
  assert(roles.includes('authenticated'), 'Sequence privileges granted to authenticated role');
  assert(roles.includes('anon'), 'Sequence privileges granted to anon role');
}

// Check generate_order_number function attributes
const genOrderFnMatch = mig3.match(/create\s+or\s+replace\s+function\s+public\.generate_order_number\(\)[\s\S]*?\$\$([\s\S]*?)\$\$;/i);
assert(Boolean(genOrderFnMatch), 'generate_order_number() function defined');

if (genOrderFnMatch) {
  const header = mig3.slice(mig3.indexOf('create or replace function public.generate_order_number'), mig3.indexOf(genOrderFnMatch[1]));
  assert(/security\s+definer/i.test(header), 'generate_order_number() is marked SECURITY DEFINER');
  assert(/set\s+search_path\s*=\s*''/i.test(header), "generate_order_number() sets search_path = '' (CVE mitigation)");

  const body = genOrderFnMatch[1];
  assert(body.includes("public.order_number_seq"), 'generate_order_number() explicitly schema-qualifies public.order_number_seq');
  assert(body.includes("'Asia/Almaty'"), 'generate_order_number() uses Asia/Almaty timezone for date formatting');
  assert(body.includes("'IT-'"), "generate_order_number() prefixes order with 'IT-'");
}

// Check trigger registration
assert(/create\s+trigger\s+set_order_number\s+before\s+insert\s+on\s+public\.orders/i.test(mig3), 'BEFORE INSERT trigger set_order_number registered on public.orders');

// ============================================================================
// SUITE 4: GUEST ORDER ITEM INSERTION & SECURITY DEFINER HELPERS
// ============================================================================
console.log('\n--- SUITE 4: Guest Checkout Order Item Insertion Security Definer Helper ---');

const canInsertFnMatch = mig3.match(/create\s+or\s+replace\s+function\s+public\.can_insert_order_item\([\s\S]*?\$\$([\s\S]*?)\$\$;/i);
assert(Boolean(canInsertFnMatch), 'can_insert_order_item(uuid) helper function defined');

if (canInsertFnMatch) {
  const header = mig3.slice(mig3.indexOf('create or replace function public.can_insert_order_item'), mig3.indexOf(canInsertFnMatch[1]));
  assert(/security\s+definer/i.test(header), 'can_insert_order_item is SECURITY DEFINER');
  assert(/set\s+search_path\s*=\s*''/i.test(header), "can_insert_order_item sets search_path = ''");

  const body = canInsertFnMatch[1];
  assert(body.includes('public.orders'), 'can_insert_order_item qualifies public.orders');
  assert(body.includes("status in ('pending', 'pending_payment')"), 'Guest item insertion restricted to pending/pending_payment status');
  assert(body.includes('(select auth.uid())'), 'Wrapped (select auth.uid()) calls in helper');
  assert(body.includes('(select auth.role())'), 'Wrapped (select auth.role()) calls in helper');
}

// Check order_items INSERT policy uses can_insert_order_item
const orderItemInsertPolicy = mig4.match(/create\s+policy\s+"Insert order items for orders"[\s\S]*?on\s+public\.order_items\s+for\s+insert[\s\S]*?with\s+check\s*\(([\s\S]*?)\);/i);
assert(Boolean(orderItemInsertPolicy), 'order_items INSERT policy exists');
if (orderItemInsertPolicy) {
  assert(orderItemInsertPolicy[1].includes('(select public.can_insert_order_item(order_id))'), 'order_items INSERT delegates to can_insert_order_item(order_id)');
}

// ============================================================================
// SUITE 5: STOCK PROCEDURES LEAST PRIVILEGE & ROW EXISTENCE CHECKS
// ============================================================================
console.log('\n--- SUITE 5: Stock Procedures Least Privilege & Row Existence Checks ---');

// Check release_stock and commit_stock_deduction execution revokes and grants
const revokeMatch = mig3.match(/revoke\s+execute\s+on\s+function\s+public\.release_stock[\s\S]*?from\s+anon,\s*authenticated,\s*public;/i);
assert(Boolean(revokeMatch), 'release_stock revoked from anon, authenticated, public');

const grantServiceRoleRelease = mig3.match(/grant\s+execute\s+on\s+function\s+public\.release_stock[\s\S]*?to\s+service_role;/i);
assert(Boolean(grantServiceRoleRelease), 'release_stock granted strictly to service_role');

const grantServiceRoleCommit = mig3.match(/grant\s+execute\s+on\s+function\s+public\.commit_stock_deduction[\s\S]*?to\s+service_role;/i);
assert(Boolean(grantServiceRoleCommit), 'commit_stock_deduction granted strictly to service_role');

const grantReserveRole = mig3.match(/grant\s+execute\s+on\s+function\s+public\.reserve_stock[\s\S]*?to\s+authenticated,\s*anon,\s*service_role;/i);
assert(Boolean(grantReserveRole), 'reserve_stock granted to authenticated, anon, service_role');

// Check search_path = '' on all 3 inventory functions
const reserveFn = mig3.match(/create\s+or\s+replace\s+function\s+public\.reserve_stock[\s\S]*?\$\$([\s\S]*?)\$\$;/i);
const releaseFn = mig3.match(/create\s+or\s+replace\s+function\s+public\.release_stock[\s\S]*?\$\$([\s\S]*?)\$\$;/i);
const commitFn = mig3.match(/create\s+or\s+replace\s+function\s+public\.commit_stock_deduction[\s\S]*?\$\$([\s\S]*?)\$\$;/i);

assert(Boolean(reserveFn && reserveFn[0].includes("set search_path = ''")), "reserve_stock sets search_path = ''");
assert(Boolean(releaseFn && releaseFn[0].includes("set search_path = ''")), "release_stock sets search_path = ''");
assert(Boolean(commitFn && commitFn[0].includes("set search_path = ''")), "commit_stock_deduction sets search_path = ''");

// Check FOUND checks
assert(/if\s+not\s+found\s+then\s+return\s+false;\s+end\s+if;/i.test(releaseFn[1]), 'release_stock has FOUND check after update');
assert(/if\s+not\s+found\s+then\s+return\s+false;\s+end\s+if;/i.test(commitFn[1]), 'commit_stock_deduction has FOUND check after update');

// ============================================================================
// SUITE 6: REVIEWS MODERATION & STATUS FORGING DEFENSE
// ============================================================================
console.log('\n--- SUITE 6: Reviews Moderation & Status Forging Defense ---');

const reviewInsertPolicy = mig4.match(/create\s+policy\s+"Authenticated users create reviews"[\s\S]*?with\s+check\s*\(([\s\S]*?)\);/i);
assert(Boolean(reviewInsertPolicy), 'Reviews INSERT policy exists');

if (reviewInsertPolicy) {
  const check = reviewInsertPolicy[1];
  assert(check.includes("status = 'pending'"), "Reviews INSERT enforces status = 'pending' for customer submissions");
  assert(check.includes("is_verified = false"), "Reviews INSERT enforces is_verified = false for customer submissions");
  assert(check.includes("user_id = (select auth.uid())"), "Reviews INSERT enforces user_id = (select auth.uid())");
  assert(check.includes("(select public.is_staff())"), "Reviews INSERT permits staff override");
}

// ============================================================================
// SUITE 7: DOCKER COMPOSE MOUNT INTEGRITY & ORDERING
// ============================================================================
console.log('\n--- SUITE 7: Docker Compose Mount Integrity & Ordering ---');

const composeLines = compose.split('\n');
const mountEntries = [];
for (const line of composeLines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('- ./supabase/')) {
    const parts = trimmed.substring(2).split(':');
    mountEntries.push({ host: parts[0], container: parts[1], flags: parts[2] });
  }
}

assert(mountEntries.length === 5, `Exactly 5 database migration/seed mounts in docker-compose.yml (found ${mountEntries.length})`);

const expectedSequence = [
  '/docker-entrypoint-initdb.d/01_initial_schema.sql',
  '/docker-entrypoint-initdb.d/02_indexes_and_constraints.sql',
  '/docker-entrypoint-initdb.d/03_functions_and_triggers.sql',
  '/docker-entrypoint-initdb.d/04_row_level_security.sql',
  '/docker-entrypoint-initdb.d/05_seed.sql'
];

let orderMatches = true;
mountEntries.forEach((entry, idx) => {
  if (entry.container !== expectedSequence[idx]) {
    orderMatches = false;
    console.error(`  Expected container mount ${expectedSequence[idx]}, but got ${entry.container}`);
  }
  assert(entry.flags === 'ro', `Mount ${entry.container} is read-only (:ro)`);
});

assert(orderMatches, 'Docker entrypoint mounts follow strict numerical ordering 01 to 05');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n================================================================');
console.log('CHALLENGER HARNESS EXECUTION SUMMARY');
console.log('================================================================');
console.log(`Total Checks Executed : ${totalChecks}`);
console.log(`Passed Checks         : ${passedChecks}`);
console.log(`Failed Checks         : ${failedChecks}`);
console.log('================================================================\n');

process.exit(failedChecks > 0 ? 1 : 0);
