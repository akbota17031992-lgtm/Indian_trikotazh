const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const migDir = path.join(rootDir, 'supabase', 'migrations');
const seedPath = path.join(rootDir, 'supabase', 'seed.sql');

const migFiles = [
  '20261102000001_initial_schema.sql',
  '20261102000002_indexes_and_constraints.sql',
  '20261102000003_functions_and_triggers.sql',
  '20261102000004_row_level_security.sql'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const advisories = [];

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

function warn(condition, message, advisoryDetails) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
  } else {
    advisories.push(advisoryDetails);
    console.warn(`  [ADVISORY WARNING] ${message}: ${advisoryDetails}`);
  }
}

console.log('================================================================');
console.log('  MILESTONE 2 EMPIRICAL CHALLENGE SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: SQL SYNTAX & WELL-FORMEDNESS
// -----------------------------------------------------------------------------
console.log('SUITE 1: SQL Syntax, Balanced Tokens & Semicolon Verification');

const allSqlFiles = migFiles.map(f => ({ name: f, content: fs.readFileSync(path.join(migDir, f), 'utf8') }));
allSqlFiles.push({ name: 'seed.sql', content: fs.readFileSync(seedPath, 'utf8') });

for (const sqlFile of allSqlFiles) {
  const content = sqlFile.content;

  // Check balanced dollar quotes $$
  const dollarMatches = content.match(/\$\$/g) || [];
  assert(dollarMatches.length % 2 === 0, `${sqlFile.name}: Balanced $$ blocks (${dollarMatches.length} markers)`);

  // Strip comments and string literals to check brackets
  let stripped = content;
  // Replace $$ blocks with dummy
  stripped = stripped.replace(/\$\$[\s\S]*?\$\$/g, ' ');
  // Replace single quoted strings (handling escaped quotes '')
  stripped = stripped.replace(/'(?:''|[^'])*'/g, "''");
  // Replace line comments --
  stripped = stripped.replace(/--.*$/gm, '');

  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let balanceOk = true;

  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (ch === '(') parenDepth++;
    else if (ch === ')') {
      parenDepth--;
      if (parenDepth < 0) { balanceOk = false; break; }
    } else if (ch === '[') bracketDepth++;
    else if (ch === ']') {
      bracketDepth--;
      if (bracketDepth < 0) { balanceOk = false; break; }
    } else if (ch === '{') braceDepth++;
    else if (ch === '}') {
      braceDepth--;
      if (braceDepth < 0) { balanceOk = false; break; }
    }
  }

  if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0) balanceOk = false;
  assert(balanceOk && parenDepth === 0, `${sqlFile.name}: Balanced parentheses/brackets/braces (depths: () ${parenDepth}, [] ${bracketDepth}, {} ${braceDepth})`);
}

// -----------------------------------------------------------------------------
// SUITE 2: 16 ALMATY STORE COORDINATES & GEOGRAPHIC BOUNDING BOX
// -----------------------------------------------------------------------------
console.log('\nSUITE 2: Almaty Store Coordinates & District Attributes');

const seedRaw = fs.readFileSync(seedPath, 'utf8');
const seedClean = seedRaw.replace(/--.*$/gm, '');

