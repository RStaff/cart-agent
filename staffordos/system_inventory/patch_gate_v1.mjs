#!/usr/bin/env node

import { execFileSync } from "child_process";
import fs from "fs";

const targetFile = process.argv[2];
const runtimeUrl = process.argv[3];

if (!targetFile) {
  console.error("Usage: node staffordos/system_inventory/patch_gate_v1.mjs <target-file> [runtime-url]");
  process.exit(1);
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function gitStatus() {
  return run("git", ["status", "--short"]).trim();
}

function changedFiles() {
  const output = gitStatus();
  if (!output) return [];
  return output
    .split("\n")
    .map((line) => line.trim().replace(/^[A-Z? ]+\s+/, ""))
    .filter(Boolean);
}

function fail(reason, details = {}) {
  console.log(JSON.stringify({
    ok: false,
    gate: "patch_gate_v1",
    reason,
    target_file: targetFile,
    runtime_url: runtimeUrl || null,
    ...details
  }, null, 2));
  process.exit(2);
}

if (!fs.existsSync(targetFile)) {
  fail("target_file_missing");
}

const files = changedFiles();

const forbiddenGenerated = files.filter((file) =>
  file.includes("node_modules") ||
  file.includes(".next") ||
  file.endsWith("next-env.d.ts") ||
  file.endsWith("agent_execution_log_v1.json") ||
  file.endsWith("lead_registry_sync_log_v1.json")
);

if (forbiddenGenerated.length > 0) {
  fail("generated_side_effects_present", { forbidden_generated_files: forbiddenGenerated });
}

if (runtimeUrl) {
  let diffRaw = "";
  try {
    diffRaw = run("node", [
      "staffordos/system_inventory/shape_diff_v1.mjs",
      targetFile,
      runtimeUrl
    ]);
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout) : "";
    const stderr = error.stderr ? String(error.stderr) : "";
    fail("shape_diff_failed_or_mismatch", {
      stdout: stdout ? JSON.parse(stdout) : null,
      stderr
    });
  }

  const shapeDiff = JSON.parse(diffRaw);

  if (!shapeDiff.ok) {
    fail("shape_mismatch_blocks_patch", { shapeDiff });
  }
}

console.log(JSON.stringify({
  ok: true,
  gate: "patch_gate_v1",
  target_file: targetFile,
  runtime_url: runtimeUrl || null,
  changed_files: files,
  decision: "patch_allowed"
}, null, 2));
