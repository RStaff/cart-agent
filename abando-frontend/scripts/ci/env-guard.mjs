import fs from 'node:fs';

const REQUIRED = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  // add more here as you go (e.g., OPENAI_API_KEY, POSTHOG_KEY, etc.)
];

const SOFT_RULES = [
  // Example Stripe: test keys should start with sk_test / whsec_test
  { name: 'STRIPE_SECRET_KEY', allow: v => /^sk_test_/.test(v || ''), why: 'must be a test key (sk_test_)' },
  { name: 'STRIPE_WEBHOOK_SECRET', allow: v => /^whsec_/.test(v || ''), why: 'must be a test webhook secret (whsec_)' },
];

function readDotEnv(p) {
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    let v = m[2].replace(/^"(.*)"$/, '$1');
    out[m[1]] = v;
  }
  return out;
}

// Resolve values from process.env first, then .env.local
const localEnv = readDotEnv('.env.local');
const get = (k) => process.env[k] ?? localEnv[k];

let ok = true;
for (const k of REQUIRED) {
  const v = get(k);
  if (!v) { console.error(`ENV GUARD: Missing ${k}`); ok = false; }
}
for (const rule of SOFT_RULES) {
  const v = get(rule.name);
  if (v && !rule.allow(v)) {
    console.error(`ENV GUARD: ${rule.name} invalid — ${rule.why}`);
    ok = false;
  }
}
if (!ok) {
  console.error('ENV GUARD: Refusing to continue. Fix your .env.local or CI secrets.');
  process.exit(1);
} else {
  console.log('ENV GUARD: OK');
}
