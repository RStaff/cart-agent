import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import jiti from "jiti";

import { evaluateNokingsMissionReadiness } from "./evaluate_nokings_mission_001_readiness_v1.mjs";

const MODULE_DIR = path.dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, "utf8");
}

function snapshot(relPaths, root = REPO_ROOT) {
  const out = {};
  for (const rel of relPaths) {
    const abs = path.join(root, rel);
    const text = readText(abs);
    out[rel] = {
      exists: fs.existsSync(abs),
      size: Buffer.byteLength(text, "utf8"),
      sha256: crypto.createHash("sha256").update(text, "utf8").digest("hex")
    };
  }
  return out;
}

function indexDoc(kind, activeExercise) {
  return `# ${kind} Index

Status:
Deprecated

Mission:
Mission 001 - NoKings Shopify Engineering Training

Active Exercise:
${activeExercise}

Exercise 004 ${kind} Path:
staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/${kind.toLowerCase().replace(/ /g, "_")}.md

Exercise 005 ${kind} Path:
staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/${kind.toLowerCase().replace(/ /g, "_")}.md

Payload Authority:
Exercise-specific

Notes:
- Do not write ${kind.toLowerCase()} content directly here.
- Do not treat this file as authoritative ${kind.toLowerCase()} payload.
`;
}

function beforeEvidenceManifest({ proofRunId, store, outputPath }) {
  return {
    schema: "staffordos.evidence_manifest.v1",
    generated_at: "2026-07-11T00:00:00.000Z",
    manifest_version: 1,
    proof_run_id: proofRunId,
    merchant: { store },
    artifacts: [
      {
        artifact_id: `${proofRunId}_before`,
        stage: "before_evidence",
        created_at: "2026-07-11T00:00:00.000Z",
        output_path: outputPath,
        source_writer: "writeShopifixerBeforeEvidence",
        references: ["Collection page inventory"],
        screenshot_artifacts: []
      }
    ]
  };
}

