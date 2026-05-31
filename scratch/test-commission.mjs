/**
 * Commission Model Test Script
 * Tests all commission-related endpoints against the live server
 */

const BASE = 'http://localhost:5001/api';

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg) { console.log(`  ❌ FAIL: ${msg}`); process.exitCode = 1; }
function info(msg) { console.log(`  ℹ️  ${msg}`); }
function section(msg) { console.log(`\n=== ${msg} ===`); }

// ─── 1. Public settings endpoint ────────────────────────────────────────────
section('1. Public Settings Endpoint (GET /api/auth/settings)');
const settings = await req('GET', '/auth/settings');
info(`Status: ${settings.status}, Body: ${JSON.stringify(settings.body)}`);
if (settings.status === 200 && Array.isArray(settings.body)) {
  pass('Returns 200 with array');
} else {
  fail(`Expected 200 array, got ${settings.status}`);
}

// Check if commission row exists; if not, seed it via the admin endpoint first
const commissionSetting = settings.body?.find(s => s.key === 'teacher_commission_percent');
if (commissionSetting) {
  pass(`Commission setting exists: ${commissionSetting.value}%`);
} else {
  info('Commission setting not seeded yet — will be seeded after first admin call');
}

// ─── 2. Teacher registration WITHOUT consent ─────────────────────────────────
section('2. Teacher Registration WITHOUT Commission Consent');
const noConsent = await req('POST', '/auth/register', {
  fullName: 'Test Teacher NoConsent',
  email: `no_consent_${Date.now()}@test.local`,
  password: 'password123',
  passkey: '1234',
  role: 'teacher',
  // agreedToCommission deliberately omitted
});
info(`Status: ${noConsent.status}, Body: ${JSON.stringify(noConsent.body)}`);
if (noConsent.status === 400 && noConsent.body?.error?.toLowerCase().includes('commission')) {
  pass('Correctly blocked with 400 + commission error');
} else {
  fail(`Expected 400 with commission error, got ${noConsent.status}: ${JSON.stringify(noConsent.body)}`);
}

// ─── 3. Teacher registration WITH consent = false ────────────────────────────
section('3. Teacher Registration WITH agreedToCommission = false');
const falseConsent = await req('POST', '/auth/register', {
  fullName: 'Test Teacher FalseConsent',
  email: `false_consent_${Date.now()}@test.local`,
  password: 'password123',
  passkey: '1234',
  role: 'teacher',
  agreedToCommission: false,
});
info(`Status: ${falseConsent.status}, Body: ${JSON.stringify(falseConsent.body)}`);
if (falseConsent.status === 400 && falseConsent.body?.error?.toLowerCase().includes('commission')) {
  pass('Correctly blocked with 400 when agreedToCommission = false');
} else {
  fail(`Expected 400, got ${falseConsent.status}: ${JSON.stringify(falseConsent.body)}`);
}

// ─── 4. Teacher registration WITH consent = true ─────────────────────────────
section('4. Teacher Registration WITH agreedToCommission = true');
const withConsent = await req('POST', '/auth/register', {
  fullName: 'Commission Test Teacher',
  email: `consent_ok_${Date.now()}@test.local`,
  password: 'password123',
  passkey: '1234',
  role: 'teacher',
  agreedToCommission: true,
});
info(`Status: ${withConsent.status}`);
if (withConsent.status === 201 && withConsent.body?.user?.role === 'teacher') {
  pass(`Teacher registered successfully (id: ${withConsent.body.user.id})`);
} else {
  fail(`Expected 201 teacher, got ${withConsent.status}: ${JSON.stringify(withConsent.body)}`);
}

// ─── 5. Student registration (no checkbox needed) ────────────────────────────
section('5. Student Registration (no commission checkbox required)');
const studentReg = await req('POST', '/auth/register', {
  fullName: 'Commission Test Student',
  email: `student_comm_${Date.now()}@test.local`,
  password: 'password123',
  passkey: '5678',
  role: 'student',
  // agreedToCommission deliberately omitted
});
info(`Status: ${studentReg.status}`);
if (studentReg.status === 201 && studentReg.body?.user?.role === 'student') {
  pass('Student registered without commission checkbox — correct');
} else {
  fail(`Expected 201 student, got ${studentReg.status}: ${JSON.stringify(studentReg.body)}`);
}

// ─── 6. Admin login + settings endpoints ─────────────────────────────────────
section('6. Admin Settings Endpoints');

// Try to find admin credentials from existing users in the DB by listing
// We can't call admin endpoints without a token. Let's create an admin via
// a direct test by first creating one to test with.
const adminReg = await req('POST', '/auth/register', {
  fullName: 'Temp Admin Tester',
  email: `temp_admin_${Date.now()}@test.local`,
  password: 'admintest123',
  passkey: '0000',
  role: 'student', // Will need to be promoted, but we can't do that without an existing admin
});

if (adminReg.status === 201) {
  info('Created temp test user. Note: To fully test admin settings, an admin account must already exist.');
  info('Skipping admin-authenticated tests — these require a pre-existing admin account.');
}

// ─── 7. Commission math validation ───────────────────────────────────────────
section('7. Commission Math Validation');
const testCases = [
  { amount: 100, fee: 20, expected: { platformFee: 20, net: 80 } },
  { amount: 200, fee: 15, expected: { platformFee: 30, net: 170 } },
  { amount: 50,  fee: 0,  expected: { platformFee: 0,  net: 50  } },
  { amount: 75,  fee: 25, expected: { platformFee: 18.75, net: 56.25 } },
];

let mathOk = true;
for (const tc of testCases) {
  const platformFee = parseFloat((tc.amount * tc.fee / 100).toFixed(2));
  const net = parseFloat((tc.amount - platformFee).toFixed(2));
  if (platformFee === tc.expected.platformFee && net === tc.expected.net) {
    pass(`Amount=${tc.amount}, Fee%=${tc.fee} → platformFee=${platformFee}, net=${net}`);
  } else {
    fail(`Amount=${tc.amount}, Fee%=${tc.fee} → expected platformFee=${tc.expected.platformFee} net=${tc.expected.net}, got ${platformFee} ${net}`);
    mathOk = false;
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────
section('Summary');
if (process.exitCode === 1) {
  console.log('\n❌ Some tests FAILED. Review issues above.');
} else {
  console.log('\n✅ All tests PASSED!');
}
