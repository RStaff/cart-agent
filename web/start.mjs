import http from 'http';

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => res.end('OK'));
server.listen(PORT, HOST, () => {
  console.log(`[start] listening on http://${HOST}:${PORT}`);
  attachApp();
});

async function attachApp() {
  const candidates = [
    './src/index.js', './src/index.mjs',
    './index.js', './index.mjs',
    './src/server.js', './src/server.mjs',
    './src/app.js', './src/app.mjs'
  ];

  for (const p of candidates) {
    try {
      const mod = await import(new URL(p, import.meta.url));
      const app = pickApp(mod);
      if (app) {
        const handler = app.handle?.bind(app) ?? app;
        server.removeAllListeners('request');
        server.on('request', handler);
        console.log(`[start] attached app from ${p}`);
        return;
      } else {
        console.log(`[start] ${p} loaded; keys=${Object.keys(mod)} (no attachable app)`);
      }
    } catch (e) {
      // Uncomment to debug: console.log('[start] import failed', p, e?.message);
    }
  }
  console.log('[start] no app found; serving fallback OK handler');
}

function pickApp(mod) {
  const c = mod?.default ?? mod?.app ?? mod?.router ?? mod;
  if (!c) return null;
  // Express app or router are function-like; app has .use/.handle, router has .handle
  if (typeof c === 'function') return c;
  if (typeof c?.handle === 'function') return c;
  if (typeof c?.use === 'function' && typeof c?.listen !== 'function') return c;
  return null;
}
