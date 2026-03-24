#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const MEMORY_PATH = ".tmp/fix_memory.json";

function parseText(argv) {
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--text") {
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

function scoreCase(entry, text) {
  const lowered = text.toLowerCase();
  const symptoms = Array.isArray(entry?.symptoms) ? entry.symptoms : [];
  let matches = 0;
  for (const symptom of symptoms) {
    if (lowered.includes(String(symptom || "").toLowerCase())) {
      matches += 1;
    }
  }
  return { matches, total: symptoms.length || 1 };
}

export async function diagnoseIssue(inputText) {
  const text = String(inputText || "").trim();
  if (!text) {
    throw new Error("Missing required --text");
  }

  const memory = await loadMemory();
  const ranked = memory
    .map((entry) => {
      const { matches, total } = scoreCase(entry, text);
      const confidence = matches > 0 ? Math.min(0.99, matches / total + 0.2) : 0;
      return {
        entry,
        matches,
        confidence: Number(confidence.toFixed(2)),
      };
    })
    .sort((left, right) => {
      return right.matches - left.matches || right.confidence - left.confidence;
    });

  const best = ranked[0];
  const result = {
    caseType: best?.entry?.caseType || "unknown",
    confidence: best?.confidence || 0,
    suggestedFix: Array.isArray(best?.entry?.fixSteps) ? best.entry.fixSteps : [],
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  diagnoseIssue(parseText(process.argv)).catch((error) => {
    console.error("[diagnose] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
