import http from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);

// Bind immediately so Render detects the port
const server = http.createServer((req, res) => res.end('OK'));
server.listen(PORT, HOST, () => console.log(`[start] listening on http://${HOST}:${PORT}`));

const candidates = ['./src/index.js', './index.js'];

function pick(mod) {
  const c = mod?.default ?? mod?.app ?? mod?.router ?? mod;
  if (!c) return null;
  if (typeof c === 'function') return c;
  if (typeof c?.handle === 'function') return c;
  if (typeof c?.use === 'function') return c;
  return null;
}

for (let attempt = 1; attempt <= 30; attempt++) {
  for (const rel of candidates) {
    try {
      const mod = await import(rel);
      const app = pick(mod);
      if (app) {
        const handler = app.handle?.bind(app) ?? app;
        server.removeAllListeners('request');
        server.on('request', handler);
        console.log(`[start] attached app from ${rel}`);
        process.env.BOOTSTRAPPED = '1';
        return;
      } else {
        console.log(`[start] ${rel} loaded, no attachable app`);
      }
    } catch (e) {
      console.log(`[start] import failed for ${rel} (attempt ${attempt}): ${e?.message || e}`);
    }
  }
  await delay(2000);
}
console.log('[start] fallback only; no app attached');
