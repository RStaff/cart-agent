#!/usr/bin/env node

import "../dev/load_secrets.mjs";

import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
const backendDir = resolve(repoRoot, "web");
const indexPath = resolve(backendDir, "src/index.js");

function detectPort(source) {
  const envMatch = source.match(/process\.env\.PORT\s*\?\s*Number\(process\.env\.PORT\)\s*:\s*(\d+)/);
  if (envMatch) return Number(envMatch[1]);
  const fallbackMatch = source.match(/listening on :(\d+)/);
  if (fallbackMatch) return Number(fallbackMatch[1]);
  return 8081;
}

function listPidsOnPort(port) {
  try {
    const output = execFileSync("lsof", ["-ti", `:${port}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return output ? output.split(/\s+/).filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function killPids(pids, port) {
  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGKILL");
      console.log(`[dev-safe] killed existing process on port ${port}`);
    } catch {
      // ignore dead pids
    }
  }
}

function validateStripeEnv() {
  const secretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!secretKey) {
    console.error("[dev-safe] ERROR: STRIPE_SECRET_KEY missing");
    process.exit(1);
  }
  console.log("[dev-safe] Stripe key detected");
}

async function main() {
  const source = await readFile(indexPath, "utf8");
  const port = detectPort(source);

  console.log(`[dev-safe] checking port ${port}`);
  const pids = listPidsOnPort(port);
  if (pids.length > 0) {
    killPids(pids, port);
  }

  validateStripeEnv();
  console.log("[dev-safe] starting backend...");

  const child = spawn("node", ["src/index.js"], {
    cwd: backendDir,
    env: { ...process.env },
    stdio: ["inherit", "pipe", "pipe"],
  });

  let announcedRunning = false;

  child.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);
    if (!announcedRunning && text.includes(`[server] listening on :${port}`)) {
      announcedRunning = true;
      console.log(`[dev-safe] backend running on port ${port}`);
    }
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk.toString());
  });

  child.on("error", (error) => {
    console.error("[dev-safe] backend failed to start");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (code === 0 || signal === "SIGINT" || signal === "SIGTERM") {
      process.exit(code ?? 0);
      return;
    }
    console.error("[dev-safe] backend failed to start");
    console.error(`exit_code=${code ?? "null"} signal=${signal ?? "null"}`);
    process.exit(code ?? 1);
  });

  for (const terminationSignal of ["SIGINT", "SIGTERM"]) {
    process.on(terminationSignal, () => {
      if (!child.killed) {
        child.kill(terminationSignal);
      }
    });
  }
}

main().catch((error) => {
  console.error("[dev-safe] backend failed to start");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
