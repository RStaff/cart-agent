import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { evaluateNokingsMissionReadiness } from "./evaluate_nokings_mission_001_readiness_v1.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const BINDING_PATH = path.join(REPO_ROOT, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json");
const PROOF_RUN_DIR = path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1");
const OUTPUT_PATH = path.join(MODULE_DIR, "output", "nokings_mission_001_readiness_v1.json");
const GENERIC_FILES = [
  "staffordos/shopifixer/shopifixer_command_center_v1.json",
  "staffordos/clients/shopifixer_offer_latest.json",
  "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json",
  "staffordos/qa/output/shopifixer_operational_readiness_v1.json",
  "staffordos/ui/operator-frontend/app/operator/shopifixer-pilot/page.tsx",
  "staffordos/ui/operator-frontend/components/operator/ShopifixerPilotWorkspace.tsx"
];

function readText(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  } catch {
    return "";
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(String(text ?? ""), "utf8").digest("hex");
}

function snapshot(paths) {
  const out = {};
  for (const rel of paths) {
    const abs = path.join(REPO_ROOT, rel);
    const text = readText(abs);
    out[rel] = {
      exists: fs.existsSync(abs),
      sha256: sha256(text),
      size: Buffer.byteLength(text, "utf8")
    };
  }
  return out;
}

function assert(condition, label, failures) {
  if (!condition) failures.push(label);
}

