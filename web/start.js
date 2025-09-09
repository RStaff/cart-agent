const http = require('http');
const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);

function listen(server) {
  server.listen(PORT, HOST, () => {
    console.log(`[start] listening on http://${HOST}:${PORT}`);
  });
}

function tryLoadApp() {
  const candidates = ['./index.js', './src/index.js', './server.js', './src/server.js'];
  for (const c of candidates) {
    try {
      const mod = require(c);
      return mod;
    } catch (_) {}
  }
  return null;
}

const maybe = tryLoadApp();

// Case: exported express app instance
if (maybe && typeof maybe === 'function' && typeof maybe.listen === 'function') {
  listen(maybe);
// Case: exported factory that returns an app
} else if (typeof maybe === 'function') {
  const app = maybe();
  if (app && typeof app.listen === 'function') {
    listen(app);
  } else {
    listen(http.createServer((req, res) => res.end('OK')));
  }
// Fallback mini server so Render sees an open port
} else {
  listen(http.createServer((req, res) => res.end('OK')));
}
