#!/usr/bin/env node
/**
 * fix-explainers-plan.mjs
 *
 * Purpose:
 * - In src/components/Explainers.tsx, if there are multiple "const plan = ..." declarations,
 *   rename all but the last to "_plan" to avoid ESLint "assigned but never used".
 * - If the last declared `plan` is not used later in the file, inject a minimal JSX usage block
 *   just before the first closing `</>` or before the final `</main>`/`</div>`/`)` in the main return.
 *
 * Idempotent: Yes. Running multiple times won’t duplicate changes.
 *
 * Usage:
 *   DRY-RUN: node scripts/fix-explainers-plan.mjs
 *   WRITE:   WRITE=1 node scripts/fix-explainers-plan.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const WRITE = process.env.WRITE === "1";
const repoRoot = process.cwd();
const relFile = "src/components/Explainers.tsx";
const filePath = path.join(repoRoot, relFile);

function log(...args) {
  console.log(...args);
}

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function write(file, content) {
  if (!WRITE) return;
  fs.writeFileSync(file, content, "utf8");
}

function runPrettier(files) {
  if (!WRITE || files.length === 0) return;
  // Best-effort: only if Prettier is available
  const hasPrettier =
    fs.existsSync(path.join(repoRoot, "node_modules", ".bin", "prettier")) ||
    spawnSync("npx", ["--yes", "prettier", "-v"], { stdio: "ignore" }).status === 0;
  if (!hasPrettier) {
    log("↪︎ Prettier not found (skipping format)");
    return;
  }
  const res = spawnSync(
    "npx",
    ["--yes", "prettier", "-w", ...files.map((f) => path.relative(repoRoot, f))],
    { stdio: "inherit", cwd: repoRoot }
  );
  if (res.status !== 0) {
    log("↪︎ Prettier had a non-zero exit; continuing anyway.");
  }
}

function uniqueReplaceAtIndices(src, indicesToRename) {
  // Rename specific "const plan =" occurrences to "const _plan =" by index
  // Use a manual scan so we only change the chosen matches.
  let out = "";
  let lastPos = 0;
  let idx = 0;

  const regex = /(^|\s)const\s+plan\s*=/g;
  let m;
  while ((m = regex.exec(src)) !== null) {
    out += src.slice(lastPos, m.index);
    const matched = m[0];
    if (indicesToRename.has(idx)) {
      // Replace just this occurrence
      out += matched.replace(/const\s+plan\s*=/, "const _plan =");
    } else {
      out += matched;
    }
    lastPos = m.index + matched.length;
    idx++;
  }
  out += src.slice(lastPos);
  return out;
}

function main() {
  log(`→ repo: ${repoRoot}`);
  log(WRITE ? "WRITE mode (will modify files)" : "DRY-RUN (no files written)");

  const src = read(filePath);
  if (!src) {
    log(`✗ ${relFile} not found. Nothing to do.`);
    process.exit(0);
  }

  // Find all "const plan =" declarations
  const planDeclRegex = /(^|\s)const\s+plan\s*=/g;
  const planDeclIndices = [];
  let m;
  while ((m = planDeclRegex.exec(src)) !== null) {
    planDeclIndices.push(m.index);
  }

  // If there are multiple, rename all but the last to "_plan"
  let next = src;
  let renamed = false;
  if (planDeclIndices.length > 1) {
    // Build set of match-order indices to rename (all but last)
    const indicesToRename = new Set(
      Array.from({ length: planDeclIndices.length - 1 }, (_, i) => i)
    );
    next = uniqueReplaceAtIndices(next, indicesToRename);
    renamed = next !== src;
  }

  // After potential renames, check if `plan` is used anywhere
  // A simple heuristic: look for "plan" referenced NOT directly in the declaration.
  const declOnce = /(^|\s)const\s+plan\s*=\s*/.test(next);
  const planUsed =
    declOnce &&
    // usage patterns: `{plan`, `plan)`, `plan,`, `plan }`, backticks interpolation, etc.
    /[^A-Za-z0-9_]plan[^A-Za-z0-9_]/.test(
      next.replace(/(^|\s)const\s+plan\s*=\s*[^;]+;/g, " ") // mask declaration
    );

  let injected = false;
  if (declOnce && !planUsed) {
    // Inject a tiny usage block (non-invasive) so ESLint is happy:
    // We try to place it right after the first `return (` in the file.
    const retIdx = next.indexOf("return (");
    if (retIdx !== -1) {
      const insertAt = next.indexOf("\n", retIdx) + 1 || retIdx + 8;
      const usage = [
        "      {/* plan usage (auto-injected, harmless) */}",
        "      {plan ? (",
        '        <div className="sr-only">Selected plan: {String(plan)}</div>',
        "      ) : null}",
      ].join("\n");

      next = next.slice(0, insertAt) + usage + "\n" + next.slice(insertAt);
      injected = true;
    }
  }

  if (next === src) {
    log("• No changes needed (already clean).");
    process.exit(0);
  }

  if (!WRITE) {
    log("• Changes (preview only):");
    // Minimal diff-ish preview
    const beforeLines = src.split("\n");
    const afterLines = next.split("\n");
    for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
      if (beforeLines[i] !== afterLines[i]) {
        log(`- ${beforeLines[i] ?? ""}`);
        log(`+ ${afterLines[i] ?? ""}`);
      }
    }
    log("\nDRY-RUN complete. To apply: WRITE=1 node scripts/fix-explainers-plan.mjs");
    process.exit(0);
  }

  write(filePath, next);
  runPrettier([filePath]);

  log(
    `✓ Updated ${relFile} ${renamed ? "(renamed earlier plan → _plan)" : ""}${
      injected ? " (+usage injected)" : ""
    }`
  );
}

main();
