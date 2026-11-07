import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Custom loader to resolve workspace package '@india-trikotaj/shared'
const sharedPath = path.resolve('packages/shared/dist/index.js');
const sharedUrl = pathToFileURL(sharedPath).href;

const hookCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@india-trikotaj/shared') {
    return { url: '${sharedUrl}', shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
`;

register('data:text/javascript,' + encodeURIComponent(hookCode));

async function verifyUiDist() {
  console.log('--- TESTING packages/ui/dist/index.js EXPORTS ---');
  const ui = await import(pathToFileURL(path.resolve('packages/ui/dist/index.js')).href);

  const expectedExports = [
    // Utilities
    'cn',
    'indiaTrikotajPreset',
    // Button
    'Button',
    'buttonVariants',
    // Card
    'Card',
    'CardHeader',
    'CardTitle',
    'CardDescription',
    'CardContent',
    'CardFooter',
    // Badge
    'Badge',
    'badgeVariants',
    // Dialog
    'Dialog',
    'DialogTrigger',
    'DialogContent',
    'DialogHeader',
    'DialogFooter',
    'DialogTitle',
    'DialogDescription',
    'DialogClose',
    'DialogOverlay',
    'DialogPortal',
    // Select
    'Select',
    'SelectGroup',
    'SelectValue',
    'SelectTrigger',
    'SelectContent',
    'SelectLabel',
    'SelectItem',
    'SelectSeparator',
    'SelectScrollUpButton',
    'SelectScrollDownButton',
    // Input
    'Input',
    // Tabs
    'Tabs',
    'TabsList',
    'TabsTrigger',
    'TabsContent',
    // Skeleton
    'Skeleton',
    'ProductCardSkeleton',
    'StoreBranchSkeleton',
    // Storefront Specialty Components
    'PriceTag',
    'StockIndicator',
  ];

  const actualExports = Object.keys(ui);
  console.log(`Total exports found: ${actualExports.length}`);
  
  let missing = [];
  for (const exp of expectedExports) {
    if (!(exp in ui)) {
      missing.push(exp);
    } else {
      console.log(`  ✓ Exported: ${exp} (${typeof ui[exp]})`);
    }
  }

  if (missing.length > 0) {
    console.error('FAIL: Missing exports:', missing);
    process.exit(1);
  }

  console.log('--- ALL UI COMPONENTS AND PRESETS EXPORTED SUCCESSFULLY ---');
}

verifyUiDist().catch(err => {
  console.error('UI Dist verification failed:', err);
  process.exit(1);
});
