/**
 * EMPIRICAL CHALLENGER TEST HARNESS
 * Milestone 1 Iteration 2 Hardening & Stress Suite
 */

import {
  ProductFilterQuerySchema,
  KaspiCreateInvoiceInputSchema,
  KaspiWebhookCallbackSchema,
  KaspiDirectWebhookCallbackSchema,
  KaspiPaymentModeSchema,
  formatKZT,
  validateKazakhstanPhone,
  normalizeKazakhstanPhone,
  ok,
  err,
} from '../packages/shared/dist/index.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
  }
}

console.log('\n========================================================');
console.log('CHALLENGE SUITE 1: ProductFilterQuerySchema Boolean Parsing');
console.log('========================================================');

// Test 1: Standard truthy permutations
const truthyCases = ['true', '1', 1, true];
for (const val of truthyCases) {
  const res = ProductFilterQuerySchema.safeParse({ inStock: val });
  assert(res.success && res.data.inStock === true, `inStock=${JSON.stringify(val)} -> true`);
}

// Test 2: Standard falsy permutations
const falsyCases = ['false', '0', 0, false];
for (const val of falsyCases) {
  const res = ProductFilterQuerySchema.safeParse({ inStock: val });
  assert(res.success && res.data.inStock === false, `inStock=${JSON.stringify(val)} -> false`);
}

// Test 3: Empty string, null, undefined permutations (should be omitted / undefined)
const emptyCases = ['', undefined, null];
for (const val of emptyCases) {
  const payload = val === undefined ? {} : { inStock: val };
  const res = ProductFilterQuerySchema.safeParse(payload);
  assert(res.success && res.data.inStock === undefined, `inStock=${JSON.stringify(val)} -> undefined`);
}

// Test 4: Explicit undefined property
const resUndefProp = ProductFilterQuerySchema.safeParse({ inStock: undefined });
assert(resUndefProp.success && resUndefProp.data.inStock === undefined, 'inStock: undefined property -> undefined');

// Test 5: Adversarial / Invalid boolean permutations (MUST REJECT)
const invalidBooleans = [
  'TRUE',
  'FALSE',
  'True',
  'False',
  'yes',
  'no',
  'on',
  'off',
  '2',
  '-1',
  'NaN',
  'null',
  'undefined',
  '1.0',
  '0.0',
  '{}',
  '[]',
  ' true ',
  ' false ',
];
for (const val of invalidBooleans) {
  const res = ProductFilterQuerySchema.safeParse({ inStock: val });
  assert(!res.success, `Reject invalid boolean string: ${JSON.stringify(val)}`);
}

// Test 6: Non-primitive or object injections into inStock
const hostileInStock = [{}, [], [true], ['false'], { foo: 'bar' }, () => {}];
for (const val of hostileInStock) {
  const res = ProductFilterQuerySchema.safeParse({ inStock: val });
  assert(!res.success, `Reject non-primitive inStock: ${typeof val} / ${JSON.stringify(val)}`);
}

// Test 7: Full query object with other fields
const fullValidQuery = {
  categoryId: '11111111-2222-3333-4444-555555555555',
  gender: 'unisex',
  season: 'summer',
  storeId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  inStock: '0',
  minPrice: '1000',
  maxPrice: '50000',
  search: 'Футболка белая',
  page: '2',
  limit: '50',
  sort: 'price_asc',
};
const parsedFull = ProductFilterQuerySchema.safeParse(fullValidQuery);
assert(
  parsedFull.success &&
    parsedFull.data.inStock === false &&
    parsedFull.data.minPrice === 1000 &&
    parsedFull.data.maxPrice === 50000 &&
    parsedFull.data.page === 2 &&
    parsedFull.data.limit === 50 &&
    parsedFull.data.sort === 'price_asc',
  'Full query parsing with coerced numbers and inStock=0'
);

// Test 8: Negative / hostile numbers in page and limit
assert(!ProductFilterQuerySchema.safeParse({ page: '-5' }).success, 'Reject negative page: -5');
assert(!ProductFilterQuerySchema.safeParse({ page: '0' }).success, 'Reject zero page: 0');
assert(!ProductFilterQuerySchema.safeParse({ limit: '150' }).success, 'Reject limit > 100: 150');
assert(!ProductFilterQuerySchema.safeParse({ limit: '-1' }).success, 'Reject negative limit: -1');