function writeFixtureFixture(root, binding, scope, before, after, proof) {
  const missionDir = path.join(root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1");
  const missionBindingDir = path.join(root, "staffordos/missions");
  fs.mkdirSync(missionDir, { recursive: true });
  fs.mkdirSync(missionBindingDir, { recursive: true });
  fs.writeFileSync(path.join(root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"), `${JSON.stringify(binding, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(missionDir, "fix_scope.md"), scope, "utf8");
  fs.writeFileSync(path.join(missionDir, "before_evidence.md"), before, "utf8");
  fs.writeFileSync(path.join(missionDir, "after_evidence.md"), after, "utf8");
  fs.writeFileSync(path.join(missionDir, "merchant_proof_package.md"), proof, "utf8");
  fs.writeFileSync(path.join(missionDir, "execution_notes.md"), "# Execution Notes\n\nStatus:\nNot yet executed\n", "utf8");
}

function runEvaluator({ bindingPath, proofRunDir, outputPath }) {
  const result = spawnSync("node", [path.join(MODULE_DIR, "evaluate_nokings_mission_001_readiness_v1.mjs")], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      NOKINGS_BINDING_PATH: bindingPath,
      NOKINGS_PROOF_RUN_DIR: proofRunDir,
      NOKINGS_READINESS_OUTPUT_PATH: outputPath,
      NOKINGS_REPO_ROOT: REPO_ROOT
    }
  });
  return result;
}

function main() {
  const failures = [];
  const productionBefore = snapshot(GENERIC_FILES);

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-nokings-mission-"));
  const fixtureRoot = path.join(tmpRoot, "repo");
  fs.mkdirSync(fixtureRoot, { recursive: true });

  const repoBinding = JSON.parse(fs.readFileSync(BINDING_PATH, "utf8"));
  const scopeIncomplete = `# Fix Scope\n\nStatus:\nNot yet executed\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nStore:\nno-kings-athletics.myshopify.com\n\nIssue:\nNot Yet Available\n\nSmallest Scoped Fix:\nNot Yet Available\n\nIn Scope:\n- Governed scope establishment\n\nOut of Scope:\n- Payment changes\n- Completion changes\n- Evidence fabrication\n- Unscoped theme changes\n\nMerchant Approval Required:\nNot Yet Available\n\nChange Location:\nNot Yet Available\n\nImplementation Notes:\n- Controlled training environment only.\n- Awaiting governed scope.\n\nSuccess Criteria:\n- Governed mission scope established without mutating production merchant truth.\n`;
  const beforeMissing = `# Before Evidence\n\nStatus:\nNot yet executed\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nStore:\nno-kings-athletics.myshopify.com\n\nAffected Page / Artifact:\nNot Yet Available\n\nIssue:\nNot Yet Available\n\nWhy It Matters:\nNot Yet Available\n\nScreenshot:\nNot Yet Available\n\nNotes:\n- Controlled training environment.\n- No evidence captured yet.\n`;
  const afterMissing = `# After Evidence\n\nStatus:\nNot yet executed\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nStore:\nno-kings-athletics.myshopify.com\n\nAffected Page / Artifact:\nNot Yet Available\n\nObserved Improvement:\nNot Yet Available\n\nMerchant-Facing Summary:\nNot Yet Available\n\nRemaining Limitations:\nNot Yet Available\n\nScreenshot:\nNot Yet Available\n`;
  const proofMissing = `# Merchant Proof Package\n\nStatus:\nNot yet executed\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nStore:\nno-kings-athletics.myshopify.com\n\nProof Run ID:\nmission_001_nokings_shopifixer_v1\n\nProof Package Version:\nv1\n\nGenerated At:\nNot Yet Available\n\nManifest Path:\nNot Yet Available\n`;
  writeFixtureFixture(fixtureRoot, repoBinding, scopeIncomplete, beforeMissing, afterMissing, proofMissing);

  const tempOutput = path.join(tmpRoot, "nokings_readiness.json");
  const repoProofRunDir = path.join(fixtureRoot, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1");
  const baseFixture = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    outputPath: tempOutput
  });
  assert(baseFixture.status === 0, "evaluator exits 0 for conditional go", failures);
  const baseReport = JSON.parse(fs.readFileSync(tempOutput, "utf8"));
  assert(baseReport.status === "CONDITIONAL_GO", "base fixture status is CONDITIONAL_GO", failures);
  assert(baseReport.current_phase === "scope", "base fixture current phase is scope", failures);
  assert(baseReport.current_blocker === "Scope Incomplete", "base fixture blocker is Scope Incomplete", failures);
  assert(baseReport.next_safe_action === "Establish governed mission scope", "base fixture next safe action is establish governed mission scope", failures);
  assert(baseReport.payment_required === false, "payment_required is false", failures);
  assert(baseReport.completion_permitted === false, "completion is not permitted", failures);
  assert(baseReport.merchant.canonical_store_domain === "no-kings-athletics.myshopify.com", "canonical NoKings store is correct", failures);
  assert(baseReport.gates.merchant_binding.status === "pass", "merchant binding passes", failures);
  assert(baseReport.gates.scope.status === "blocked", "scope gate is blocked", failures);
  assert(baseReport.gates.before_evidence.status === "blocked", "before evidence gate is blocked", failures);
  assert(baseReport.gates.payment_applicability.status === "pass", "payment applicability passes as not required", failures);
  assert(readText(BINDING_PATH).includes("no-kings-athletics.myshopify.com"), "binding file uses canonical NoKings store", failures);
  assert(!readText(BINDING_PATH).includes("cart-agent-dev.myshopify.com"), "binding file does not reference cart-agent-dev", failures);

  const completedScope = `# Fix Scope\n\nStatus:\nComplete\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nStore:\nno-kings-athletics.myshopify.com\n\nIssue:\nHomepage product discovery and value clarity.\n\nSmallest Scoped Fix:\nImprove early product clarity without redesigning the store.\n\nIn Scope:\n- Governed scope establishment\n- Early product clarity\n\nOut of Scope:\n- Payment changes\n- Completion changes\n\nMerchant Approval Required:\nNo\n\nChange Location:\nHomepage product path\n\nImplementation Notes:\n- Controlled training environment only.\n- Preserve historical evidence.\n\nSuccess Criteria:\n- Scope is governed and ready for the next controlled phase.\n`;
  fs.writeFileSync(path.join(repoProofRunDir, "fix_scope.md"), completedScope, "utf8");
  const scopeCompleteReportPath = path.join(tmpRoot, "nokings_scope_complete.json");
  const scopeCompleteRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    outputPath: scopeCompleteReportPath
  });
  assert(scopeCompleteRun.status === 0, "evaluator exits 0 for scope complete fixture", failures);
  const scopeCompleteReport = JSON.parse(fs.readFileSync(scopeCompleteReportPath, "utf8"));
  assert(scopeCompleteReport.current_phase === "before_evidence", "completed scope advances to before_evidence", failures);
  assert(scopeCompleteReport.current_blocker === "Before Evidence Missing", "missing before evidence becomes next blocker", failures);
  assert(scopeCompleteReport.next_safe_action === "Capture Before Evidence", "next safe action becomes capture before evidence", failures);

  const productionAfter = snapshot(GENERIC_FILES);
  for (const rel of GENERIC_FILES) {
    assert(
      productionBefore[rel].sha256 === productionAfter[rel].sha256 && productionBefore[rel].size === productionAfter[rel].size,
      `production truth unchanged for ${rel}`,
      failures
    );
  }

  const currentBinding = fs.readFileSync(BINDING_PATH, "utf8");
  assert(!currentBinding.includes("cart-agent-dev.myshopify.com") || currentBinding.includes("\"shopify_admin_identity\": \"no-kings-athletics-dev.myshopify.com\""), "NoKings binding remains separate from cart-agent-dev proof artifacts", failures);
  assert(readText(path.join(REPO_ROOT, "staffordos/proofs/shopify_install_success_v1.md")).includes("cart-agent-dev.myshopify.com"), "Abando install proof remains intact", failures);
  assert(!readText(path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/merchant_proof_package.md")).includes("seal.json"), "No seal is fabricated in mission proof scaffold", failures);
  assert(!readText(path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/merchant_proof_package.md")).includes("payment_received"), "No payment claim is fabricated in mission proof scaffold", failures);

  if (failures.length) {
    console.error(JSON.stringify({ status: "failed", failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: "passed",
    checks: {
      evaluator_read_only: true,
      binding_gate_passes: true,
      scope_complete_advances: true,
      before_evidence_next_blocker: true,
      payment_not_required: true,
      no_cart_agent_dev_reference_in_binding: true,
      production_truth_unchanged: true,
      abando_authority_unchanged: true
    }
  }, null, 2));
}

main();
