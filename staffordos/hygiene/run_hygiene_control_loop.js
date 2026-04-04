import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const HYGIENE_DIR = path.join(CANONICAL_ROOT, "staffordos/hygiene");
const HYGIENE_REPORT_PATH = path.join(HYGIENE_DIR, "hygiene_report_v1.json");
const ENVIRONMENT_INVENTORY_PATH = path.join(HYGIENE_DIR, "environment_inventory_v1.json");
const WORKTREE_CLEANUP_GATE_REPORT_PATH = path.join(HYGIENE_DIR, "worktree_cleanup_gate_report.md");

function runNodeScript(scriptName) {
  execFileSync("node", [path.join(HYGIENE_DIR, scriptName)], {
    cwd: CANONICAL_ROOT,
    stdio: "inherit",
  });
}

function readCleanupGateStatus() {
  try {
    const markdown = fs.readFileSync(WORKTREE_CLEANUP_GATE_REPORT_PATH, "utf8");
    const match = markdown.match(/- Status:\s+`([^`]+)`/);
    return match?.[1] || "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

console.log("=== HYGIENE CONTROL LOOP ===");
console.log("");

runNodeScript("run_hygiene_check.js");
console.log("");
runNodeScript("build_environment_inventory.js");
console.log("");
runNodeScript("run_worktree_cleanup_gate.js");
console.log("");

const cleanupGateStatus = readCleanupGateStatus();

console.log("ARTIFACTS:");
console.log(`- ${HYGIENE_REPORT_PATH}`);
console.log(`- ${ENVIRONMENT_INVENTORY_PATH}`);
console.log(`- ${WORKTREE_CLEANUP_GATE_REPORT_PATH}`);
console.log("");

if (cleanupGateStatus !== "READY_TO_WORK") {
  console.log(`WORKTREE STATE: ${cleanupGateStatus}`);
  console.log("Further execution should stay scoped until cleanup is addressed.");
} else {
  console.log("WORKTREE STATE: READY_TO_WORK");
}
