#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const DEFAULT_OUTPUT = ".tmp/runtime_proof_case.json";

function parseArgs(argv) {
  let output = DEFAULT_OUTPUT;
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--output") {
      output = String(argv[index + 1] || "").trim() || DEFAULT_OUTPUT;
    }
  }
  return { output };
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(repoRoot, path), "utf8"));
}

function summarize(before, diagnosis, after) {
  const beforeWrongUrl = before?.shopify?.appUrl !== before?.app?.publicUrl;
  const afterHealthy = after?.app?.health === "ok" && after?.shopify?.embeddedLoad === "ok" && after?.shopify?.iframeBlocked === false;
  const afterAligned = after?.shopify?.appUrl === after?.app?.publicUrl;

  if (afterHealthy && afterAligned) {
    return {
      status: "fixed",
      summary: "The dev runtime is now aligned on the stable named tunnel and the embedded dashboard path is healthy.",
      whatWasBroken: beforeWrongUrl
        ? `Shopify app config pointed at ${before.shopify.appUrl} while the live dev runtime used ${before.app.publicUrl}.`
        : diagnosis.rootCause,
      whatWasFixed: `The Shopify dev config now points at ${after.app.publicUrl}, the public tunnel resolves, and the embedded route returns framed HTML successfully.`,
    };
  }

  if (afterHealthy || afterAligned) {
    return {
      status: "improved",
      summary: "The runtime is more consistent than before, but there is still some cleanup left in the embedded path.",
      whatWasBroken: diagnosis.rootCause,
      whatWasFixed: afterAligned
        ? "The Shopify app URL is now aligned with the stable dev hostname."
        : "The public and embedded health checks improved, but the full runtime path is not fully green yet.",
    };
  }

  return {
    status: "failed",
    summary: "The runtime proof sprint found the issue path, but the environment is still not fully fixed.",
    whatWasBroken: diagnosis.rootCause,
    whatWasFixed: "Safe deterministic fixes were applied, but the embedded runtime still needs more work.",
  };
}

export async function generateProofCase(outputPath = DEFAULT_OUTPUT) {
  const [before, diagnosis, actionsTaken, after] = await Promise.all([
    readJson(".tmp/runtime_before.json"),
    readJson(".tmp/runtime_diagnosis.json"),
    readJson(".tmp/runtime_fix_actions.json"),
    readJson(".tmp/runtime_after.json"),
  ]);

  const result = summarize(before, diagnosis, after);
  const proofCase = {
    caseId: `runtime_fix_${Date.now()}`,
    before,
    diagnosis,
    actionsTaken,
    after,
    result,
  };

  await writeFile(resolve(repoRoot, outputPath), `${JSON.stringify(proofCase, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(proofCase, null, 2));
  return proofCase;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { output } = parseArgs(process.argv);
  generateProofCase(output).catch((error) => {
    console.error("[runtime-proof] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
