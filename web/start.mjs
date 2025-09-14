import app from "./src/index.js";
import http from "http";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 10000;
const APP_ENTRY = process.env.APP_ENTRY || "./src/index.js";

let handler = (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK");
};

// start listening immediately so Render sees the port
const server = http.createServer((req, res) => handler(req, res));
server.listen(PORT, "0.0.0.0", () =>
  console.log(`[start] listening on http://0.0.0.0:${PORT}`)
);

// try to attach the real app
(async () => {
  const fullPath = path.join(__dirname, APP_ENTRY);
  if (!fs.existsSync(fullPath)) {
    console.error(`[start] APP_ENTRY ${APP_ENTRY} not found`);
    return;
  }
  try {
    const mod = await import(pathToFileURL(fullPath).href);
    const app =
      mod.default ||
      mod.app ||
      (typeof mod === "function" ? mod : null);

    if (app && typeof app.handle === "function") {
      handler = (req, res) => app.handle(req, res);
      console.log(`[start] attached app from ${APP_ENTRY}`);
    } else {
      console.error("[start] app found but not attachable, serving fallback");
    }
  } catch (err) {
    console.error("[start] failed to import app:", err);
  }
})();

app.set?.('trust proxy', 1);
app.listen(PORT, () => {
  console.log("[start] listening on http://0.0.0.0:" + PORT);
});
