import http from 'http';
import { pathToFileURL } from 'url';

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => res.end('OK'));
server.listen(PORT, HOST, () => {
  console.log(`[start] listening on http://${HOST}:${PORT}`);
  attachApp();
});

async function attachApp() {
  const candidates = ['./index.js', './src/index.js', './server.js', './src/server.js'];
  for (const c of candidates) {
    try {
      const url = new URL(c, import.meta.url);
      const mod = await import(url.href);
      const app = resolveApp(mod);
      if (app) {
        const handler = app.handle ? app.handle.bind(app) : app;
        server.removeAllListeners('request');
        server.on('request', handler);
        console.log(`[start] attached app from ${c}`);
        return;
      }
    } catch {}
  }
  console.log('[start] no app found; serving fallback OK handler');
}

function resolveApp(m) {
  if (!m) return null;
  const cand = m.default ?? m;
  if (typeof cand === 'function') return cand;
  if (cand && typeof cand.handle === 'function') return cand;
  return null;
}