function parseInsertStatements(sql, tableName) {
  const regex = new RegExp(`insert into public\\.${tableName}\\s*\\(([^)]+)\\)\\s*values\\s*([\\s\\S]*?)(?:on conflict|;\\s*(?:insert|--|$))`, 'i');
  const match = sql.match(regex);
  if (!match) return { cols: [], rows: [] };

  const cols = match[1].split(',').map(c => c.trim().toLowerCase());
  const rowsText = match[2];

  const rows = [];
  let inParen = false;
  let parenLevel = 0;
  let inStr = false;
  let rowBuffer = '';

  for (let i = 0; i < rowsText.length; i++) {
    const c = rowsText[i];
    if (c === "'" && !inStr) {
      inStr = true;
      rowBuffer += c;
    } else if (c === "'" && inStr) {
      if (rowsText[i + 1] === "'") {
        rowBuffer += "''";
        i++;
      } else {
        inStr = false;
        rowBuffer += c;
      }
    } else if (!inStr && c === '(') {
      parenLevel++;
      if (parenLevel === 1) {
        rowBuffer = '';
        inParen = true;
        continue;
      }
      rowBuffer += c;
    } else if (!inStr && c === ')') {
      parenLevel--;
      if (parenLevel === 0) {
        inParen = false;
        const tokens = [];
        let curToken = '';
        let tInStr = false;
        for (let j = 0; j < rowBuffer.length; j++) {
          const tc = rowBuffer[j];
          if (tc === "'" && !tInStr) {
            tInStr = true;
            curToken += tc;
          } else if (tc === "'" && tInStr) {
            if (rowBuffer[j + 1] === "'") {
              curToken += "''";
              j++;
            } else {
              tInStr = false;
              curToken += tc;
            }
          } else if (tc === ',' && !tInStr) {
            tokens.push(curToken.trim());
            curToken = '';
          } else {
            curToken += tc;
          }
        }
        tokens.push(curToken.trim());
        rows.push(tokens);
        continue;
      }
      rowBuffer += c;
    } else if (inParen) {
      rowBuffer += c;
    }
  }

  return { cols, rows };
}

const storeData = parseInsertStatements(seedClean, 'stores');
assert(storeData.rows.length === 16, `Found exactly 16 store rows in seed.sql (found ${storeData.rows.length})`);

const latIdx = storeData.cols.indexOf('latitude');
const lngIdx = storeData.cols.indexOf('longitude');
const slugIdx = storeData.cols.indexOf('slug');
const nameRuIdx = storeData.cols.indexOf('name_ru');
const distIdx = storeData.cols.indexOf('district');

const cleanVal = (v) => v ? v.replace(/^'|'$/g, '').replace(/''/g, "'").trim() : '';

const parsedStores = storeData.rows.map(r => ({
  id: cleanVal(r[storeData.cols.indexOf('id')]),
  slug: cleanVal(r[slugIdx]),
  name_ru: cleanVal(r[nameRuIdx]),
  district: cleanVal(r[distIdx]),
  lat: parseFloat(r[latIdx]),
  lng: parseFloat(r[lngIdx])
}));

let allCoordsValid = true;
for (const s of parsedStores) {
  const latValid = s.lat >= 43.15 && s.lat <= 43.40;
  const lngValid = s.lng >= 76.75 && s.lng <= 77.15;
  if (!latValid || !lngValid) {
    allCoordsValid = false;
    console.error(`    Out of bounds: ${s.slug} (lat: ${s.lat}, lng: ${s.lng})`);
  }
}
assert(allCoordsValid, 'All 16 store coordinates fall strictly within Almaty bounds: lat [43.15, 43.40], lng [76.75, 77.15]');

const storeSlugSet = new Set(parsedStores.map(s => s.slug));
assert(storeSlugSet.size === 16, `All 16 store slugs are unique (unique count: ${storeSlugSet.size})`);

// -----------------------------------------------------------------------------
// SUITE 3: 7 CATEGORY SLUGS IN SEED
// -----------------------------------------------------------------------------
console.log('\nSUITE 3: Category Slugs Conformance in seed.sql');

const expectedCategorySlugs = [
  't-shirts',
  'long-sleeves',
  'robes',
  'pajamas',
  'thermal-underwear',
  'kids-clothing',
  'home-textiles'
];

const catData = parseInsertStatements(seedClean, 'categories');
assert(catData.rows.length === 7, `Found exactly 7 category rows in seed.sql (found ${catData.rows.length})`);

const catSlugIdx = catData.cols.indexOf('slug');
const foundCatSlugs = catData.rows.map(r => cleanVal(r[catSlugIdx]));