console.log('\n========================================================');
console.log('CHALLENGE SUITE 2: KaspiCreateInvoiceInputSchema URL Security');
console.log('========================================================');

const baseInvoice = {
  orderId: '00000000-0000-0000-0000-000000000001',
  amountKzt: 14990,
  phone: '+7 701 123 45 67',
  paymentMode: 'KaspiGold',
  description: 'Заказ №1234 India Trikotaj',
  returnUrl: 'https://india-trikotaj.kz/checkout/success',
};

// Test 1: Valid URLs
const validUrls = [
  'https://india-trikotaj.kz/orders/complete?id=123',
  'http://localhost:3000/orders/complete',
  'http://127.0.0.1:8080/callback',
  'https://sub.domain.market.kz:8443/checkout/success?ref=kaspi#step2',
  'HTTPS://INDIA-TRIKOTAJ.KZ/ORDERS', // Case insensitive protocol
  'HTTP://EXAMPLE.COM',
];
for (const url of validUrls) {
  const res = KaspiCreateInvoiceInputSchema.safeParse({ ...baseInvoice, returnUrl: url });
  assert(res.success, `Accept valid URL: ${url}`);
}

// Test 2: Malicious / Unsafe protocols (javascript:, data:, vbscript:, etc.)
const maliciousUrls = [
  'javascript:alert(1)',
  'javascript:alert("XSS")',
  'JAVASCRIPT:alert(1)',
  'JavaScript:window.location="http://evil.com"',
  'data:text/html,<script>alert(1)</script>',
  'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  'DATA:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII=',
  'vbscript:msgbox("hello")',
  'VBSCRIPT:msgbox(1)',
  'file:///C:/Windows/System32/drivers/etc/hosts',
  'file:///etc/passwd',
  'FILE://localhost/etc/passwd',
  'ftp://evil.com/payload.exe',
  'ftps://evil.com/payload',
  'gopher://evil.com',
  'ws://evil.com/socket',
  'wss://evil.com/socket',
  'blob:https://india-trikotaj.kz/1234-5678',
  'mailto:attacker@evil.com',
  'tel:+77011234567',
  '//evil.com/phishing',
  '/local/relative/path',
  'https:evil.com', // missing slashes
  'http:evil.com',
  'javascript://https://india-trikotaj.kz',
  'java\0script:alert(1)',
  'java\nscript:alert(1)',
  'java\tscript:alert(1)',
  'about:blank',
  '',
];

for (const url of maliciousUrls) {
  const res = KaspiCreateInvoiceInputSchema.safeParse({ ...baseInvoice, returnUrl: url });
  assert(!res.success, `Reject malicious/invalid URL: ${JSON.stringify(url)}`);
}


console.log('\n========================================================');
console.log('CHALLENGE SUITE 3: Kaspi Invoice Phone Flexibility & Invariants');
console.log('========================================================');

// Test 1: Only phone provided
const resPhoneOnly = KaspiCreateInvoiceInputSchema.safeParse({
  ...baseInvoice,
  phone: '+7 701 123 45 67',
  customerPhone: undefined,
});
assert(
  resPhoneOnly.success &&
    resPhoneOnly.data.phone === '+7 701 123 45 67' &&
    resPhoneOnly.data.customerPhone === '+7 701 123 45 67' &&
    resPhoneOnly.data.normalizedPhone === '+7 701 123 45 67',
  'Populates phone and customerPhone when only phone is provided'
);

// Test 2: Only customerPhone provided
const resCustPhoneOnly = KaspiCreateInvoiceInputSchema.safeParse({
  ...baseInvoice,
  phone: undefined,
  customerPhone: '8 (777) 987 65 43',
});
assert(
  resCustPhoneOnly.success &&
    resCustPhoneOnly.data.phone === '8 (777) 987 65 43' &&
    resCustPhoneOnly.data.customerPhone === '8 (777) 987 65 43' &&
    resCustPhoneOnly.data.normalizedPhone === '8 (777) 987 65 43',
  'Populates phone and customerPhone when only customerPhone is provided'
);

// Test 3: Both phone and customerPhone provided
const resBothPhones = KaspiCreateInvoiceInputSchema.safeParse({
  ...baseInvoice,
  phone: '+7 701 111 22 33',
  customerPhone: '+7 702 444 55 66',
});
assert(
  resBothPhones.success &&
    resBothPhones.data.phone === '+7 701 111 22 33' &&
    resBothPhones.data.customerPhone === '+7 702 444 55 66' &&
    resBothPhones.data.normalizedPhone === '+7 701 111 22 33',
  'Retains separate phone and customerPhone when both provided'
);

