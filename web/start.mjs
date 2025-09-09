import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => res.end('OK'));
server.listen(PORT, HOST, () => {
  console.log(`[start] listening on http://${HOST}:${PORT}`);
  attachApp();
});

async function attachApp() {
  const preferred = process.env.APP_ENTRY ? [process.env.APP_ENTRY] : [];
  const candidates = preferred.concat([
    './src/index.js', './index.js',
    './src/server.js', './server.js',
    './src/app.js'
  ]);

  for (const rel of candidates) {
    const abs = path.resolve(__dirname, rel);
    const exists = fs.existsSync(abs);
    console.log(`[start] probe: ${rel}  exists=${exists}`);
    if (!exists) continue;

    try {
      const mod = await import(pathToFileURL(abs).href);
      const app = pickApp(mod);
      if (app) {
        const handler = app.handle?.bind(app) ?? app;
        server.removeAllListeners('request');
        server.on('request', handler);
        console.log(`[start] attached app from ${rel}`);
        return;
      } else {
        console.log(`[start] loaded ${rel} but found no attachable app (keys=${Object.keys(mod)})`);
      }
    } catch (e) {
      console.log(`[start] import failed for ${rel}: ${e?.message || e}`);
    }
  }

  console.log('[start] no app found; serving fallback OK handler');
}

function pickApp(mod) {
  const c = mod?.default ?? mod?.app ?? mod?.router ?? mod;
  if (!c) return null;
  if (typeof c === 'function') return c;             // express app/handler function
  if (typeof c?.handle === 'function') return c;     // express app/router
  if (typeof c?.use === 'function') return c;        // express app-like
  return null;
}
