import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { evaluateNokingsMissionReadiness } from "./evaluate_nokings_mission_001_readiness_v1.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const BINDING_PATH = path.join(REPO_ROOT, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json");
const PROOF_RUN_DIR = path.join(REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1");
const READINESS_OUTPUT_PATH = path.join(MODULE_DIR, "output", "nokings_mission_001_readiness_v1.json");

function readText(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  } catch {
    return "";
  }
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, "utf8");
}

function snapshot(paths) {
  const out = {};
  for (const rel of paths) {
    const abs = path.join(REPO_ROOT, rel);
    const text = readText(abs);
    out[rel] = {
      exists: fs.existsSync(abs),
      size: Buffer.byteLength(text, "utf8"),
      sha256: crypto.createHash("sha256").update(text, "utf8").digest("hex")
    };
  }
  return out;
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function scopeContent({
  exercise,
  objective,
  targetArtifact,
  inScope,
  outOfScope,
  status = "Complete"
}) {
  return `# Fix Scope

Status:
${status}

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

function scopeIndex(activeExercise, extraPayload = "") {
  return `# Mission Scope Index

Status:
Deprecated

Mission:
Mission 001 - NoKings Shopify Engineering Training

Active Exercise:
${activeExercise}

Exercise 004 Scope Path:
staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/fix_scope.md

Exercise 005 Scope Path:
staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/fix_scope.md

Scope Authority:
Exercise-specific

Notes:
- Do not write scope content directly here.
- Do not treat this file as authoritative scope payload.
- ${activeExercise} is the governed active exercise.
${extraPayload ? `\n${extraPayload}\n` : ""}
`;
}

function certificationMemo({
  exercise = "Exercise 004 - Product Page Inventory",
  canonicalStore = "no-kings-athletics.myshopify.com",
  decision = "CONDITIONAL GO",
  recommendation = "Exercise 005 - Collection Page Inventory"
} = {}) {
  return `# Mission 001 Exercise 004 Certification

## Mission
- Mission ID: \`mission_001\`
- Mission: \`Mission 001 - NoKings Shopify Engineering Training\`
- Exercise: \`${exercise}\`
- Merchant: \`NoKings Athletics\`
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

## Recommendation for Exercise 005
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
- No Shopify mutation occurred.
- The generic cart-agent-dev ShopiFixer pilot remains unchanged.
- Abando authority remains unchanged.

`;
}

function exercise005CertificationMemo({
  exercise = "Exercise 005 - Collection Page Inventory",
  canonicalStore = "no-kings-athletics.myshopify.com",
  decision = "CONDITIONAL GO"
} = {}) {
  return `# Mission 001 Exercise 005 Certification

## Identity
- Mission ID: \`mission_001\`
- Mission: \`Mission 001 - NoKings Shopify Engineering Training\`
- Exercise ID: \`exercise_005\`
- Exercise: \`${exercise}\`
- Merchant: \`NoKings Athletics\`
- Canonical store: \`${canonicalStore}\`
- Product: \`ShopiFixer\`
- Environment type: \`controlled_training\`
- Authority mode: \`analysis-only\`
- Payment required: \`false\`

## Evidence Chain Verification
- Exercise-specific scope, before evidence, execution notes, after evidence, and mission proof package were reviewed.
- No mission-root payload file was used as active authority.

## Collection Architecture Certified
- Collection JSON template entry point: \`templates/collection.json\`
- Product-grid flow, product-card hierarchy, filter/sort architecture, grid-density controls, and pagination behavior were certified from repository-backed evidence.

## Repository Truth Reviewed
- Mission binding
- Exercise 005 scope
- Exercise 005 before evidence
- Exercise 005 execution notes
- Exercise 005 after evidence
- Exercise 005 mission proof package

## Unsupported Claims Explicitly Excluded
- Storefront improvement
- Conversion improvement
- Revenue impact
- Runtime filter configuration
- Runtime quick-add state
- Runtime app-block behavior

## Mutation And Rollback Assessment
- Shopify mutations performed: None
- Shopify rollback required: No

## Readiness Assessment
- Current phase before certification: \`mission_certification\`
- Next phase after certification: \`exercise_006_planning\`

## Next Canonical Exercise
- Exercise ID: \`ex_006_cart_inventory\`
- Exercise: \`Exercise 006 - Cart Inventory\`
- Objective: identify the cart files that affect trust, totals, and checkout readiness.

## Certification Decision
**${decision}**

## Confirmation
- No Shopify mutation occurred.
- Exercise 005 is closed.
- Mission 001 remains active.

`;
}

function writeFixture({
  root,
  binding,
  activeExercise,
  scope004,
  scope005,
  rootPayload = "",
  includeBefore = false,
  includeAfter = false,
  includeExecution = false,
  includeProof = false,
  certification = ""
}) {
  const missionDir = path.join(root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1");
  const exercisesDir = path.join(missionDir, "exercises");
  const activeExerciseSlug = /Exercise 004 - Product Page Inventory/i.test(activeExercise)
    ? "exercise_004"
    : /Exercise 005 - Collection Page Inventory/i.test(activeExercise)
      ? "exercise_005"
      : "";
  const activeExerciseDir = activeExerciseSlug ? path.join(exercisesDir, activeExerciseSlug) : missionDir;
  fs.mkdirSync(path.join(exercisesDir, "exercise_004"), { recursive: true });
  fs.mkdirSync(path.join(exercisesDir, "exercise_005"), { recursive: true });
  writeText(path.join(root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"), `${JSON.stringify(binding, null, 2)}\n`);
  writeText(path.join(missionDir, "fix_scope.md"), scopeIndex(activeExercise, rootPayload));
  writeText(path.join(missionDir, "before_evidence.md"), `# Before Evidence Index\n\nStatus:\nDeprecated\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nActive Exercise:\n${activeExercise}\n\nExercise 004 Before Evidence Path:\nstaffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/before_evidence.md\n\nExercise 005 Before Evidence Path:\nstaffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md\n\nPayload Authority:\nExercise-specific\n\nNotes:\n- Do not write evidence content directly here.\n- Do not treat this file as authoritative evidence payload.\n`);
  writeText(path.join(missionDir, "execution_notes.md"), `# Execution Notes Index\n\nStatus:\nDeprecated\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nActive Exercise:\n${activeExercise}\n\nExercise 004 Execution Notes Path:\nstaffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/execution_notes.md\n\nExercise 005 Execution Notes Path:\nstaffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/execution_notes.md\n\nPayload Authority:\nExercise-specific\n\nNotes:\n- Do not write analysis content directly here.\n- Do not treat this file as authoritative execution payload.\n`);
  writeText(path.join(missionDir, "after_evidence.md"), `# After Evidence Index\n\nStatus:\nDeprecated\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nActive Exercise:\n${activeExercise}\n\nExercise 004 After Evidence Path:\nstaffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/after_evidence.md\n\nExercise 005 After Evidence Path:\nstaffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/after_evidence.md\n\nPayload Authority:\nExercise-specific\n\nNotes:\n- Do not write evidence content directly here.\n- Do not treat this file as authoritative evidence payload.\n`);
  writeText(path.join(missionDir, "mission_proof_package.md"), `# Mission Proof Package Index\n\nStatus:\nDeprecated\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nActive Exercise:\n${activeExercise}\n\nExercise 004 Proof Package Path:\nstaffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/mission_proof_package.md\n\nExercise 005 Proof Package Path:\nstaffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md\n\nPayload Authority:\nExercise-specific\n\nNotes:\n- Do not write proof content directly here.\n- Do not treat this file as authoritative proof payload.\n`);
  if (scope004 !== null) {
    writeText(path.join(exercisesDir, "exercise_004/fix_scope.md"), scope004);
  }
  if (scope005 !== null) {
    writeText(path.join(exercisesDir, "exercise_005/fix_scope.md"), scope005);
  }
  if (includeBefore) {
    writeText(path.join(activeExerciseDir, "before_evidence.md"), `# Before Evidence\n\nStatus:\nComplete\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\n${activeExercise}\n\nStore:\nno-kings-athletics.myshopify.com\n\nAffected Page / Artifact:\nNot Yet Available\n\nIssue:\nNot Yet Available\n\nWhy It Matters:\nNot Yet Available\n\nScreenshot:\nNot Yet Available\n\nNotes:\n- Controlled training baseline only.\n`);
  }
  if (includeExecution) {
    writeText(path.join(activeExerciseDir, "execution_notes.md"), `# Execution Notes\n\nStatus:\nComplete\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\n${activeExercise}\n\nStore:\nno-kings-athletics.myshopify.com\n\nTarget Files:\n- ${activeExercise === "Exercise 005 - Collection Page Inventory" ? "templates/collection.json" : "templates/product.json"}\n\nNotes:\n- Controlled training inventory only.\n- No Shopify mutation occurred.\n`);
  }
  if (includeAfter) {
    const affectedPage = activeExercise === "Exercise 005 - Collection Page Inventory"
      ? "Collection page inventory completion evidence"
      : "Product page inventory completion evidence";
    const issue = activeExercise === "Exercise 005 - Collection Page Inventory"
      ? "Collection page inventory completed from repository-backed source files."
      : "Product page inventory completed from repository-backed source files.";
    const notes = activeExercise === "Exercise 005 - Collection Page Inventory"
      ? "- Collection page after evidence only.\n- No Shopify mutation occurred."
      : "- Product page after evidence only.\n- No Shopify mutation occurred.";
    writeText(path.join(activeExerciseDir, "after_evidence.md"), `# After Evidence\n\nStatus:\nComplete\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\n${activeExercise}\n\nStore:\nno-kings-athletics.myshopify.com\n\nAffected Page / Artifact:\n${affectedPage}\n\nIssue:\n${issue}\n\nObserved Improvement:\nNot Claimed\n\nMerchant-Facing Summary:\nNot Claimed\n\nRemaining Limitations:\nNot Yet Available\n\nScreenshot:\nNot Yet Available\n\nNotes:\n${notes}\n`);
  }
  if (includeProof) {
    writeText(path.join(activeExerciseDir, "mission_proof_package.md"), `# Mission Proof Package\n\nStatus:\nAssembled\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\n${activeExercise}\n\nStore:\nno-kings-athletics.myshopify.com\n\nProof Run ID:\nmission_001_nokings_shopifixer_v1\n\nProof Package Version:\nv1\n\nGenerated At:\n2026-07-11T00:00:00.000Z\n\nManifest Path:\nNot Yet Available\n\nEvidence Source Paths:\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/${activeExerciseSlug}/fix_scope.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/${activeExerciseSlug}/before_evidence.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/${activeExerciseSlug}/after_evidence.md\n- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/${activeExerciseSlug}/execution_notes.md\n\nSeal Status:\nNot Yet Available\n\nNotes:\n- Mission proof package scaffold only.\n`);
  }
  if (certification) {
    writeText(path.join(root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md"), certification);
  }
}

function runReadiness(root) {
  const outputPath = path.join(root, "readiness.json");
  return evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
}

function run() {
  const failures = [];
  const productionBefore = snapshot([
    "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json",
    "staffordos/clients/shopifixer_offer_latest.json",
    "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/before_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/after_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/execution_notes.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md",
    "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md",
    "staffordos/implementation/p11_7_mission_001_exercise_005_certification_v1.md",
    "staffordos/ui/operator-frontend/app/operator/shopifixer-pilot/page.tsx",
    "staffordos/ui/operator-frontend/components/operator/ShopifixerPilotWorkspace.tsx"
  ]);

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-nokings-binding-"));
  const repoBinding = JSON.parse(fs.readFileSync(BINDING_PATH, "utf8"));
  const validCertification = certificationMemo();

  // Root file is only an index. A stale payload in the root must not satisfy scope authority.
  writeFixture({
    root: tmpRoot,
    binding: repoBinding,
    activeExercise: "Exercise 005 - Collection Page Inventory",
    scope004: scopeContent({
      exercise: "Exercise 004 - Product Page Inventory",
      objective: "The governed training objective is to inventory the NoKings product page architecture.",
      targetArtifact: "templates/product.json\nsections/product-information.liquid\nsnippets/product-media-gallery-content.liquid\nsnippets/add-to-cart-button.liquid",
      inScope: ["Product page file-stack inventory", "Product media dependency mapping"],
      outOfScope: ["Shopify theme edits", "Payment changes", "Completion changes"]
    }),
    scope005: null,
    rootPayload: scopeContent({
      exercise: "Exercise 004 - Product Page Inventory",
      objective: "The governed training objective is to inventory the NoKings product page architecture.",
      targetArtifact: "templates/product.json\nsections/product-information.liquid\nsnippets/product-media-gallery-content.liquid\nsnippets/add-to-cart-button.liquid",
      inScope: ["Product page file-stack inventory", "Product media dependency mapping"],
      outOfScope: ["Shopify theme edits", "Payment changes", "Completion changes"]
    })
  });
  let report = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(tmpRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(tmpRoot, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(tmpRoot, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
  assert(report.current_phase === "scope", "root file is not treated as canonical scope authority", failures);
  assert(report.current_blocker === "Active exercise scope missing", "missing active exercise scope is blocked", failures);
  assert(report.gates.scope.status === "blocked", "scope gate blocks when active exercise scope is missing", failures);

  const exercise004Root = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-nokings-ex004-"));
  writeFixture({
    root: exercise004Root,
    binding: repoBinding,
    activeExercise: "Exercise 004 - Product Page Inventory",
    scope004: scopeContent({
      exercise: "Exercise 004 - Product Page Inventory",
      objective: "The governed training objective is to map the NoKings product page file stack and media / CTA dependencies before any reversible implementation is considered.",
      targetArtifact: "templates/product.json\nsections/product-information.liquid\nsnippets/product-media-gallery-content.liquid\nsnippets/add-to-cart-button.liquid",
      inScope: ["Product page file-stack inventory", "Product media dependency mapping", "Product CTA dependency mapping"],
      outOfScope: ["Shopify theme edits", "Payment changes", "Completion changes"]
    }),
    scope005: null,
    certification: validCertification
  });
  report = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(exercise004Root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(exercise004Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(exercise004Root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
  assert(report.current_phase === "before_evidence", "exercise 004 resolves only to its own scope", failures);
  assert(report.gates.scope.status === "pass", "exercise 004 scope passes from its own file", failures);
  assert(report.current_blocker === "Before Evidence Missing", "exercise 004 next blocker is before evidence", failures);
  assert(report.next_safe_action === "Capture Before Evidence", "exercise 004 next safe action is capture before evidence", failures);

  writeText(path.join(exercise004Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/fix_scope.md"), scopeContent({
    exercise: "Exercise 005 - Collection Page Inventory",
    objective: "The governed training objective is to inventory the NoKings collection page architecture.",
    targetArtifact: "templates/collection.json\nsections/main-collection.liquid\nsections/collection-list.liquid\nsnippets/product-grid.liquid",
    inScope: ["Collection page file-stack inventory", "Filter and sorting dependency mapping"],
    outOfScope: ["Shopify theme edits", "Payment changes", "Completion changes"]
  }));
  const ex004AfterEx005 = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(exercise004Root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(exercise004Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(exercise004Root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
  assert(ex004AfterEx005.current_phase === "before_evidence", "exercise 005 cannot overwrite exercise 004", failures);
  assert(ex004AfterEx005.gates.scope.status === "pass", "exercise 005 content in the other file does not disturb exercise 004", failures);

  const exercise005Root = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-nokings-ex005-"));
  writeFixture({
    root: exercise005Root,
    binding: repoBinding,
    activeExercise: "Exercise 005 - Collection Page Inventory",
    scope004: scopeContent({
      exercise: "Exercise 004 - Product Page Inventory",
      objective: "The governed training objective is to map the NoKings product page file stack and media / CTA dependencies before any reversible implementation is considered.",
      targetArtifact: "templates/product.json\nsections/product-information.liquid\nsnippets/product-media-gallery-content.liquid\nsnippets/add-to-cart-button.liquid",
      inScope: ["Product page file-stack inventory", "Product media dependency mapping"],
      outOfScope: ["Shopify theme edits", "Payment changes", "Completion changes"]
    }),
    scope005: scopeContent({
      exercise: "Exercise 005 - Collection Page Inventory",
      objective: "The governed training objective is to map the NoKings collection page file stack and its filtering, sorting, grid, pagination, and product-card dependencies.",
      targetArtifact: "templates/collection.json\nsections/main-collection.liquid\nsections/collection-list.liquid\nsnippets/product-grid.liquid\nsnippets/product-card.liquid\nsnippets/collection-card.liquid\nsnippets/list-filter.liquid\nsnippets/filter-remove-buttons.liquid\nsnippets/pagination-controls.liquid",
      inScope: ["Collection page file-stack inventory", "Filter and sorting dependency mapping", "Pagination and infinite-scroll dependency mapping"],
      outOfScope: ["Shopify theme edits", "Payment changes", "Completion changes"]
    }),
    certification: validCertification
  });
  report = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(exercise005Root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(exercise005Root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
  assert(report.current_phase === "before_evidence", "exercise 005 resolves only to its own scope", failures);
  assert(report.gates.scope.status === "pass", "exercise 005 scope passes from its own file", failures);

  writeText(path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md"), `# Before Evidence\n\nStatus:\nComplete\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\nExercise 005 - Collection Page Inventory\n\nStore:\nno-kings-athletics.myshopify.com\n\nAffected Page / Artifact:\nCollection page source baseline\n\nIssue:\nCollection page inventory has not yet been performed.\n\nWhy It Matters:\nThe collection page architecture must be inventoried before after evidence can proceed.\n\nScreenshot:\nNot Yet Proven\n\nNotes:\n- Collection page baseline only.\n`);
  const missingInventoryReport = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(exercise005Root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(exercise005Root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
  assert(missingInventoryReport.current_phase === "collection_page_inventory", "missing exercise 005 inventory remains blocked at collection_page_inventory", failures);
  assert(missingInventoryReport.current_blocker === "Collection Page Inventory Not Performed", "missing exercise 005 inventory blocker is explicit", failures);
  assert(missingInventoryReport.next_safe_action === "Perform governed read-only collection page inventory", "missing exercise 005 inventory next action is inventory", failures);
  assert(missingInventoryReport.gates.execution.status === "blocked", "execution gate blocks until exercise 005 inventory is performed", failures);

  writeText(path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/execution_notes.md"), `# Execution Notes\n\nStatus:\nComplete\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\nExercise 004 - Product Page Inventory\n\nStore:\nno-kings-athletics.myshopify.com\n\nObjective:\nProduct page inventory only.\n\nNotes:\n- Wrong exercise inventory.\n`);
  const wrongInventoryReport = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(exercise005Root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(exercise005Root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
  assert(wrongInventoryReport.current_phase === "collection_page_inventory", "wrong exercise inventory is rejected for exercise 005", failures);
  assert(wrongInventoryReport.current_blocker === "Collection Page Inventory Not Performed", "wrong exercise inventory keeps the collection blocker", failures);

  writeText(path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/execution_notes.md"), `# Execution Notes\n\nStatus:\nComplete\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\nExercise 005 - Collection Page Inventory\n\nStore:\nno-kings-athletics.myshopify.com\n\nObjective:\nCollection page inventory from repository-backed source files.\n\nAffected Page / Artifact:\nCollection page inventory\n\nNotes:\n- Collection page file stack, filters, sorting, pagination, and product-card dependencies inventoried.\n- No Shopify mutation occurred.\n`);
  const completedInventoryReport = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(exercise005Root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(exercise005Root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
  assert(completedInventoryReport.current_phase === "after_evidence", "completed exercise 005 inventory advances to after_evidence", failures);
  assert(completedInventoryReport.current_blocker === "After Evidence Missing", "completed exercise 005 inventory exposes the after evidence blocker", failures);
  assert(completedInventoryReport.next_safe_action === "Capture After Evidence", "completed exercise 005 inventory next action is after evidence", failures);
  assert(completedInventoryReport.gates.execution.status === "pass", "execution gate passes when exercise 005 inventory is valid", failures);

  writeText(path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/after_evidence.md"), `# After Evidence\n\nStatus:\nComplete\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise:\nExercise 005 - Collection Page Inventory\n\nStore:\nno-kings-athletics.myshopify.com\n\nAffected Page / Artifact:\nCollection page inventory completion evidence\n\nIssue:\nCollection page inventory completed from repository-backed Exercise 005 artifacts.\n\nObserved Improvement:\nNot Claimed\n\nMerchant-Facing Summary:\nNot Claimed\n\nRemaining Limitations:\n- Runtime storefront behavior is Not Yet Proven.\n\nScreenshot:\nNot Yet Available\n\nNotes:\n- Collection page after evidence only.\n- No Shopify mutation occurred.\n`);
  const completedAfterEvidenceReport = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(exercise005Root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(exercise005Root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
  assert(completedAfterEvidenceReport.current_phase === "proof_package", "completed exercise 005 after evidence advances to proof_package", failures);
  assert(completedAfterEvidenceReport.current_blocker === "Proof Package Missing", "completed exercise 005 after evidence exposes the proof package blocker", failures);
  assert(completedAfterEvidenceReport.next_safe_action === "Generate Exercise 005 Mission Proof Package", "completed exercise 005 after evidence next action is proof package generation", failures);
  assert(completedAfterEvidenceReport.gates.after_evidence.status === "pass", "after evidence gate passes when exercise 005 after evidence is valid", failures);
  assert(completedAfterEvidenceReport.gates.proof.status === "blocked", "proof gate blocks until exercise 005 proof package is generated", failures);

  writeText(path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md"), `# Mission Proof Package\n\nStatus:\nComplete\n\nMission ID:\nmission_001\n\nMission:\nMission 001 - NoKings Shopify Engineering Training\n\nExercise ID:\nexercise_005\n\nExercise:\nExercise 005 - Collection Page Inventory\n\nMerchant:\nNoKings Athletics\n\nStore:\nno-kings-athletics.myshopify.com\n\nObjective:\nCollection page inventory proof package from exercise-specific artifacts.\n\nNotes:\n- Collection page proof package only.\n- No Shopify mutation occurred.\n`);
  const completedProofPackageReport = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(exercise005Root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(exercise005Root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md"),
    exercise005CertificationMemoPath: path.join(exercise005Root, "staffordos/implementation/p11_7_mission_001_exercise_005_certification_v1.md")
  });
  assert(completedProofPackageReport.current_phase === "mission_certification", "completed exercise 005 proof package advances to mission_certification", failures);
  assert(completedProofPackageReport.current_blocker === "Mission Certification Missing", "completed exercise 005 proof package exposes the certification blocker", failures);
  assert(completedProofPackageReport.next_safe_action === "Certify Exercise 005", "completed exercise 005 proof package next action is certification", failures);
  assert(completedProofPackageReport.gates.proof.status === "pass", "proof gate passes when exercise 005 proof package is valid", failures);
  assert(completedProofPackageReport.gates.mission_certification.status === "blocked", "mission certification remains blocked until Exercise 005 is certified", failures);

  writeText(path.join(exercise005Root, "staffordos/implementation/p11_7_mission_001_exercise_005_certification_v1.md"), exercise005CertificationMemo());
  const completedCertificationReport = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(exercise005Root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(exercise005Root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md"),
    exercise005CertificationMemoPath: path.join(exercise005Root, "staffordos/implementation/p11_7_mission_001_exercise_005_certification_v1.md")
  });
  assert(completedCertificationReport.current_phase === "exercise_006_planning", "valid exercise 005 certification advances to exercise_006_planning", failures);
  assert(completedCertificationReport.current_blocker === "Exercise 006 Planning Missing", "valid exercise 005 certification exposes exercise 006 planning blocker", failures);
  assert(completedCertificationReport.next_safe_action === "Plan Exercise 006 - Cart Inventory", "valid exercise 005 certification next action is Exercise 006 planning", failures);
  assert(completedCertificationReport.gates.mission_certification.status === "pass", "mission certification gate passes when Exercise 005 certification is valid", failures);
  assert(completedCertificationReport.gates.exercise_006_planning.status === "blocked", "Exercise 006 planning remains blocked until planning begins", failures);

  writeText(path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/fix_scope.md"), scopeContent({
    exercise: "Exercise 004 - Product Page Inventory",
    objective: "The governed training objective is to map the NoKings product page file stack and media / CTA dependencies before any reversible implementation is considered.",
    targetArtifact: "templates/product.json\nsections/product-information.liquid\nsnippets/product-media-gallery-content.liquid\nsnippets/add-to-cart-button.liquid",
    inScope: ["Product page file-stack inventory", "Product media dependency mapping"],
    outOfScope: ["Shopify theme edits", "Payment changes", "Completion changes"]
  }));
  const wrongScopeFor005 = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(exercise005Root, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(exercise005Root, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(exercise005Root, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
  assert(wrongScopeFor005.current_phase === "scope", "wrong exercise scope is rejected", failures);
  assert(wrongScopeFor005.current_blocker === "Active exercise scope rejected", "wrong exercise scope rejection is explicit", failures);

  const cartAgentDevBindingRoot = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-nokings-cart-agent-"));
  writeFixture({
    root: cartAgentDevBindingRoot,
    binding: {
      ...repoBinding,
      canonical_store_domain: "cart-agent-dev.myshopify.com",
      merchant: {
        ...repoBinding.merchant,
        client_id: "cart-agent-dev.myshopify.com",
        store_domain: "cart-agent-dev.myshopify.com"
      }
    },
    activeExercise: "Exercise 005 - Collection Page Inventory",
    scope004: null,
    scope005: scopeContent({
      exercise: "Exercise 005 - Collection Page Inventory",
      objective: "The governed training objective is to map the NoKings collection page file stack and its filtering, sorting, grid, pagination, and product-card dependencies.",
      targetArtifact: "templates/collection.json\nsections/main-collection.liquid\nsections/collection-list.liquid\nsnippets/product-grid.liquid\nsnippets/product-card.liquid\nsnippets/collection-card.liquid\nsnippets/list-filter.liquid\nsnippets/filter-remove-buttons.liquid\nsnippets/pagination-controls.liquid",
      inScope: ["Collection page file-stack inventory", "Filter and sorting dependency mapping"],
      outOfScope: ["Shopify theme edits", "Payment changes", "Completion changes"]
    }),
    certification: validCertification
  });
  const cartAgentDevReport = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: path.join(cartAgentDevBindingRoot, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json"),
    proofRunDir: path.join(cartAgentDevBindingRoot, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1"),
    certificationMemoPath: path.join(cartAgentDevBindingRoot, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
  assert(cartAgentDevReport.current_phase === "merchant_binding", "cart-agent-dev is rejected at merchant binding", failures);

  const productionAfter = snapshot([
    "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json",
    "staffordos/clients/shopifixer_offer_latest.json",
    "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/fix_scope.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/before_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/after_evidence.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/execution_notes.md",
    "staffordos/proof_runs/mission_001_nokings_shopifixer_v1/mission_proof_package.md",
    "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md",
    "staffordos/implementation/p11_7_mission_001_exercise_005_certification_v1.md",
    "staffordos/ui/operator-frontend/app/operator/shopifixer-pilot/page.tsx",
    "staffordos/ui/operator-frontend/components/operator/ShopifixerPilotWorkspace.tsx"
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

  const actualReport = evaluateNokingsMissionReadiness({
    repoRoot: REPO_ROOT,
    bindingPath: BINDING_PATH,
    proofRunDir: PROOF_RUN_DIR,
    certificationMemoPath: path.join(REPO_ROOT, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md")
  });
  assert(actualReport.status === "CONDITIONAL_GO", "current readiness status remains CONDITIONAL_GO", failures);
  assert(actualReport.active_exercise === "Exercise 005 - Collection Page Inventory", "active exercise is Exercise 005", failures);
  assert(actualReport.current_phase === "exercise_006_planning", "current phase is exercise_006_planning", failures);
  assert(actualReport.current_blocker === "Exercise 006 Planning Missing", "current blocker is Exercise 006 Planning Missing", failures);
  assert(actualReport.next_safe_action === "Plan Exercise 006 - Cart Inventory", "next safe action is Plan Exercise 006 - Cart Inventory", failures);
  assert(actualReport.payment_required === false, "payment_required remains false", failures);
  assert(actualReport.completion_permitted === false, "completion remains prohibited", failures);
  assert(actualReport.gates.scope.status === "pass", "scope remains complete", failures);
  assert(actualReport.gates.before_evidence.status === "pass", "before evidence is complete", failures);
  assert(actualReport.gates.execution.status === "pass", "collection inventory gate passes after the inventory is performed", failures);
  assert(actualReport.gates.after_evidence.status === "pass", "after evidence is complete after P11.5", failures);
  assert(actualReport.gates.proof.status === "pass", "proof package is complete after P11.6", failures);
  assert(actualReport.gates.mission_certification.status === "pass", "mission certification passes after Exercise 005 certification", failures);
  assert(actualReport.gates.exercise_006_planning.status === "blocked", "Exercise 006 planning is the next blocker", failures);

  if (failures.length) {
    console.error(JSON.stringify({ status: "failed", failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: "passed",
    checks: {
      evaluator_read_only: true,
      exercise_004_scope_isolated: true,
      exercise_005_scope_isolated: true,
      root_fix_scope_is_not_canonical: true,
      missing_active_scope_blocked: true,
      wrong_exercise_scope_rejected: true,
      cart_agent_dev_rejected: true,
      production_truth_unchanged: true,
      generic_pilot_unchanged: true,
      abando_unchanged: true,
      current_readiness_correct: true
    }
  }, null, 2));
}

run();
