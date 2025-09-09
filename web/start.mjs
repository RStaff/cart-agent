import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { spawn } from "child_process";

const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let attached = false;

const server = http.createServer((req, res) => res.end("OK"));
server.listen(PORT, HOST, () => console.log(`[start] listening on http://${HOST}:${PORT}`));

(async () => {
  await ensureDeps();
  await attachLoop();
})().catch(err => {
  console.log("[start] fatal:", err?.message || err);
});

async function ensureDeps() {
  const hasNodeModules = fs.existsSync(path.resolve(__dirname, "node_modules"));
  if (hasNodeModules) {
    try {
      require.resolve("express", { paths: [__dirname] });
      require.resolve("cors", { paths: [__dirname] });
      return;
    } catch {}
  }

  console.log("[start] installing deps… (trying npm ci)");
  try {
    await run("npm", ["ci", "--include=dev", "--no-audit", "--no-fund"]);
    console.log("[start] deps installed via ci");
    return;
  } catch (e) {
    console.log("[start] npm ci failed; falling back to npm install");
  }

  await run("npm", ["install", "--omit=dev", "--no-audit", "--no-fund"]);
  console.log("[start] deps installed via install");
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", cwd: __dirname, env: process.env });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} -> ${code}`))));
  });
}

async function attachLoop() {
  const candidates = [process.env.APP_ENTRY || "./src/index.js"];
  for (let attempt = 1; attempt <= 60 && !attached; attempt++) {
    for (const rel of candidates) {
      const abs = path.resolve(__dirname, rel);
      if (!fs.existsSync(abs)) continue;
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
    if (!attached) await new Promise(r => setTimeout(r, 3000));
  }
  if (!attached) console.log("[start] giving up after retries; still serving fallback");
}

function pickApp(mod) {
  const c = mod?.default ?? mod?.app ?? mod?.router ?? mod;
  if (!c) return null;
  if (typeof c === "function") return c;
  if (typeof c?.handle === "function") return c;
  if (typeof c?.use === "function") return c;
  return null;
}
