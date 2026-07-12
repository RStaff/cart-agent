import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
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

function certificationMemoFixture({
  missionId = "mission_001",
  exercise = "Exercise 004 - Product Page Inventory",
  merchant = "NoKings Athletics",
  canonicalStore = "no-kings-athletics.myshopify.com",
  decision = "CONDITIONAL GO",
  recommendation = "Exercise 005 - Collection Page Inventory",
  mutationLine = "- No Shopify mutation occurred.",
  outcomeLine = "- No storefront improvements, conversion improvements, merchant results, or revenue impact are claimed."
} = {}) {
  return `# Mission 001 Exercise 004 Certification

## Mission
- Mission ID: \`${missionId}\`
- Mission: \`Mission 001 - NoKings Shopify Engineering Training\`
- Exercise: \`${exercise}\`
- Merchant: \`${merchant}\`
- Canonical store: \`${canonicalStore}\`
- Product: \`ShopiFixer\`
- Environment type: \`controlled_training\`

## Objective
Certify completion of the NoKings product-page inventory exercise using only repository-backed evidence.

## Scope Completed
- Governed scope is complete in \`fix_scope.md\`.
- The scope is analysis-only.
- No payment gate applies.
- No Shopify mutation was performed for this exercise.

## Evidence Chain Verification
- \`before_evidence.md\` captures the baseline NoKings record for Exercise 004.
- \`execution_notes.md\` captures the product-page inventory architecture map.
- \`after_evidence.md\` captures the completion evidence for the analysis exercise.
- \`mission_proof_package.md\` assembles the mission proof package from repository truth.
- The mission-specific readiness evaluator recognizes the mission proof package and advances to the mission certification blocker.

## Architecture Inventory Completed
Repository-backed inventory confirms:
- Template entry point: \`templates/product.json\`
- Main section: \`sections/product-information.liquid\`
- Media block: \`_product-media-gallery\`
- Product details block: \`_product-details\`
- Purchase flow blocks: \`variant-picker\`, \`buy-buttons\`, \`quantity\`, \`add-to-cart\`, \`accelerated-checkout\`
- Reusable snippets:
  - \`snippets/product-media-gallery-content.liquid\`
  - \`snippets/add-to-cart-button.liquid\`
  - \`snippets/quantity-selector.liquid\`
- Follow-on section: \`product-recommendations\`

## Repository Truth Reviewed
- Mission binding
- Scope file
- Before evidence
- Execution notes
- After evidence
- Mission proof package
- Mission readiness output
- Mission curriculum and competency records
- Archived NoKings discovery, execution, and final-audit evidence

## Shopify Mutations Performed
- None

## Knowledge Captured
- The NoKings product page is block-driven and schema-governed.
- The purchase path is centralized through the product-information section and buy-buttons block.
- Variant media, quantity rules, and add-to-cart behavior are coupled to the selected variant.
- The page inventory can be captured cleanly without a Shopify mutation.

## Reusable Engineering Patterns
- Trace from JSON template to section to snippet.
- Treat media, variant, quantity, and CTA controls as one governed flow.
- Keep analysis evidence separate from mutation or proof artifacts.
- Use mission-specific proof runs to isolate training truth from generic pilot truth.

## Risks Remaining
- Theme ID and theme version were not proven in repository truth.
- App-block usage was not proven in the archived inventory.
- Metafield dependencies were not proven in the archived inventory.
- The current readiness gate still reports \`Mission Certification Missing\`, so the mission-level certification artifact is not yet recognized by the evaluator.

## Readiness Assessment
- Current evaluator status: \`CONDITIONAL_GO\`
- Current phase: \`mission_certification\`
- Current blocker: \`Mission Certification Missing\`
- Next safe action: \`Certify Mission 001 Exercise 004\`
- Payment required: \`false\`
- Completion permitted: \`no\`

## Recommendation for Exercise ${recommendation.startsWith("Exercise 005") ? "005" : recommendation}
Do not start the next exercise until the mission certification gate is intentionally resolved or the mission sequence is updated to recognize this certification artifact.

## Engineering Capability Score
- Separate certification-specific capability score: not explicitly defined in repository truth.
- Mission readiness overall score remains \`70/100\` in the NoKings readiness output.

## Certification Decision
**${decision}**

Repository-backed justification:
- The exercise is fully analyzed.
- The architecture inventory is complete.
- The evidence chain is assembled from repository truth.
- No Shopify mutation occurred.
- However, the mission readiness evaluator still reports \`Mission Certification Missing\`, so the mission is not yet fully closed in governed readiness terms.

## Confirmation
${mutationLine}
- The generic cart-agent-dev ShopiFixer pilot remains unchanged.
- Abando authority remains unchanged.

${outcomeLine}
`;
}

