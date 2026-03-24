#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "merchantRegistry.json");
const STATS_PATH = join(__dirname, "scanStats.json");
const WORKER_PATH = join(__dirname, "scanWorker.js");
const WORKER_COUNT = 5;
const TEN_MINUTES_MS = 10 * 60 * 1000;

async function readJsonFile(path, fallbackValue) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch (_error) {
    return fallbackValue;
  }
}

async function writeJsonFile(path, value) {
  await writeFile(path, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function needsScan(merchant, nowMs) {
  const lastScanMs = Date.parse(String(merchant?.lastScan || ""));
  if (!Number.isFinite(lastScanMs)) {
    return true;
  }
  return nowMs - lastScanMs >= TEN_MINUTES_MS;
}

function runWorker(workerId, merchant) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WORKER_PATH, String(workerId), JSON.stringify(merchant)], {
      cwd: dirname(dirname(__dirname)),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Worker ${workerId} failed with code ${code}`));
        return;
      }
      resolve(JSON.parse(stdout || "{}"));
    });
  });
}

async function processQueue(queue) {
  const results = [];
  let nextIndex = 0;

  async function runner(workerId) {
    while (nextIndex < queue.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const merchant = queue[currentIndex];
      console.log(`Worker ${workerId} scanning ${merchant.shop}`);
      const result = await runWorker(workerId, merchant);
      results.push(result);
    }
  }

  await Promise.all(
    Array.from({ length: WORKER_COUNT }, (_, index) => runner(index + 1)),
  );

  return results;
}

function mergeResults(registry, results) {
  const resultMap = new Map(results.map((result) => [String(result?.store || ""), result]));

  return registry.map((merchant) => {
    const key = String(merchant?.shop || "");
    const result = resultMap.get(key);
    if (!result) {
      return merchant;
    }

    return {
      ...merchant,
      lastScan: result.scannedAt,
      latestResult: {
        issue: result.issue,
        revenueLeakEstimate: result.revenueLeakEstimate,
        confidence: result.confidence,
        scannedAt: result.scannedAt,
      },
    };
  });
}

function buildStats(existingStats, registry, results) {
  const totalDuration = results.reduce((sum, result) => sum + Number(result?.durationSec || 0), 0);
  return {
    scansToday: Number(existingStats?.scansToday || 0) + results.length,
    merchantsMonitored: registry.length,
    avgScanTimeSec: results.length > 0 ? Number((totalDuration / results.length).toFixed(1)) : 0,
  };
}

async function runOnce() {
  const registry = await readJsonFile(REGISTRY_PATH, []);
  const stats = await readJsonFile(STATS_PATH, {
    scansToday: 0,
    merchantsMonitored: 0,
    avgScanTimeSec: 0,
  });
  const nowMs = Date.now();
  const queue = (Array.isArray(registry) ? registry : []).filter((merchant) => needsScan(merchant, nowMs));
  const results = await processQueue(queue);
  const nextRegistry = mergeResults(Array.isArray(registry) ? registry : [], results);
  const nextStats = buildStats(stats, nextRegistry, results);

  await writeJsonFile(REGISTRY_PATH, nextRegistry);
  await writeJsonFile(STATS_PATH, nextStats);

  console.log("");
  console.log("Scan complete");
}

async function main() {
  console.log("Starting scan scheduler...");
  await runOnce();
}

main().catch((error) => {
  console.error("Scan scheduler failed:", error);
  process.exit(1);
});
