import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('[web:build] Starting storefront build verification...');

// Step 1: Type check with TypeScript
console.log('[web:build] Executing TypeScript type check (tsc --noEmit)...');
try {
  execSync('tsc --noEmit', { cwd: rootDir, stdio: 'inherit' });
  console.log('[web:build] Type checking passed: 0 type errors');
} catch (err) {
  console.error('[web:build] Type checking failed with errors');
  process.exit(1);
}

// Step 2: Static verification of all 7 App Router routes on disk
const expectedRoutes = [
  { route: '/', filePath: 'src/app/page.tsx' },
  { route: '/cart', filePath: 'src/app/cart/page.tsx' },
  { route: '/catalog', filePath: 'src/app/catalog/page.tsx' },
  { route: '/catalog/[slug]', filePath: 'src/app/catalog/[slug]/page.tsx' },
  { route: '/checkout', filePath: 'src/app/checkout/page.tsx' },
  { route: '/stores', filePath: 'src/app/stores/page.tsx' },
  { route: '/orders/[id]', filePath: 'src/app/orders/[id]/page.tsx' },
];

console.log('[web:build] Verifying App Router routes on disk...');
let missingRoutes = 0;
for (const { route, filePath } of expectedRoutes) {
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[web:build] Missing route component: ${route} (${filePath})`);
    missingRoutes++;
  }
}

if (missingRoutes > 0) {
  console.error(`[web:build] Route verification failed: ${missingRoutes} routes missing`);
  process.exit(1);
}
console.log(`[web:build] Verified ${expectedRoutes.length}/${expectedRoutes.length} App Router routes`);

// Step 3: Validate critical components, contexts, dictionaries, and pure helpers
const criticalModules = [
  'src/components/catalog/ProductStockBadge.tsx',
  'src/components/cart/CartDrawer.tsx',
  'src/components/checkout/KaspiCheckoutModal.tsx',
  'src/components/stores/BranchSelector.tsx',
  'src/components/stores/OtherStoresModal.tsx',
  'src/contexts/CartContext.tsx',
  'src/contexts/BranchContext.tsx',
  'src/contexts/LocaleContext.tsx',
  'src/hooks/use-kaspi-payment.ts',
  'src/dictionaries/ru.ts',
  'src/dictionaries/kz.ts',
  'src/lib/stock-formatters.ts',
  'src/lib/cart-helpers.ts',
  'src/lib/kaspi-helpers.ts',
  'src/lib/locale-helpers.ts',
  'src/lib/branch-constants.ts',
];

console.log('[web:build] Validating critical storefront modules...');
let missingModules = 0;
for (const modPath of criticalModules) {
  const fullPath = path.join(rootDir, modPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[web:build] Missing critical module: ${modPath}`);
    missingModules++;
  }
}

if (missingModules > 0) {
  console.error(`[web:build] Module verification failed: ${missingModules} modules missing`);
  process.exit(1);
}
console.log(`[web:build] Verified ${criticalModules.length}/${criticalModules.length} critical storefront modules`);

console.log('[web:build] Storefront validation complete: all routes, modules, and type assertions verified successfully.\n');