function writeFixtureFixture(root, binding, scope, before, after, proof, certificationMemo = "", proofFileName = "mission_proof_package.md", certificationFileName = "p10_9_mission_001_exercise_004_certification_v1.md") {
  const missionDir = path.join(root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1");
  const missionBindingDir = path.join(root, "staffordos/missions");
  const missionImplementationDir = path.join(root, "staffordos/implementation");
  fs.mkdirSync(missionDir, { recursive: true });
  fs.mkdirSync(missionBindingDir, { recursive: true });
  fs.mkdirSync(missionImplementationDir, { recursive: true });
  fs.writeFileSync(path.join(root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"), `${JSON.stringify(binding, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(missionDir, "fix_scope.md"), scope, "utf8");
  fs.writeFileSync(path.join(missionDir, "before_evidence.md"), before, "utf8");
  fs.writeFileSync(path.join(missionDir, "after_evidence.md"), after, "utf8");
  fs.writeFileSync(path.join(missionDir, proofFileName), proof, "utf8");
  fs.writeFileSync(path.join(missionImplementationDir, certificationFileName), certificationMemo, "utf8");
  fs.writeFileSync(path.join(missionDir, "execution_notes.md"), "# Execution Notes\n\nStatus:\nNot yet executed\n", "utf8");
}

function runEvaluator({ bindingPath, proofRunDir, certificationMemoPath, outputPath }) {
  const report = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath,
    proofRunDir,
    certificationMemoPath
  });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return {
    status: report.status === "NO_GO" ? 1 : 0,
    stdout: JSON.stringify(report, null, 2)
  };
}

function main() {
  const failures = [];
  const productionBefore = snapshot(GENERIC_FILES);

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-nokings-mission-"));
  const fixtureRoot = path.join(tmpRoot, "repo");
  fs.mkdirSync(fixtureRoot, { recursive: true });
  const certificationMemoPath = path.join(fixtureRoot, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md");

  const repoBinding = JSON.parse(fs.readFileSync(BINDING_PATH, "utf8"));
  const scopeIncomplete = `# Fix Scope\n\nStatus:\nNot yet executed\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nStore:\nno-kings-athletics.myshopify.com\n\nIssue:\nNot Yet Available\n\nSmallest Scoped Fix:\nNot Yet Available\n\nIn Scope:\n- Governed scope establishment\n\nOut of Scope:\n- Payment changes\n- Completion changes\n- Evidence fabrication\n- Unscoped theme changes\n\nMerchant Approval Required:\nNot Yet Available\n\nChange Location:\nNot Yet Available\n\nImplementation Notes:\n- Controlled training environment only.\n- Awaiting governed scope.\n\nSuccess Criteria:\n- Governed mission scope established without mutating production merchant truth.\n`;
  const beforeMissing = `# Before Evidence\n\nStatus:\nNot yet executed\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nStore:\nno-kings-athletics.myshopify.com\n\nAffected Page / Artifact:\nNot Yet Available\n\nIssue:\nNot Yet Available\n\nWhy It Matters:\nNot Yet Available\n\nScreenshot:\nNot Yet Available\n\nNotes:\n- Controlled training environment.\n- No evidence captured yet.\n`;
  const afterMissing = `# After Evidence\n\nStatus:\nNot yet executed\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nStore:\nno-kings-athletics.myshopify.com\n\nAffected Page / Artifact:\nNot Yet Available\n\nObserved Improvement:\nNot Yet Available\n\nMerchant-Facing Summary:\nNot Yet Available\n\nRemaining Limitations:\nNot Yet Available\n\nScreenshot:\nNot Yet Available\n`;
  const proofMissing = `# Mission Proof Package\n\nStatus:\nNot yet executed\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\nExercise 004 - Product Page Analysis\n\nStore:\nno-kings-athletics.myshopify.com\n\nProof Run ID:\nmission_001_nokings_shopifixer_v1\n\nProof Package Version:\nv1\n\nGenerated At:\nNot Yet Available\n\nManifest Path:\nNot Yet Available\n\nNotes:\n- Mission proof package scaffold only.\n`;
  writeFixtureFixture(fixtureRoot, repoBinding, scopeIncomplete, beforeMissing, afterMissing, proofMissing);

  const tempOutput = path.join(tmpRoot, "nokings_readiness.json");
  const repoProofRunDir = path.join(fixtureRoot, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1");
  const baseFixture = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
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
  const beforeComplete = [
    "# Before Evidence",
    "",
    "Status:",
    "Complete",
    "",
    "Mission ID:",
    "mission_001",
    "",
    "Exercise:",
    "Exercise 004 - Product Page Analysis",
    "",
    "Merchant:",
    "NoKings Athletics",
    "",
    "Store:",
    "no-kings-athletics.myshopify.com",
    "",
    "Theme Name:",
    "Not Yet Proven",
    "",
    "Theme ID:",
    "Not Yet Proven",
    "",
    "Theme Version:",
    "Not Yet Proven",
    "",
    "Theme Pull Reference:",
    "- `staffordos/audits/no_kings/execution_truth/execution_access_result_v1.md`",
    "- `staffordos/audits/no_kings/execution_truth/theme_pull_test_v2.txt`",
    "",
    "Target Templates:",
    "- `templates/product.json`",
    "- `sections/product-information.liquid`",
    "- `snippets/product-media-gallery-content.liquid`",
    "- `snippets/add-to-cart-button.liquid`",
    "",
    "Notes:",
    "- baseline",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(repoProofRunDir, "before_evidence.md"), beforeComplete, "utf8");
  const analysisBlockedReportPath = path.join(tmpRoot, "nokings_scope_complete.json");
  const scopeCompleteRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: analysisBlockedReportPath
  });
  assert(scopeCompleteRun.status === 0, "evaluator exits 0 for scope complete fixture", failures);
  const scopeCompleteReport = JSON.parse(fs.readFileSync(analysisBlockedReportPath, "utf8"));
  assert(scopeCompleteReport.current_phase === "product_page_inventory", "completed scope without analysis advances to product_page_inventory", failures);
  assert(scopeCompleteReport.current_blocker === "Product Page Inventory Not Performed", "missing analysis becomes next blocker", failures);
  assert(scopeCompleteReport.next_safe_action === "Perform governed read-only product page inventory", "next safe action becomes governed product page inventory", failures);
  assert(scopeCompleteReport.gates.execution.status === "blocked", "execution gate remains blocked until analysis is recorded", failures);

  fs.writeFileSync(path.join(repoProofRunDir, "fix_scope.md"), completedScope, "utf8");
  fs.writeFileSync(path.join(repoProofRunDir, "execution_notes.md"), `# Execution Notes\n\nStatus:\nComplete\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nStore:\nno-kings-athletics.myshopify.com\n\nExercise:\nExercise 004 - Product Page Analysis\n\nTarget Files:\n- templates/product.json\n- sections/product-information.liquid\n- snippets/product-media-gallery-content.liquid\n- snippets/add-to-cart-button.liquid\n\nAnalysis Result:\nNot Yet Proven\n\nNotes:\n- Repository-backed read-only analysis completed.\n- No Shopify mutation occurred.\n`);
  fs.writeFileSync(path.join(repoProofRunDir, "after_evidence.md"), `# After Evidence\n\nStatus:\nComplete\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nStore:\nno-kings-athletics.myshopify.com\n\nAffected Page / Artifact:\nProduct page analysis record\n\nObserved Improvement:\nNot Yet Available\n\nMerchant-Facing Summary:\nNot Yet Available\n\nRemaining Limitations:\nThe exercise is analysis-only. No storefront mutation, conversion claim, or merchant outcome is established by the repository truth.\n\nScreenshot:\nNot Yet Available\n\nNotes:\n- Mission 001 Exercise 004 analysis is complete.\n- The product-page architecture inventory is captured in execution notes.\n- No Shopify mutation occurred.\n\nFiles Inventoried:\n- templates/product.json\n- sections/product-information.liquid\n- snippets/product-media-gallery-content.liquid\n- snippets/add-to-cart-button.liquid\n- snippets/quantity-selector.liquid\n`, "utf8");
  const missionPackagePath = path.join(repoProofRunDir, "mission_proof_package.md");
  fs.rmSync(missionPackagePath, { force: true });
  const missingMissionPackageReportPath = path.join(tmpRoot, "nokings_missing_mission_package.json");
  const missingMissionPackageRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: missingMissionPackageReportPath
  });
  assert(missingMissionPackageRun.status === 0, "evaluator exits 0 for missing mission package fixture", failures);
  const missingMissionPackageReport = JSON.parse(missingMissionPackageRun.stdout);
  assert(missingMissionPackageReport.current_phase === "proof_package", "missing mission package remains on proof_package", failures);
  assert(missingMissionPackageReport.current_blocker === "Proof Package Missing", "missing mission package remains blocked", failures);
  assert(missingMissionPackageReport.next_safe_action === "Generate Mission Proof Package", "missing mission package next safe action is generate mission proof package", failures);
  assert(missingMissionPackageReport.gates.proof.status === "blocked", "missing mission package blocks proof gate", failures);

  fs.writeFileSync(missionPackagePath, "", "utf8");
  const emptyMissionPackageReportPath = path.join(tmpRoot, "nokings_empty_mission_package.json");
  const emptyMissionPackageRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: emptyMissionPackageReportPath
  });
  assert(emptyMissionPackageRun.status === 0, "evaluator exits 0 for empty mission package fixture", failures);
  const emptyMissionPackageReport = JSON.parse(emptyMissionPackageRun.stdout);
  assert(emptyMissionPackageReport.current_phase === "proof_package", "empty mission package remains on proof_package", failures);
  assert(emptyMissionPackageReport.current_blocker === "Proof Package Missing", "empty mission package remains blocked", failures);

  fs.writeFileSync(missionPackagePath, `# Mission Proof Package\n\nStatus:\nAssembled\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\nExercise 004 - Product Page Analysis\n\nStore:\nwrong-store.myshopify.com\n\nProof Run ID:\nmission_001_nokings_shopifixer_v1\n\nProof Package Version:\nv1\n\nGenerated At:\n2026-07-11T00:00:00.000Z\n\nManifest Path:\nNot Yet Available\n\nEvidence Source Paths:\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/before_evidence.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/after_evidence.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/execution_notes.md\n\nSeal Status:\nNot Yet Available\n\nNotes:\n- Wrong store should not be accepted.\n`, "utf8");
  const wrongStoreReportPath = path.join(tmpRoot, "nokings_wrong_store_mission_package.json");
  const wrongStoreRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: wrongStoreReportPath
  });
  assert(wrongStoreRun.status === 0, "evaluator exits 0 for wrong store mission package fixture", failures);
  const wrongStoreReport = JSON.parse(wrongStoreRun.stdout);
  assert(wrongStoreReport.current_phase === "proof_package", "wrong store mission package remains on proof_package", failures);
  assert(wrongStoreReport.current_blocker === "Proof Package Missing", "wrong store mission package blocked", failures);

  fs.writeFileSync(missionPackagePath, `# Mission Proof Package\n\nStatus:\nAssembled\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\nExercise 004 - Product Page Analysis\n\nStore:\ncart-agent-dev.myshopify.com\n\nProof Run ID:\nmission_001_nokings_shopifixer_v1\n\nProof Package Version:\nv1\n\nGenerated At:\n2026-07-11T00:00:00.000Z\n\nManifest Path:\nNot Yet Available\n\nEvidence Source Paths:\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/before_evidence.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/after_evidence.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/execution_notes.md\n\nSeal Status:\nNot Yet Available\n\nNotes:\n- cart-agent-dev must not satisfy NoKings proof recognition.\n`, "utf8");
  const cartAgentDevPackageReportPath = path.join(tmpRoot, "nokings_cart_agent_dev_mission_package.json");
  const cartAgentDevPackageRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: cartAgentDevPackageReportPath
  });
  assert(cartAgentDevPackageRun.status === 0, "evaluator exits 0 for cart-agent-dev mission package fixture", failures);
  const cartAgentDevPackageReport = JSON.parse(cartAgentDevPackageRun.stdout);
  assert(cartAgentDevPackageReport.current_phase === "proof_package", "cart-agent-dev package remains on proof_package", failures);
  assert(cartAgentDevPackageReport.current_blocker === "Proof Package Missing", "cart-agent-dev package not accepted", failures);

  fs.writeFileSync(missionPackagePath, `# Mission Proof Package\n\nStatus:\nAssembled\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\nExercise 004 - Product Page Analysis\n\nStore:\nno-kings-athletics.myshopify.com\n\nProof Run ID:\nmission_001_nokings_shopifixer_v1\n\nProof Package Version:\nv1\n\nGenerated At:\n2026-07-11T00:00:00.000Z\n\nManifest Path:\nNot Yet Available\n\nEvidence Source Paths:\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/before_evidence.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/after_evidence.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/execution_notes.md\n\nSeal Status:\nNot Yet Available\n\nNotes:\n- Mission proof package is ready for governed review.\n`, "utf8");
  const validPackageReportPath = path.join(tmpRoot, "nokings_valid_mission_package.json");
  const validPackageRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: validPackageReportPath
  });
  assert(validPackageRun.status === 0, "evaluator exits 0 for valid mission package fixture", failures);
  const validPackageReport = JSON.parse(validPackageRun.stdout);
  assert(validPackageReport.status === "CONDITIONAL_GO", "valid mission package returns CONDITIONAL_GO", failures);
  assert(validPackageReport.current_phase === "mission_certification", "valid package advances to mission_certification", failures);
  assert(validPackageReport.current_blocker === "Mission Certification Missing", "valid package next blocker is Mission Certification Missing", failures);
  assert(validPackageReport.next_safe_action === "Certify Mission 001 Exercise 004", "valid package next action is mission certification", failures);
  assert(validPackageReport.gates.proof.status === "pass", "valid package passes proof gate", failures);
  assert(validPackageReport.payment_required === false, "payment remains not required", failures);

  fs.rmSync(certificationMemoPath, { force: true });
  const missingCertificationRunPath = path.join(tmpRoot, "nokings_missing_certification.json");
  const missingCertificationRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: missingCertificationRunPath
  });
  assert(missingCertificationRun.status === 0, "evaluator exits 0 for missing certification memo fixture", failures);
  const missingCertificationReport = JSON.parse(missingCertificationRun.stdout);
  assert(missingCertificationReport.current_phase === "mission_certification", "missing certification remains on mission_certification", failures);
  assert(missingCertificationReport.current_blocker === "Mission Certification Missing", "missing certification remains blocked", failures);
  assert(missingCertificationReport.next_safe_action === "Certify Mission 001 Exercise 004", "missing certification next action is certify mission 001 exercise 004", failures);
  assert(missingCertificationReport.gates.mission_certification.status === "blocked", "mission certification gate is blocked when memo is missing", failures);

  fs.writeFileSync(certificationMemoPath, "", "utf8");
  const emptyCertificationRunPath = path.join(tmpRoot, "nokings_empty_certification.json");
  const emptyCertificationRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: emptyCertificationRunPath
  });
  assert(emptyCertificationRun.status === 0, "evaluator exits 0 for empty certification memo fixture", failures);
  const emptyCertificationReport = JSON.parse(emptyCertificationRun.stdout);
  assert(emptyCertificationReport.current_phase === "mission_certification", "empty certification remains on mission_certification", failures);
  assert(emptyCertificationReport.current_blocker === "Mission Certification Missing", "empty certification remains blocked", failures);

  fs.writeFileSync(certificationMemoPath, certificationMemoFixture({ canonicalStore: "wrong-store.myshopify.com" }), "utf8");
  const wrongStoreCertificationRunPath = path.join(tmpRoot, "nokings_wrong_store_certification.json");
  const wrongStoreCertificationRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: wrongStoreCertificationRunPath
  });
  assert(wrongStoreCertificationRun.status === 0, "evaluator exits 0 for wrong-store certification fixture", failures);
  const wrongStoreCertificationReport = JSON.parse(wrongStoreCertificationRun.stdout);
  assert(wrongStoreCertificationReport.current_phase === "mission_certification", "wrong-store certification remains on mission_certification", failures);
  assert(wrongStoreCertificationReport.current_blocker === "Mission Certification Missing", "wrong-store certification remains blocked", failures);

  fs.writeFileSync(certificationMemoPath, certificationMemoFixture({ exercise: "Exercise 003 - Product List Analysis" }), "utf8");
  const wrongExerciseCertificationRunPath = path.join(tmpRoot, "nokings_wrong_exercise_certification.json");
  const wrongExerciseCertificationRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: wrongExerciseCertificationRunPath
  });
  assert(wrongExerciseCertificationRun.status === 0, "evaluator exits 0 for wrong-exercise certification fixture", failures);
  const wrongExerciseCertificationReport = JSON.parse(wrongExerciseCertificationRun.stdout);
  assert(wrongExerciseCertificationReport.current_phase === "mission_certification", "wrong-exercise certification remains on mission_certification", failures);
  assert(wrongExerciseCertificationReport.current_blocker === "Mission Certification Missing", "wrong-exercise certification remains blocked", failures);

  fs.writeFileSync(certificationMemoPath, certificationMemoFixture({ canonicalStore: "cart-agent-dev.myshopify.com" }), "utf8");
  const cartAgentDevCertificationRunPath = path.join(tmpRoot, "nokings_cart_agent_dev_certification.json");
  const cartAgentDevCertificationRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: cartAgentDevCertificationRunPath
  });
  assert(cartAgentDevCertificationRun.status === 0, "evaluator exits 0 for cart-agent-dev certification fixture", failures);
  const cartAgentDevCertificationReport = JSON.parse(cartAgentDevCertificationRun.stdout);
  assert(cartAgentDevCertificationReport.current_phase === "mission_certification", "cart-agent-dev certification remains on mission_certification", failures);
  assert(cartAgentDevCertificationReport.current_blocker === "Mission Certification Missing", "cart-agent-dev certification rejected", failures);

  fs.writeFileSync(certificationMemoPath, certificationMemoFixture(), "utf8");
  const validCertificationRunPath = path.join(tmpRoot, "nokings_valid_certification.json");
  const validCertificationRun = runEvaluator({
    bindingPath: path.join(fixtureRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: repoProofRunDir,
    certificationMemoPath,
    outputPath: validCertificationRunPath
  });
  assert(validCertificationRun.status === 0, "evaluator exits 0 for valid certification fixture", failures);
  const validCertificationReport = JSON.parse(validCertificationRun.stdout);
  assert(validCertificationReport.status === "CONDITIONAL_GO", "valid certification returns CONDITIONAL_GO", failures);
  assert(validCertificationReport.current_phase === "exercise_005_planning", "valid certification advances to exercise_005_planning", failures);
  assert(validCertificationReport.current_blocker === "Exercise 005 Planning Missing", "valid certification next blocker is Exercise 005 Planning Missing", failures);
  assert(validCertificationReport.next_safe_action === "Plan Exercise 005 - Collection Page Inventory", "valid certification next action is Exercise 005 planning", failures);
  assert(validCertificationReport.gates.mission_certification.status === "pass", "valid certification passes mission certification gate", failures);
  assert(validCertificationReport.gates.exercise_005_planning.status === "blocked", "exercise 005 planning remains blocked until planned", failures);
  assert(validCertificationReport.payment_required === false, "payment remains not required for valid certification", failures);

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
  assert(readText(path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md")).includes("Mission Proof Package"), "mission proof package exists", failures);
  assert(!readText(path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md")).includes("seal.json"), "No seal is fabricated in mission proof scaffold", failures);
  assert(!readText(path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md")).includes("payment_received"), "No payment claim is fabricated in mission proof scaffold", failures);

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
      abando_authority_unchanged: true,
      mission_proof_package_recognized: true,
      cart_agent_dev_package_rejected: true,
      mission_certification_requires_memo: true,
      valid_certification_advances_to_exercise_005_planning: true
    }
  }, null, 2));
}

main();