function run() {
  const failures = [];
  const productionBefore = snapshot([
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/before_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/execution_notes.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/after_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/before_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/execution_notes.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/after_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/mission_proof_package.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/execution_notes.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/after_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md"
  ]);

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-nokings-artifact-"));
  const repoRoot = path.join(tmpRoot, "repo");
  const frontendDir = path.join(repoRoot, "staffordos/ui/operator-frontend");
  const exercisesDir = path.join(repoRoot, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises");
  const commercialRunDir = path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1");
  const missionRunDir = path.join(repoRoot, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1");
  const manifestPath = path.join(repoRoot, "staffordos/proof_runs/output/evidence_manifest_v1.json");
  const commercialBeforePath = path.join(commercialRunDir, "before_evidence.md");
  const commercialAfterPath = path.join(commercialRunDir, "after_evidence.md");

  fs.mkdirSync(frontendDir, { recursive: true });
  fs.mkdirSync(path.join(exercisesDir, "exercise_004"), { recursive: true });
  fs.mkdirSync(path.join(exercisesDir, "exercise_005"), { recursive: true });
  fs.mkdirSync(commercialRunDir, { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

  const repoFilesToCopy = [
    "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/before_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/execution_notes.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/after_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/fix_scope.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/before_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/execution_notes.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/after_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/mission_proof_package.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/fix_scope.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/execution_notes.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/after_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md"
  ];

  for (const rel of repoFilesToCopy) {
    writeText(path.join(repoRoot, rel), readText(path.join(REPO_ROOT, rel)));
  }

  writeText(path.join(missionRunDir, "before_evidence.md"), indexDoc("Before Evidence", "Exercise 005 - Collection Page Inventory"));
  writeText(path.join(missionRunDir, "execution_notes.md"), indexDoc("Execution Notes", "Exercise 005 - Collection Page Inventory"));
  writeText(path.join(missionRunDir, "after_evidence.md"), indexDoc("After Evidence", "Exercise 005 - Collection Page Inventory"));
  writeText(path.join(missionRunDir, "mission_proof_package.md"), indexDoc("Mission Proof Package", "Exercise 005 - Collection Page Inventory"));
  assert(readText(path.join(missionRunDir, "before_evidence.md")).includes("Exercise-specific"), "root before evidence is index-only", failures);
  assert(readText(path.join(missionRunDir, "execution_notes.md")).includes("Exercise-specific"), "root execution notes are index-only", failures);
  assert(readText(path.join(missionRunDir, "after_evidence.md")).includes("Exercise-specific"), "root after evidence is index-only", failures);
  assert(readText(path.join(missionRunDir, "mission_proof_package.md")).includes("Exercise-specific"), "root mission proof package is index-only", failures);
  writeText(commercialBeforePath, `# BEFORE EVIDENCE\n\nStore:\ncart-agent-dev.myshopify.com\n\nDate:\n2026-07-11\n\nAffected Page / Artifact:\nCommercial default scope writer\n\nIssue:\nCommercial default behavior\n\nWhy It Matters:\nBaseline for the commercial path\n\nScreenshot:\nhttps://example.com/before.png\n\nNotes:\nCommercial scope writer baseline.\n`);
  writeText(commercialAfterPath, `# AFTER EVIDENCE\n\nStore:\ncart-agent-dev.myshopify.com\n\nDate:\n2026-07-11\n\nAffected Page / Artifact:\nCommercial default proof writer\n\nScreenshot:\nhttps://example.com/after.png\n\nAfter Notes:\nCommercial proof writer baseline.\n\nObserved Improvement:\nNot Yet Available\n\nRemaining Limitations:\nNot Yet Available\n\nMerchant-Facing Summary:\nNot Yet Available\n`);

  // Seed the commercial proof manifest and prove the commercial default still points at its historical path.
  writeText(manifestPath, JSON.stringify({
    schema: "staffordos.evidence_manifest.v1",
    generated_at: "2026-07-11T00:00:00.000Z",
    manifest_version: 1,
    proof_run_id: "internal_shopifixer_dry_run_v1",
    merchant: { store: "cart-agent-dev.myshopify.com" },
    artifacts: []
  }, null, 2) + "\n");

  const previousCwd = process.cwd();
  const previousRepoRoot = process.env.STAFFORDOS_REPO_ROOT;
  try {
    process.chdir(frontendDir);
    process.env.STAFFORDOS_REPO_ROOT = repoRoot;
    const load = jiti(import.meta.url);
    const { writeShopifixerBeforeEvidence } = load("../ui/operator-frontend/lib/operator/writeShopifixerBeforeEvidence.ts");
    const { writeShopifixerAfterEvidence } = load("../ui/operator-frontend/lib/operator/writeShopifixerAfterEvidence.ts");
    const { writeShopifixerProofPackage } = load("../ui/operator-frontend/lib/operator/writeShopifixerProofPackage.ts");
    const { writeShopifixerScopedFix } = load("../ui/operator-frontend/lib/operator/writeShopifixerScopedFix.ts");

    const ex004Before = snapshot([
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/before_evidence.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/execution_notes.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/after_evidence.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/mission_proof_package.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md"
    ], repoRoot);

    const commercialScope = writeShopifixerScopedFix({
      store: "cart-agent-dev.myshopify.com",
      scoped_fix: "Commercial default scope writer",
      in_scope: "Commercial default behavior",
      out_of_scope: "Mission-specific paths",
      merchant_approval_needed: "no",
      change_made: "No",
      location_changed: "Not Yet Available",
      implementation_notes: "Commercial default baseline.",
      success_criteria: "Commercial path remains unchanged."
    });
    assert(commercialScope.outputPath.endsWith("staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md"), "commercial scope writer remains unchanged", failures);

    const ex005BeforeResult = writeShopifixerBeforeEvidence({
      store: "no-kings-athletics.myshopify.com",
      date: "2026-07-11",
      affected_page_or_artifact: "Collection page inventory",
      issue: "Not Yet Available",
      why_it_matters: "Not Yet Available",
      screenshot: "Not Yet Available",
      notes: "Mission-specific baseline."
    }, {
      outputPath: path.join(missionRunDir, "exercises/exercise_005/before_evidence.md")
    });
    assert(ex005BeforeResult.outputPath.endsWith("staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md"), "exercise 005 before evidence writes only to exercise_005", failures);
    assert(snapshot(["staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/before_evidence.md"], repoRoot)["staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/before_evidence.md"].sha256 === ex004Before["staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/before_evidence.md"].sha256, "exercise 004 before evidence bytes remain unchanged", failures);
    assert(snapshot(["staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md"], repoRoot)["staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md"].sha256 === ex004Before["staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md"].sha256, "root scope index remains unchanged", failures);

    const ex005AfterResult = writeShopifixerAfterEvidence({
      store: "no-kings-athletics.myshopify.com",
      date: "2026-07-11",
      affected_page_or_artifact: "Collection page inventory",
      after_screenshot: "Not Yet Available",
      after_notes: "Mission-specific baseline.",
      remaining_limitations: "Not Yet Available",
      observed_improvement: "Not Yet Available",
      merchant_facing_summary: "Not Yet Available"
    }, {
      outputPath: path.join(missionRunDir, "exercises/exercise_005/after_evidence.md")
    });
    assert(ex005AfterResult.outputPath.endsWith("staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/after_evidence.md"), "exercise 005 after evidence writes only to exercise_005", failures);
    assert(snapshot(["staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/after_evidence.md"], repoRoot)["staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/after_evidence.md"].sha256 === ex004Before["staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/after_evidence.md"].sha256, "exercise 004 after evidence bytes remain unchanged", failures);

    writeText(manifestPath, JSON.stringify({
      schema: "staffordos.evidence_manifest.v1",
      generated_at: "2026-07-11T00:00:00.000Z",
      manifest_version: 1,
      proof_run_id: "mission_001_nokings_shopifixer_v1",
      merchant: { store: "no-kings-athletics.myshopify.com" },
      artifacts: []
    }, null, 2) + "\n");
    const ex005ProofResult = writeShopifixerProofPackage({
      proofRunDir: path.join(missionRunDir, "exercises/exercise_005"),
      scopePath: path.join(missionRunDir, "exercises/exercise_005/fix_scope.md"),
      beforePath: path.join(missionRunDir, "exercises/exercise_005/before_evidence.md"),
      afterPath: path.join(missionRunDir, "exercises/exercise_005/after_evidence.md"),
      outputPath: path.join(missionRunDir, "exercises/exercise_005/mission_proof_package.md"),
      sealPath: path.join(missionRunDir, "exercises/exercise_005/mission_proof_package.seal.json"),
      manifestPath
    });
    assert(ex005ProofResult.outputPath.endsWith("staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md"), "exercise 005 proof package writes only to exercise_005", failures);
    const ex005ProofText = readText(path.join(missionRunDir, "exercises/exercise_005/mission_proof_package.md"));
    assert(ex005ProofText.includes("Exercise 005 - Collection Page Inventory"), "exercise 005 proof package reads the exercise-specific scope", failures);
    assert(ex005ProofText.includes("no-kings-athletics.myshopify.com"), "exercise 005 proof package preserves mission store identity", failures);

    const missingExecutionNotesRepo = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-nokings-missing-exec-"));
    fs.mkdirSync(path.join(missingExecutionNotesRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005"), { recursive: true });
    writeText(path.join(missingExecutionNotesRepo, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"), readText(path.join(REPO_ROOT, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json")));
    writeText(path.join(missingExecutionNotesRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md"), readText(path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md")));
    writeText(path.join(missingExecutionNotesRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/fix_scope.md"), readText(path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/fix_scope.md")));
    writeText(path.join(missingExecutionNotesRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md"), readText(path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md")));
    writeText(path.join(missingExecutionNotesRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/after_evidence.md"), indexDoc("After Evidence", "Exercise 005 - Collection Page Inventory"));
    writeText(path.join(missingExecutionNotesRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md"), indexDoc("Mission Proof Package", "Exercise 005 - Collection Page Inventory"));
    writeText(path.join(missingExecutionNotesRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/before_evidence.md"), indexDoc("Before Evidence", "Exercise 005 - Collection Page Inventory"));
    writeText(path.join(missingExecutionNotesRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/after_evidence.md"), indexDoc("After Evidence", "Exercise 005 - Collection Page Inventory"));
    writeText(path.join(missingExecutionNotesRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md"), indexDoc("Mission Proof Package", "Exercise 005 - Collection Page Inventory"));
    writeText(path.join(missingExecutionNotesRepo, "staffordos/proof_runs/output/evidence_manifest_v1.json"), `${JSON.stringify(beforeEvidenceManifest({
      proofRunId: "mission_001_nokings_shopifixer_v1",
      store: "no-kings-athletics.myshopify.com",
      outputPath: "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md"
    }), null, 2)}\n`);
    writeText(path.join(missingExecutionNotesRepo, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md"), readText(path.join(REPO_ROOT, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")));
    const missingExecReport = evaluateNokingsMissionReadiness({
      repoRoot: missingExecutionNotesRepo,
      bindingPath: path.join(missingExecutionNotesRepo, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
      proofRunDir: path.join(missingExecutionNotesRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
      certificationMemoPath: path.join(missingExecutionNotesRepo, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
    });
    console.log(JSON.stringify({
      missingExecPhase: missingExecReport.current_phase,
      missingExecBlocker: missingExecReport.current_blocker,
      missingExecNext: missingExecReport.next_safe_action
    }, null, 2));
    assert(missingExecReport.current_phase === "collection_page_inventory", "missing exercise-specific inventory artifact produces the collection_page_inventory blocker", failures);
    assert(missingExecReport.current_blocker === "Collection Page Inventory Not Performed", "missing exercise-specific inventory artifact is blocked clearly", failures);

    const cartAgentDevRepo = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-nokings-cart-agent-"));
    fs.mkdirSync(path.join(cartAgentDevRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005"), { recursive: true });
    const cartAgentBinding = JSON.parse(readText(path.join(REPO_ROOT, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json")));
    cartAgentBinding.canonical_store_domain = "cart-agent-dev.myshopify.com";
    cartAgentBinding.merchant.store_domain = "cart-agent-dev.myshopify.com";
    cartAgentBinding.merchant.client_id = "cart-agent-dev.myshopify.com";
    writeText(path.join(cartAgentDevRepo, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"), `${JSON.stringify(cartAgentBinding, null, 2)}\n`);
    writeText(path.join(cartAgentDevRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md"), readText(path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md")));
    writeText(path.join(cartAgentDevRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/fix_scope.md"), readText(path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/fix_scope.md")));
    writeText(path.join(cartAgentDevRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md"), readText(path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md")));
    writeText(path.join(cartAgentDevRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/after_evidence.md"), indexDoc("After Evidence", "Exercise 005 - Collection Page Inventory"));
    writeText(path.join(cartAgentDevRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md"), indexDoc("Mission Proof Package", "Exercise 005 - Collection Page Inventory"));
    writeText(path.join(cartAgentDevRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/before_evidence.md"), indexDoc("Before Evidence", "Exercise 005 - Collection Page Inventory"));
    writeText(path.join(cartAgentDevRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/after_evidence.md"), indexDoc("After Evidence", "Exercise 005 - Collection Page Inventory"));
    writeText(path.join(cartAgentDevRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md"), indexDoc("Mission Proof Package", "Exercise 005 - Collection Page Inventory"));
    writeText(path.join(cartAgentDevRepo, "staffordos/proof_runs/output/evidence_manifest_v1.json"), `${JSON.stringify(beforeEvidenceManifest({
      proofRunId: "mission_001_nokings_shopifixer_v1",
      store: "cart-agent-dev.myshopify.com",
      outputPath: "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md"
    }), null, 2)}\n`);
    writeText(path.join(cartAgentDevRepo, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md"), readText(path.join(REPO_ROOT, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")));
    const cartAgentDevReport = evaluateNokingsMissionReadiness({
      repoRoot: cartAgentDevRepo,
      bindingPath: path.join(cartAgentDevRepo, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
      proofRunDir: path.join(cartAgentDevRepo, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
      certificationMemoPath: path.join(cartAgentDevRepo, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
    });
    assert(cartAgentDevReport.current_phase === "merchant_binding", "cart-agent-dev evidence remains rejected", failures);
    assert(cartAgentDevReport.current_blocker === "Merchant binding incomplete", "cart-agent-dev rejection remains explicit", failures);

    const productionAfter = snapshot([
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/before_evidence.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/execution_notes.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/after_evidence.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/before_evidence.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/execution_notes.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/after_evidence.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/mission_proof_package.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/execution_notes.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/after_evidence.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md",
      "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md"
    ]);

    for (const rel of Object.keys(productionBefore)) {
      assert(
        productionBefore[rel].exists === productionAfter[rel].exists &&
        productionBefore[rel].size === productionAfter[rel].size &&
        productionBefore[rel].sha256 === productionAfter[rel].sha256,
        `production truth unchanged for ${rel}`,
        failures
      );
    }

    const commercialAfter = writeShopifixerProofPackage({
      proofRunDir: commercialRunDir,
      beforePath: path.join(commercialRunDir, "before_evidence.md"),
      afterPath: path.join(commercialRunDir, "after_evidence.md"),
      outputPath: path.join(commercialRunDir, "merchant_proof_package.md"),
      sealPath: path.join(commercialRunDir, "merchant_proof_package.seal.json"),
      manifestPath
    });
    assert(commercialAfter.outputPath.endsWith("staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md"), "commercial proof package path remains unchanged", failures);
    assert(readText(path.join(commercialRunDir, "merchant_proof_package.md")).includes("cart-agent-dev.myshopify.com"), "commercial proof package remains cart-agent-dev bound", failures);
  } finally {
    process.chdir(previousCwd);
    if (previousRepoRoot === undefined) {
      delete process.env.STAFFORDOS_REPO_ROOT;
    } else {
      process.env.STAFFORDOS_REPO_ROOT = previousRepoRoot;
    }
  }

  if (failures.length) {
    console.error(JSON.stringify({ status: "failed", failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: "passed",
    checks: {
      before_evidence_isolated: true,
      execution_notes_isolated: true,
      after_evidence_isolated: true,
      proof_package_isolated: true,
      exercise_004_preserved: true,
      exercise_005_writes_isolated: true,
      root_files_remain_index_only: true,
      missing_active_artifact_blocked: true,
      cart_agent_dev_rejected: true,
      commercial_path_unchanged: true,
      no_shopify_payment_execution_completion_mutation: true
    }
  }, null, 2));
}

run();
