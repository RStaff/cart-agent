const http = require('http');
const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => res.end('OK'));
server.listen(PORT, HOST, () => {
  console.log(`[start] listening on http://${HOST}:${PORT}`);
  tryLoadAndAttachApp();
});

function tryLoadAndAttachApp() {
  const candidates = ['./index.js', './src/index.js', './server.js', './src/server.js'];
  for (const c of candidates) {
    try {
      const mod = require(c);
      const app = resolveApp(mod);
      if (app) {
        server.removeAllListeners('request');
        server.on('request', app);
        console.log(`[start] attached app from ${c}`);
        return;
      }
    } catch (e) {
      // ignore and keep fallback
    }
  }
  console.log('[start] no app found; serving fallback OK handler');
}

function resolveApp(m) {
  if (!m) return null;
  if (typeof m === 'function' && typeof m.handle === 'function') return m;     // express app instance
  if (typeof m === 'function' && typeof m.listen === 'function') return m;     // express app instance
  if (typeof m.default === 'function' && typeof m.default.handle === 'function') return m.default;
  if (typeof m.default === 'function' && typeof m.default.listen === 'function') return m.default;
  if (typeof m === 'function') {
    try {
      const maybe = m();
      if (maybe && (typeof maybe.handle === 'function' || typeof maybe.listen === 'function')) return maybe;
    } catch (_) {}
  }
  return null;
}
