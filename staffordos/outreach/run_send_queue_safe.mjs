#!/usr/bin/env node

import fs from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;

    const key = trimmed.slice(0, idx).trim();
    if (!key || process.env[key]) continue;

    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

for (const envPath of [
  resolve(REPO_ROOT, ".env"),
  resolve(REPO_ROOT, "web", ".env"),
  resolve(REPO_ROOT, "staffordos", "dev", ".env.abando.local"),
]) {
  loadEnvFile(envPath);
}

const { getEmailReadiness } = await import("../../web/src/lib/emailSender.js");

const readiness = getEmailReadiness();

if (!readiness.ready) {
  console.log("\nSEND BLOCKED — EMAIL NOT CONFIGURED\n");
  console.log(JSON.stringify(readiness, null, 2));
  process.exit(1);
}

console.log("\nEMAIL READY — SAFE TO SEND\n");
console.log(JSON.stringify(readiness, null, 2));

await import("./run_send_queue.mjs");
