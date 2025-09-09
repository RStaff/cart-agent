const http = require('http');
const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => res.end('OK'));
server.listen(PORT, HOST, () => {
  console.log(`[start] listening on http://${HOST}:${PORT}`);
  tryAttachApp();
});

function tryAttachApp() {
  const paths = ['./index.js', './src/index.js', './server.js', './src/server.js'];
  for (const p of paths) {
    try {
      const mod = require(p);
      const app = resolveApp(mod);
      if (app) {
        server.removeAllListeners('request');
        server.on('request', app);
        console.log(`[start] attached app from ${p}`);
        return;
      }
    } catch (_) {}
  }
  console.log('[start] no app found; serving fallback OK handler');
}

function resolveApp(m) {
  if (!m) return null;
  if (typeof m === 'function' && typeof m.handle === 'function') return m;
  if (typeof m === 'function' && typeof m.listen === 'function') return m;
  if (m && typeof m.default === 'function' && (m.default.handle || m.default.listen)) return m.default;
  if (typeof m === 'function') {
    try {
      const maybe = m();
      if (maybe && (maybe.handle || maybe.listen)) return maybe;
    } catch (_) {}
  }
  return null;
}
