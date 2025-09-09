import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let attached = false;

const server = http.createServer((req, res) => res.end("OK"));
server.listen(PORT, HOST, () => {
  console.log(`[start] listening on http://${HOST}:${PORT}`);
  attachLoop();
});

async function attachLoop() {
  const candidates = [process.env.APP_ENTRY || "./src/index.js"];
  for (let attempt = 1; attempt <= 60 && !attached; attempt++) {
    for (const rel of candidates) {
      const abs = path.resolve(__dirname, rel);
      const exists = fs.existsSync(abs);
      if (!exists) continue;
      try {
        const mod = await import(pathToFileURL(abs).href + `?t=${Date.now()}`);
        const app = pickApp(mod);
        if (!app) continue;
        const handler = app.handle?.bind(app) ?? app;
        server.removeAllListeners("request");
        server.on("request", handler);
        attached = true;
        console.log(`[start] attached app from ${rel} (attempt ${attempt})`);
        return;
      } catch (e) {
        console.log(`[start] import failed for ${rel} (attempt ${attempt}): ${e?.message || e}`);
      }
    }
    if (!attached) await new Promise(r => setTimeout(r, 2000));
  }
  if (!attached) console.log("[start] fallback only; no app attached");
}

function pickApp(mod) {
  const c = mod?.default ?? mod?.app ?? mod?.router ?? mod;
  if (!c) return null;
  if (typeof c === "function") return c;
  if (typeof c?.handle === "function") return c;
  if (typeof c?.use === "function") return c;
  return null;
}
