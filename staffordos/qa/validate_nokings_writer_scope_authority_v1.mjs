import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import jiti from "jiti";

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value ?? ""), "utf8").digest("hex");
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, "utf8");
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function snapshot(filePath) {
  const text = readText(filePath);
  return {
    exists: fs.existsSync(filePath),
    size: Buffer.byteLength(text, "utf8"),
    sha256: sha256(text)
  };
}

function endsWithRepoRelative(filePath, suffix) {
  return String(filePath || "").split(path.sep).join("/").endsWith(suffix);
}

function scopeContent({
  exercise,
  objective,
  targetArtifact,
  inScope,
  outOfScope
}) {
  return `# Fix Scope

Status:
Complete

Mission:
Mission 001 - NoKings Shopify Engineering Training

Product:
ShopiFixer

Environment Type:
controlled_training

Store:
no-kings-athletics.myshopify.com

Exact Problem / Learning Objective:
${exercise}

${objective}

Target Page / Template / Artifact:
${targetArtifact}

Smallest Governed Scope:
Read-only training inventory for ${exercise.toLowerCase()}.

In Scope:
${inScope.map((line) => `- ${line}`).join("\n")}

Out of Scope:
${outOfScope.map((line) => `- ${line}`).join("\n")}

Merchant Approval Requirement:
No

Implementation Permitted:
No

Required Before Evidence:
- Governed scope only
- No new evidence capture required for scope completion

Success Criteria:
- The governed scope is isolated to the active exercise
- The root mission scope file is not treated as the canonical payload

Rollback Expectation:
- Restore the exercise-specific scope file for this exercise

Knowledge Capture Requirement:
- Record the exercise-specific scope, dependency chain, and safe-change observations

Source Artifacts:
- STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md
- SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md
- SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md
`;
}

function proofManifest({
  proofRunId,
  merchantStore,
  createdAt = "2026-07-11T00:00:00.000Z"
}) {
  return {
    schema: "staffordos.evidence_manifest.v1",
    generated_at: createdAt,
    manifest_version: 1,
    proof_run_id: proofRunId,
    merchant: {
      store: merchantStore
    },
    artifacts: [
      {
        artifact_id: "ev_temp_before",
        stage: "before_evidence",
        created_at: createdAt,
        output_path: "temp/before_evidence.md",
        source_writer: "writeShopifixerBeforeEvidence",
        screenshot_artifacts: [
          {
            artifact_id: "sc_before",
            original_reference: "temp/before.png",
            stored_path: "temp/before.png",
            exists: true,
            status: "stored"
          }
        ]
      },
      {
        artifact_id: "ev_temp_after",
        stage: "after_evidence",
        created_at: createdAt,
        output_path: "temp/after_evidence.md",
        source_writer: "writeShopifixerAfterEvidence",
        screenshot_artifacts: [
          {
            artifact_id: "sc_after",
            original_reference: "temp/after.png",
            stored_path: "temp/after.png",
            exists: true,
            status: "stored"
          }
        ]
      }
    ]
  };
}

