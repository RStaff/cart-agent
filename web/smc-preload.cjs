/**
 * smc-preload.cjs
 * Safe preload hook for local/dev + Render.
 * - Loads .env if present (repo root, then web/)
 * - Never throws if dotenv is missing
 */
function tryDotenv(path) {
  try {
    const dotenv = require("dotenv");
    const res = dotenv.config({ path });
    if (!res.error) console.log(`[preload] loaded env from ${path}`);
  } catch (_) {
    // ignore
  }
}

tryDotenv(".env");
tryDotenv("web/.env");
