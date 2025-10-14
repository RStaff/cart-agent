installStatusSeo(app);
const { installStatusSeo } = require("./_status_seo");
const { installHardening } = require("./_hardening");
import http from 'node:http';
import app from './src/index.js';

const PORT = process.env.PORT || 10000;

function alreadyListening() {
  return globalThis.__server && globalThis.__server.listening === true;
}

if (alreadyListening()) {
  console.log('[start] reusing existing server');
} else {
  const server = http.createServer(app);
  globalThis.__server = server;

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      // Another listener already bound (e.g., double start); don't crash.
      console.error('[start] port in use; assuming another listener is active; skipping second listen');
      return;
    }
    throw err;
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[start] listening on http://0.0.0.0:${PORT}`);
  });
}

console.log('[start] attached app from ./src/index.js');