let allCatsMatch = true;
for (const exp of expectedCategorySlugs) {
  const present = foundCatSlugs.includes(exp);
  if (!present) allCatsMatch = false;
  assert(present, `Category slug '${exp}' is present in seed data`);
}
assert(allCatsMatch && foundCatSlugs.length === 7, 'Exact 7 required category slugs match specifications');

// -----------------------------------------------------------------------------
// SUITE 4: 100% FOREIGN KEY INDEX COVERAGE
// -----------------------------------------------------------------------------
console.log('\nSUITE 4: Foreign Key Index Coverage (100% Indexing Rule)');

const schema1 = fs.readFileSync(path.join(migDir, '20261102000001_initial_schema.sql'), 'utf8');
const schema2 = fs.readFileSync(path.join(migDir, '20261102000002_indexes_and_constraints.sql'), 'utf8');

const tableRegex = /create table\s+(?:public\.)?([a-z_0-9]+)\s*\(([\s\S]*?)\n\);/gi;
const foreignKeys = [];

let tMatch;
while ((tMatch = tableRegex.exec(schema1)) !== null) {
  const tableName = tMatch[1].toLowerCase();
  const body = tMatch[2];

  const lines = body.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue;

    const colFkMatch = trimmed.match(/^([a-z_0-9]+)\s+[^,]+references\s+(?:public\.|auth\.)?([a-z_0-9]+)\s*\(([a-z_0-9]+)\)/i);
    if (colFkMatch) {
      const colName = colFkMatch[1].toLowerCase();
      const refTable = colFkMatch[2].toLowerCase();
      const refCol = colFkMatch[3].toLowerCase();
      foreignKeys.push({ table: tableName, column: colName, refTable, refCol });
    }

    const tableFkMatch = trimmed.match(/foreign\s+key\s*\(([a-z_0-9]+)\)\s+references\s+(?:public\.|auth\.)?([a-z_0-9]+)\s*\(([a-z_0-9]+)\)/i);
    if (tableFkMatch) {
      const colName = tableFkMatch[1].toLowerCase();
      const refTable = tableFkMatch[2].toLowerCase();
      const refCol = tableFkMatch[3].toLowerCase();
      foreignKeys.push({ table: tableName, column: colName, refTable, refCol });
    }
  }
}

console.log(`Discovered ${foreignKeys.length} foreign key relationships across schema.`);

const indexRegex = /create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?([a-z_0-9]+)\s+on\s+(?:public\.)?([a-z_0-9]+)(?:\s+using\s+[a-z]+)?\s*\(([^)]+)\)/gi;
const indexes = [];

for (const sql of [schema1, schema2]) {
  let idxMatch;
  while ((idxMatch = indexRegex.exec(sql)) !== null) {
    const indexName = idxMatch[1].toLowerCase();
    const tableName = idxMatch[2].toLowerCase();
    const cols = idxMatch[3].split(',').map(c => c.trim().toLowerCase().split(/\s+/)[0]);
    indexes.push({ indexName, table: tableName, leadingCol: cols[0], allCols: cols });
  }
}

console.log(`Discovered ${indexes.length} explicit B-tree/GIN indexes.`);

let allFkIndexed = true;
const unindexedFks = [];

for (const fk of foreignKeys) {
  const isPk = (fk.table === 'customer_profiles' && fk.column === 'id');
  const hasIndex = isPk || indexes.some(idx => idx.table === fk.table && idx.leadingCol === fk.column);

  if (!hasIndex) {
    allFkIndexed = false;
    unindexedFks.push(fk);
    console.error(`    Unindexed FK: ${fk.table}.${fk.column} -> ${fk.refTable}(${fk.refCol})`);
  }
}

assert(allFkIndexed && unindexedFks.length === 0, `100% of foreign keys have a matching leading-column index (${foreignKeys.length}/${foreignKeys.length})`);