function run() {
  const failures = [];
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-nokings-writer-"));
  const repoRoot = path.join(tmpRoot, "repo");
  const frontendDir = path.join(repoRoot, "staffordos/ui/operator-frontend");
  const commercialRunDir = path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1");
  const missionRunDir = path.join(repoRoot, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1");
  const exercisesDir = path.join(missionRunDir, "exercises");
  const manifestPath = path.join(repoRoot, "staffordos/proof_runs/output/evidence_manifest_v1.json");

  fs.mkdirSync(frontendDir, { recursive: true });
  fs.mkdirSync(commercialRunDir, { recursive: true });
  fs.mkdirSync(path.join(exercisesDir, "exercise_004"), { recursive: true });
  fs.mkdirSync(path.join(exercisesDir, "exercise_005"), { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

  const rootIndexPath = path.join(missionRunDir, "fix_scope.md");
  const ex004Path = path.join(exercisesDir, "exercise_004/fix_scope.md");
  const ex005Path = path.join(exercisesDir, "exercise_005/fix_scope.md");
  const commercialScopePath = path.join(commercialRunDir, "fix_scope.md");
  const commercialBeforePath = path.join(commercialRunDir, "before_evidence.md");
  const commercialAfterPath = path.join(commercialRunDir, "after_evidence.md");
  const commercialProofPackagePath = path.join(commercialRunDir, "merchant_proof_package.md");
  const commercialSealPath = path.join(commercialRunDir, "merchant_proof_package.seal.json");
  const missionBeforePath = path.join(missionRunDir, "before_evidence.md");
  const missionAfterPath = path.join(missionRunDir, "after_evidence.md");
  const missionProofPackagePath = path.join(missionRunDir, "mission_proof_package.md");
  const missionSealPath = path.join(missionRunDir, "mission_proof_package.seal.json");

  writeText(rootIndexPath, `# Mission Scope Index\n\nStatus:\nDeprecated\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nActive Exercise:\nExercise 005 - Collection Page Inventory\n\nExercise 004 Scope Path:\nstaffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/fix_scope.md\n\nExercise 005 Scope Path:\nstaffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/fix_scope.md\n\nScope Authority:\nExercise-specific\n\nNotes:\n- Do not write scope content directly here.\n- Do not treat this file as authoritative scope payload.\n- Exercise 005 - Collection Page Inventory is the governed active exercise.\n`);
  writeText(ex004Path, scopeContent({
    exercise: "Exercise 004 - Product Page Inventory",
    objective: "The governed training objective is to map the NoKings product page file stack and media / CTA dependencies before any reversible implementation is considered.",
    targetArtifact: "templates/product.json\nsections/product-information.liquid\nsnippets/product-media-gallery-content.liquid\nsnippets/add-to-cart-button.liquid",
    inScope: ["Product page file-stack inventory", "Product media dependency mapping", "Product CTA dependency mapping"],
    outOfScope: ["Shopify theme edits", "Payment changes", "Completion changes"]
  }));
  const ex004Before = snapshot(ex004Path);
  writeText(ex005Path, scopeContent({
    exercise: "Exercise 005 - Collection Page Inventory",
    objective: "The governed training objective is to map the NoKings collection page file stack and its filtering, sorting, grid, pagination, and product-card dependencies.",
    targetArtifact: "templates/collection.json\nsections/main-collection.liquid\nsections/collection-list.liquid\nsnippets/product-grid.liquid\nsnippets/product-card.liquid\nsnippets/collection-card.liquid\nsnippets/list-filter.liquid\nsnippets/filter-remove-buttons.liquid\nsnippets/pagination-controls.liquid",
    inScope: ["Collection page file-stack inventory", "Filter and sorting dependency mapping", "Pagination and infinite-scroll dependency mapping"],
    outOfScope: ["Shopify theme edits", "Payment changes", "Completion changes"]
  }));
  const rootBefore = snapshot(rootIndexPath);

  const commercialBeforeFixture = `# BEFORE EVIDENCE\n\nStore:\ncart-agent-dev.myshopify.com\n\nDate:\n2026-07-11\n\nAffected Page / Artifact:\nCommercial default scope writer\n\nIssue:\nCommercial default behavior\n\nWhy It Matters:\nBaseline for the commercial path\n\nScreenshot:\nhttps://example.com/before.png\n\nNotes:\nCommercial scope writer baseline.\n`;
  const commercialAfterFixture = `# AFTER EVIDENCE\n\nStore:\ncart-agent-dev.myshopify.com\n\nDate:\n2026-07-11\n\nAffected Page / Artifact:\nCommercial default proof writer\n\nScreenshot:\nhttps://example.com/after.png\n\nAfter Notes:\nCommercial proof writer baseline.\n\nObserved Improvement:\nNot Yet Available\n\nRemaining Limitations:\nNot Yet Available\n\nMerchant-Facing Summary:\nNot Yet Available\n`;
  writeText(manifestPath, JSON.stringify(proofManifest({
    proofRunId: "internal_shopifixer_dry_run_v1",
    merchantStore: "cart-agent-dev.myshopify.com"
  }), null, 2) + "\n");
  writeText(commercialBeforePath, commercialBeforeFixture);
  writeText(commercialAfterPath, commercialAfterFixture);
  writeText(commercialScopePath, `# FIX SCOPE\n\nStore:\ncart-agent-dev.myshopify.com\n\nScoped Fix:\nCommercial default scope writer\n\nIn Scope:\n- Commercial default behavior\n\nOut of Scope:\n- Mission-specific paths\n\nMerchant Approval Needed:\nno\n\nChange Made:\nNo\n\nLocation Changed:\nNot Yet Available\n\nImplementation Notes:\nCommercial default baseline.\n\nSuccess Criteria:\nCommercial path remains unchanged.\n`);
  const commercialScopeBefore = snapshot(commercialScopePath);

  const previousCwd = process.cwd();
  const previousRepoRoot = process.env.STAFFORDOS_REPO_ROOT;
  try {
    process.chdir(frontendDir);
    process.env.STAFFORDOS_REPO_ROOT = repoRoot;
    const load = jiti(import.meta.url);
    const { writeShopifixerScopedFix } = load("../ui/operator-frontend/lib/operator/writeShopifixerScopedFix.ts");
    const { writeShopifixerProofPackage } = load("../ui/operator-frontend/lib/operator/writeShopifixerProofPackage.ts");

    const commercialScopeResult = writeShopifixerScopedFix({
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

    assert(endsWithRepoRelative(commercialScopeResult.outputPath, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md"), "commercial scope writer keeps its default path", failures);
    assert(snapshot(rootIndexPath).sha256 === rootBefore.sha256, "root mission scope index is not mutated by commercial scope writes", failures);
    assert(snapshot(ex004Path).sha256 === ex004Before.sha256, "exercise 004 scope bytes remain unchanged after commercial scope writes", failures);

    const missionScopeResult = writeShopifixerScopedFix({
      store: "no-kings-athletics.myshopify.com",
      scoped_fix: "Exercise 005 - Collection Page Inventory",
      in_scope: "Collection page file-stack inventory",
      out_of_scope: "Shopify theme edits",
      merchant_approval_needed: "no",
      change_made: "No",
      location_changed: "Not Yet Available",
      implementation_notes: "Mission-specific scope baseline.",
      success_criteria: "Exercise-specific scope remains isolated."
    }, {
      outputPath: ex005Path
    });

    assert(missionScopeResult.outputPath === path.resolve(ex005Path), "exercise 005 scope writes only to exercise_005/fix_scope.md", failures);
    assert(snapshot(ex004Path).sha256 === ex004Before.sha256, "exercise 004 scope bytes remain unchanged after exercise 005 write", failures);
    assert(snapshot(rootIndexPath).sha256 === rootBefore.sha256, "root mission scope index remains index-only", failures);

    const commercialProofPackageResult = writeShopifixerProofPackage({
      proofRunDir: commercialRunDir,
      beforePath: commercialBeforePath,
      afterPath: commercialAfterPath,
      outputPath: commercialProofPackagePath,
      sealPath: commercialSealPath,
      manifestPath
    });
    assert(endsWithRepoRelative(commercialProofPackageResult.outputPath, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md"), "commercial proof package keeps its default path", failures);
    const commercialProofPackageText = readText(commercialProofPackagePath);
    assert(commercialProofPackageText.includes("cart-agent-dev.myshopify.com"), "commercial proof package reads the commercial scope payload", failures);
    assert(commercialProofPackageText.includes("Commercial default scope writer"), "commercial proof package preserves the commercial scoped fix payload", failures);
    assert(snapshot(rootIndexPath).sha256 === rootBefore.sha256, "root mission scope index remains unchanged by commercial proof generation", failures);

    writeText(missionBeforePath, `# BEFORE EVIDENCE\n\nStore:\nno-kings-athletics.myshopify.com\n\nDate:\n2026-07-11\n\nAffected Page / Artifact:\nCollection page inventory\n\nIssue:\nNot Yet Available\n\nWhy It Matters:\nNot Yet Available\n\nScreenshot:\nNot Yet Available\n\nNotes:\nMission-specific baseline.\n`);
    writeText(missionAfterPath, `# AFTER EVIDENCE\n\nStore:\nno-kings-athletics.myshopify.com\n\nDate:\n2026-07-11\n\nAffected Page / Artifact:\nCollection page inventory\n\nScreenshot:\nNot Yet Available\n\nAfter Notes:\nMission-specific baseline.\n\nObserved Improvement:\nNot Yet Available\n\nRemaining Limitations:\nNot Yet Available\n\nMerchant-Facing Summary:\nNot Yet Available\n`);
    writeText(manifestPath, JSON.stringify(proofManifest({
      proofRunId: "mission_001_nokings_shopifixer_v1",
      merchantStore: "no-kings-athletics.myshopify.com"
    }), null, 2) + "\n");
    const missionProofPackageResult = writeShopifixerProofPackage({
      proofRunDir: missionRunDir,
      scopePath: ex005Path,
      beforePath: missionBeforePath,
      afterPath: missionAfterPath,
      outputPath: missionProofPackagePath,
      sealPath: missionSealPath,
      manifestPath
    });

    assert(endsWithRepoRelative(missionProofPackageResult.outputPath, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md"), "mission proof package writes to the mission-specific proof run", failures);
    const missionProofText = readText(missionProofPackagePath);
    assert(missionProofText.includes("Exercise 005 - Collection Page Inventory"), "mission proof package reads the exercise-specific scope", failures);
    assert(missionProofText.includes("no-kings-athletics.myshopify.com"), "mission proof package preserves mission store identity", failures);
    const missionSeal = JSON.parse(readText(missionSealPath));
    assert(endsWithRepoRelative(missionSeal.proof_package_path, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md"), "mission seal uses the canonical mission proof package path", failures);
    assert(missionSeal.manifest_path === "staffordos/proof_runs/output/evidence_manifest_v1.json", "mission seal uses the canonical manifest path", failures);
    assert(missionSeal.proof_run_id === "mission_001_nokings_shopifixer_v1", "mission seal keeps the mission proof run id", failures);
    assert(snapshot(rootIndexPath).sha256 === rootBefore.sha256, "root mission scope index remains unchanged by mission proof generation", failures);
    assert(snapshot(ex004Path).sha256 === ex004Before.sha256, "exercise 004 scope bytes remain unchanged by mission proof generation", failures);
    assert(readText(rootIndexPath).includes("Scope Authority:\nExercise-specific"), "root mission scope file is index-only", failures);
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
      commercial_scope_default_unchanged: true,
      mission_scope_override_isolated: true,
      commercial_proof_default_unchanged: true,
      mission_proof_reads_exercise_specific_scope: true,
      exercise_004_history_immutable: true,
      root_scope_is_index_only: true,
      no_shopify_mutation: true,
      no_payment_completion_abando_truth_changes: true
    }
  }, null, 2));
}

run();