// Test 4: Neither phone provided (must fail)
const resNoPhone = KaspiCreateInvoiceInputSchema.safeParse({
  ...baseInvoice,
  phone: undefined,
  customerPhone: undefined,
});
assert(!resNoPhone.success, 'Rejects invoice when neither phone nor customerPhone is provided');

// Test 5: Description limit for push vs QR
const longDescription = 'A'.repeat(61);
const resLongPush = KaspiCreateInvoiceInputSchema.safeParse({
  ...baseInvoice,
  paymentMode: 'KaspiGold',
  description: longDescription,
});
assert(!resLongPush.success, 'Rejects >60 chars description for phone push invoice (KaspiGold)');

const resLongQr = KaspiCreateInvoiceInputSchema.safeParse({
  ...baseInvoice,
  paymentMode: 'QR',
  description: longDescription,
});
assert(resLongQr.success, 'Accepts >60 chars description for QR invoice');

const resExceededQr = KaspiCreateInvoiceInputSchema.safeParse({
  ...baseInvoice,
  paymentMode: 'QR',
  description: 'A'.repeat(101),
});
assert(!resExceededQr.success, 'Rejects >100 chars description for QR invoice');

// Test 6: Zero or negative amountKzt
assert(!KaspiCreateInvoiceInputSchema.safeParse({ ...baseInvoice, amountKzt: 0 }).success, 'Rejects 0 KZT invoice');
assert(!KaspiCreateInvoiceInputSchema.safeParse({ ...baseInvoice, amountKzt: -100 }).success, 'Rejects negative KZT invoice');
assert(!KaspiCreateInvoiceInputSchema.safeParse({ ...baseInvoice, amountKzt: 14990.5 }).success, 'Rejects non-integer KZT invoice');


console.log('\n========================================================');
console.log('CHALLENGE SUITE 4: Kaspi Webhook Contracts Alignment');
console.log('========================================================');

// Test 1: KaspiWebhookCallbackSchema satisfies line 52 & 60 of PROJECT.md
assert(typeof KaspiWebhookCallbackSchema !== 'undefined', 'KaspiWebhookCallbackSchema is exported');
assert(typeof KaspiDirectWebhookCallbackSchema !== 'undefined', 'KaspiDirectWebhookCallbackSchema is exported');

// Test 2: Standard webhook payload
const standardPayload = {
  event: 'invoice.status_changed',
  invoice: {
    id: 'inv_123',
    external_order_id: 'ord_456',
    amount: 14990,
    status: 'paid',
    phone_number: '+77011234567',
    kaspi_source_type: 'GOLD',
    created_at: '2026-11-02T20:00:00Z',
  },
  signature: 'sha256=abcdef1234567890',
  timestamp: '2026-11-02T20:00:00Z',
};
const parsedWebhook = KaspiWebhookCallbackSchema.safeParse(standardPayload);
assert(parsedWebhook.success, 'Validates standard Kaspi webhook payload');

// Test 3: Direct webhook callback schema (ApiPay direct)
const directPayload = {
  invoiceId: 'inv_123',
  orderId: 'ord_456',
  amount: 14990,
  status: 'SUCCESS',
  transactionId: 'txn_789',
  paymentMethod: 'KaspiGold',
  kaspiSourceType: 'GOLD',
};
const parsedDirect = KaspiDirectWebhookCallbackSchema.safeParse(directPayload);
assert(parsedDirect.success, 'Validates direct webhook callback payload');


console.log('\n========================================================');
console.log('CHALLENGE SUITE 5: Phone Validation & Normalization Stress');
console.log('========================================================');

// Valid Kazakhstan phone formats (Almaty retail focus)
const validPhones = [
  '+7 (701) 123-45-67',
  '+7 701 123 45 67',
  '+77011234567',
  '87011234567',
  '8 (705) 555-55-55',
  '+7 (727) 222-33-44', // Almaty landline
  '+7 (747) 000-00-00', // Tele2
  '+7 (777) 111-22-33', // Beeline
  '+7 (778) 999-88-77', // Kcell
  '7011234567',         // 10-digit national format
  '701-123-45-67',      // 10-digit formatted
];
for (const p of validPhones) {
  assert(validateKazakhstanPhone(p), `Valid Kazakhstan phone: ${p}`);
  const norm = normalizeKazakhstanPhone(p);
  assert(norm && norm.startsWith('+7') && norm.length === 12, `Normalized phone: ${p} -> ${norm}`);
}

