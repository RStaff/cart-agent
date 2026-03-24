#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const MEMORY_PATH = ".tmp/fix_memory.json";

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--caseType") {
      args.caseType = String(argv[index + 1] || "").trim();
      index += 1;
    } else if (argv[index] === "--success") {
      args.success = String(argv[index + 1] || "").trim();
      index += 1;
    }
  }
  return args;
}

async function loadMemory() {
  const raw = await readFile(MEMORY_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected an array in .tmp/fix_memory.json");
  }
  return parsed;
}

function nextSuccessRate(current, success) {
  const base = Number.isFinite(Number(current)) ? Number(current) : 0.5;
  if (success) return Math.min(1, Number((base + 0.1).toFixed(2)));
  return Math.max(0, Number((base - 0.1).toFixed(2)));
}

export async function saveFixOutcome(caseType, successFlag) {
  if (!caseType) {
    throw new Error("Missing required --caseType");
  }
  if (!["true", "false"].includes(successFlag)) {
    throw new Error("Missing required --success true|false");
  }

  const memory = await loadMemory();
  const entry = memory.find((item) => item.caseType === caseType);
  if (!entry) {
    throw new Error(`case_type_not_found:${caseType}`);
  }

  const success = successFlag === "true";
  entry.successRate = nextSuccessRate(entry.successRate, success);
  entry.lastUsed = new Date().toISOString();

  await writeFile(MEMORY_PATH, `${JSON.stringify(memory, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        caseType: entry.caseType,
        successRate: entry.successRate,
        lastUsed: entry.lastUsed,
      },
      null,
      2,
    ),
  );
  return entry;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv);
  saveFixOutcome(args.caseType, args.success).catch((error) => {
    console.error("[fix-outcome] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