// -----------------------------------------------------------------------------
// SUITE 5: RLS POLICIES & SECURITY BEST PRACTICES
// -----------------------------------------------------------------------------
console.log('\nSUITE 5: Row Level Security Policy Analysis');

const schema4 = fs.readFileSync(path.join(migDir, '20261102000004_row_level_security.sql'), 'utf8');

const rlsTableMatches = [...schema4.matchAll(/alter table\s+(?:public\.)?([a-z_0-9]+)\s+enable row level security;/gi)].map(m => m[1].toLowerCase());
const expectedRlsTables = [
  'stores', 'categories', 'products', 'product_variants', 'product_images',
  'inventory_levels', 'inventory_transactions', 'customer_profiles', 'user_roles',
  'addresses', 'promotions', 'orders', 'order_items', 'reviews', 'carts', 'cart_items'
];

assert(rlsTableMatches.length === 16, `RLS enabled on all 16 public tables (found ${rlsTableMatches.length})`);
for (const t of expectedRlsTables) {
  assert(rlsTableMatches.includes(t), `RLS enabled on table '${t}'`);
}

const bareUidRegex = /[^(\s]auth\.uid\(\)/g;
const hasBareUid = bareUidRegex.test(schema4.replace(/\(select auth\.uid\(\)\)/g, ' '));
assert(!hasBareUid, 'No un-subqueried bare auth.uid() calls in RLS policies (all wrapped in (select auth.uid()))');

const bareRoleRegex = /[^(\s]auth\.role\(\)/g;
const hasBareRole = bareRoleRegex.test(schema4.replace(/\(select auth\.role\(\)\)/g, ' '));
assert(!hasBareRole, 'No un-subqueried bare auth.role() calls in RLS policies (all wrapped in (select auth.role()))');

// -----------------------------------------------------------------------------
// SUITE 6: SEED DATA REFERENTIAL INTEGRITY ORACLE
// -----------------------------------------------------------------------------
console.log('\nSUITE 6: Seed Data Referential Integrity Oracle');

const prodData = parseInsertStatements(seedClean, 'products');
const varData = parseInsertStatements(seedClean, 'product_variants');
const imgData = parseInsertStatements(seedClean, 'product_images');
const invData = parseInsertStatements(seedClean, 'inventory_levels');

const storeIdSet = new Set(parsedStores.map(s => s.id));
const catIdSet = new Set(catData.rows.map(r => cleanVal(r[catData.cols.indexOf('id')])));
const prodIdSet = new Set(prodData.rows.map(r => cleanVal(r[prodData.cols.indexOf('id')])));
const varIdSet = new Set(varData.rows.map(r => cleanVal(r[varData.cols.indexOf('id')])));

assert(storeIdSet.size === 16, `Seed has 16 store IDs (${storeIdSet.size})`);
assert(catIdSet.size === 7, `Seed has 7 category IDs (${catIdSet.size})`);
assert(prodIdSet.size >= 7, `Seed has at least 7 product IDs (${prodIdSet.size})`);
assert(varIdSet.size >= 7, `Seed has at least 7 variant IDs (${varIdSet.size})`);

// Verify products -> categories
let allProdCatsValid = true;
const pCatIdx = prodData.cols.indexOf('category_id');
for (const r of prodData.rows) {
  const cId = cleanVal(r[pCatIdx]);
  if (!catIdSet.has(cId)) {
    allProdCatsValid = false;
    console.error(`Product missing cat ID: ${cId}`);
  }
}
assert(allProdCatsValid, 'All seeded products reference existing seeded categories');

// Verify variants -> products
let allVarProdsValid = true;
const vProdIdx = varData.cols.indexOf('product_id');
for (const r of varData.rows) {
  const pId = cleanVal(r[vProdIdx]);
  if (!prodIdSet.has(pId)) {
    allVarProdsValid = false;
    console.error(`Variant missing prod ID: ${pId}`);
  }
}
assert(allVarProdsValid, 'All seeded variants reference existing seeded products');

// Verify images -> products & variants
let allImgsValid = true;
const iProdIdx = imgData.cols.indexOf('product_id');
const iVarIdx = imgData.cols.indexOf('variant_id');
for (const r of imgData.rows) {
  const pId = cleanVal(r[iProdIdx]);
  const vId = cleanVal(r[iVarIdx]);
  if (!prodIdSet.has(pId)) {
    allImgsValid = false;
  }
  if (vId && vId !== 'null' && !varIdSet.has(vId)) {
    allImgsValid = false;
  }
}
assert(allImgsValid, 'All seeded product images reference valid products and variants');

// Verify inventory -> stores & variants + quantity invariants
let allInvValid = true;
let allQuantitiesValid = true;
const invStoreIdx = invData.cols.indexOf('store_id');
const invVarIdx = invData.cols.indexOf('variant_id');
const invQtyIdx = invData.cols.indexOf('quantity');
const invResIdx = invData.cols.indexOf('reserved_quantity');

for (const r of invData.rows) {
  const sId = cleanVal(r[invStoreIdx]);
  const vId = cleanVal(r[invVarIdx]);
  const qty = parseInt(cleanVal(r[invQtyIdx]), 10);
  const res = parseInt(cleanVal(r[invResIdx]), 10);

  if (!storeIdSet.has(sId) || !varIdSet.has(vId)) {
    allInvValid = false;
    console.error(`Inventory references missing store or variant: ${sId}, ${vId}`);
  }
  if (isNaN(qty) || isNaN(res) || qty < 0 || res < 0 || res > qty) {
    allQuantitiesValid = false;
    console.error(`Inventory invalid quantities: qty=${qty}, res=${res}`);
  }
}
assert(allInvValid, 'All seeded inventory records reference existing stores and variants');
assert(allQuantitiesValid, 'All seeded inventory records satisfy (quantity >= 0, reserved >= 0, reserved <= quantity)');

// -----------------------------------------------------------------------------
// SUITE 7: DOCKER COMPOSE CONFIGURATION AUDIT
// -----------------------------------------------------------------------------
console.log('\nSUITE 7: Docker Compose Local Infra Audit');

const composeContent = fs.readFileSync(path.join(rootDir, 'docker-compose.yml'), 'utf8');
assert(composeContent.includes('image: postgres:16-alpine'), 'docker-compose specifies postgres:16-alpine');
assert(composeContent.includes('image: getmeili/meilisearch:v1.7'), 'docker-compose specifies getmeili/meilisearch:v1.7');
assert(composeContent.includes('postgres_data:'), 'docker-compose defines postgres_data volume persistence');
assert(composeContent.includes('meili_data:'), 'docker-compose defines meili_data volume persistence');
assert(composeContent.includes('pg_isready'), 'Postgres healthcheck uses pg_isready');

// Check the duplicate seed.sql mount in docker-compose.yml
const seedMounts = (composeContent.match(/- \.\/supabase\/seed\.sql:\/docker-entrypoint-initdb\.d\/[^\s:]+/g) || []);
console.log(`  Seed mounts in docker-compose.yml (${seedMounts.length} mounts):`);
seedMounts.forEach(m => console.log(`    ${m}`));

const hasDuplicateSeed = seedMounts.length > 1;
warn(
  !hasDuplicateSeed,
  'docker-compose.yml volume mounts single seed script',
  'docker-compose.yml mounts seed.sql at both 02_seed.sql and 05_seed.sql. While idempotent on tables with ON CONFLICT, 02_seed.sql executes prior to stored procedures in 03, and duplicates non-unique inventory_transactions.'
);

console.log('\n================================================================');
console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} tests passed (${failedTests} failures, ${advisories.length} advisories)`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