// Hostile / Invalid phone formats
const hostilePhones = [
  '+7 (701) 123-45-67; DROP TABLE orders; --',
  '+7 (701) 123-45-67 <script>alert(1)</script>',
  '+7 (701) 123-45-67\x00\x01\x1b',
  '+7 (916) 123-45-67', // Russia MTS
  '+7 (900) 123-45-67', // Russia Tele2
  '+7 (999) 123-45-67', // Russia Yota
  '89161234567',        // Russia 8916...
  '+1 (555) 123-4567',  // USA
  '+44 20 7946 0958',   // UK
  '+86 10 6552 9988',   // China
  '+7 (701) 123-45-678', // 12 digits
  '+7 (701) 123-45-6',   // 9 digits
  '',
  '   ',
  'phone-number',
  'null',
  'undefined',
  'NaN',
];
for (const p of hostilePhones) {
  assert(!validateKazakhstanPhone(p), `Reject hostile/foreign phone: ${JSON.stringify(p)}`);
  assert(normalizeKazakhstanPhone(p) === null, `Reject normalization of hostile/foreign: ${JSON.stringify(p)}`);
}


console.log('\n========================================================');
console.log('CHALLENGE SUITE 6: Currency Formatter (formatKZT) Extremes');
console.log('========================================================');

// Test 1: Standard retail amounts (non-breaking space \u00A0)
assert(formatKZT(14990) === '14\u00A0990\u00A0₸', 'formatKZT(14990) -> 14\u00A0990\u00A0₸');
assert(formatKZT(0) === '0\u00A0₸', 'formatKZT(0) -> 0\u00A0₸');
assert(formatKZT(100) === '100\u00A0₸', 'formatKZT(100) -> 100\u00A0₸');
assert(formatKZT(1000000) === '1\u00A0000\u00A0000\u00A0₸', 'formatKZT(1000000) -> 1\u00A0000\u00A0000\u00A0₸');
assert(formatKZT(1500000000) === '1\u00A0500\u00A0000\u00A0000\u00A0₸', 'formatKZT(1.5B) -> 1\u00A0500\u00A0000\u00A0000\u00A0₸');

// Test 2: Rounding fractional amounts (tiyns)
assert(formatKZT(14990.49) === '14\u00A0990\u00A0₸', 'formatKZT(14990.49) rounds down -> 14\u00A0990\u00A0₸');
assert(formatKZT(14990.50) === '14\u00A0991\u00A0₸', 'formatKZT(14990.50) rounds up -> 14\u00A0991\u00A0₸');

// Test 3: Extremes & Non-finite numbers
assert(formatKZT(Infinity) === '0\u00A0₸', 'formatKZT(Infinity) -> 0\u00A0₸');
assert(formatKZT(-Infinity) === '0\u00A0₸', 'formatKZT(-Infinity) -> 0\u00A0₸');
assert(formatKZT(NaN) === '0\u00A0₸', 'formatKZT(NaN) -> 0\u00A0₸');
assert(formatKZT(null) === '0\u00A0₸', 'formatKZT(null) -> 0\u00A0₸');
assert(formatKZT(undefined) === '0\u00A0₸', 'formatKZT(undefined) -> 0\u00A0₸');
assert(formatKZT('14990') === '0\u00A0₸', 'formatKZT("14990") non-number -> 0\u00A0₸');
assert(formatKZT(-0) === '0\u00A0₸', 'formatKZT(-0) -> 0\u00A0₸');
assert(formatKZT(Number.MAX_SAFE_INTEGER).endsWith('\u00A0₸'), 'formatKZT(MAX_SAFE_INTEGER) ends with ₸');


console.log('\n========================================================');
console.log('CHALLENGE SUMMARY');
console.log('========================================================');
console.log(`Total Empirical Checks: ${totalTests}`);
console.log(`Passed Checks         : ${passedTests}`);
console.log(`Failed Checks         : ${failedTests}`);

if (failedTests > 0) {
  console.error('\n[VERDICT: REQUEST_CHANGES] Some empirical challenge tests failed!');
  process.exit(1);
} else {
  console.log('\n[VERDICT: APPROVE] 100% of empirical challenge tests passed!');
  process.exit(0);
}
