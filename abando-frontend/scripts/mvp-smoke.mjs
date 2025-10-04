import http from 'node:http';

const targets = [
  { path: '/', ok: (s)=> s.includes('<') },                         // home renders
  { path: '/api/status', ok: (s)=> /ok|ready|status/i.test(s) },    // status API
  { path: '/api/stripe/status', ok: (s)=> /test|live|stripe/i.test(s) } // stripe probe
];

function get(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      const chunks = [];
      res.on('data', c=>chunks.push(c));
      res.on('end', ()=> resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', ()=> resolve(null));
    req.setTimeout(2500, ()=> { req.destroy(); resolve(null); });
  });
}

async function main() {
  // Quick health probe to see if a dev server is running
  const base = process.env.MVP_SMOKE_BASE ?? 'http://localhost:3000';
  const ping = await get(base + '/');
  if (!ping || ping.status < 200 || ping.status > 399) {
    console.log(`↪︎ No dev server at ${base} (skipping smoke). Start one with:  npm run dev`);
    process.exit(0);
  }

  let failures = 0;
  for (const t of targets) {
    const r = await get(base + t.path);
    if (!r) { console.log(`✗ ${t.path} — no response`); failures++; continue; }
    const ok = r.status >= 200 && r.status < 400 && t.ok(r.body || '');
    console.log(`${ok ? '✓' : '✗'} ${t.path} (${r.status})`);
    if (!ok) failures++;
  }
  if (failures) {
    console.log(`✗ Smoke failures: ${failures}`);
    process.exit(1);
  }
  console.log('✓ Smoke OK');
}
main().catch((e)=> { console.error(e); process.exit(1); });
