#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const MEMORY_PATH = ".tmp/fix_memory.json";

function parseCaseType(argv) {
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--caseType") {
      return String(argv[index + 1] || "").trim();
    }
  }
  return "";
}

async function loadMemory() {
  const raw = await readFile(MEMORY_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected an array in .tmp/fix_memory.json");
  }
  return parsed;
}

export async function applyFixTemplate(caseType) {
  if (!caseType) {
    throw new Error("Missing required --caseType");
  }

  const memory = await loadMemory();
  const entry = memory.find((item) => item.caseType === caseType);
  if (!entry) {
    throw new Error(`case_type_not_found:${caseType}`);
  }

  const steps = Array.isArray(entry.fixSteps) ? entry.fixSteps : [];
  const plan = steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  console.log(plan);
  return steps;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  applyFixTemplate(parseCaseType(process.argv)).catch((error) => {
    console.error("[fix-template] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
