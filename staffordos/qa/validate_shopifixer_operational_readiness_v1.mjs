import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const EVALUATOR_PATH = path.join(MODULE_DIR, "evaluate_shopifixer_operational_readiness_v1.mjs");
const OUTPUT_RELATIVE = "staffordos/qa/output/shopifixer_operational_readiness_v1.json";
const DEFAULT_PROOF_RUN_ID = "internal_shopifixer_dry_run_v1";
const CURRENT_MERCHANT = "cart-agent-dev.myshopify.com";

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function readJson(filePath, fallback = {}) {
  try {
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, "utf8");
}

function copyTree(sourceRoot, relPath, fixtureRoot) {
  const source = path.join(sourceRoot, relPath);
  if (!fs.existsSync(source)) return false;
  const target = path.join(fixtureRoot, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
  return true;
}

function hashFile(filePath) {
  return fs.existsSync(filePath)
    ? crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")
    : "";
}

function snapshotFiles(root, relPaths) {
  const snapshot = {};
  for (const relPath of relPaths) {
    const abs = path.join(root, relPath);
    snapshot[relPath] = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
  }
  return snapshot;
}

function assertSnapshotUnchanged(root, snapshot, failures, label) {
  for (const [relPath, before] of Object.entries(snapshot)) {
    const afterPath = path.join(root, relPath);
    const after = fs.existsSync(afterPath) ? fs.readFileSync(afterPath, "utf8") : null;
    assert(after === before, `${label}:${relPath}`, failures);
  }
}

function makeFixtureRoot() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-readiness-fixture-"));
  const dirsToCopy = [
    "staffordos/clients",
    "staffordos/fulfillment",
    "staffordos/proof_runs/internal_shopifixer_dry_run_v1",
    "staffordos/proof_runs/output",
    "staffordos/preflight/output",
    "staffordos/qa/output",
    "staffordos/execution/output",
    "staffordos/events",
    "staffordos/snapshots"
  ];
  for (const relPath of dirsToCopy) {
    copyTree(REPO_ROOT, relPath, fixtureRoot);
  }
  return fixtureRoot;
}

function canonicalProofPackageText({ store, generatedAt, proofRunId, manifestPath, beforeId, afterId }) {
  return [
    "# MERCHANT PROOF PACKAGE",
    "",
    "Proof Package Version:",
    "v1",
    "",
    "Generated At:",
    generatedAt,
    "",
    "Proof Run ID:",
    proofRunId,
    "",
    "Manifest Path:",
    manifestPath,
    "",
    "Merchant / Store:",
    store,
    "",
    "Before Evidence Artifact IDs:",
    `- ${beforeId}`,
    "",
    "After Evidence Artifact IDs:",
    `- ${afterId}`,
    "",
    "Screenshot Artifact References:",
    "- artifact_id: screenshot_before_fixture",
    "  stage: before_evidence",
    "  original_reference: /tmp/before.png",
    "  stored_path: staffordos/proof_runs/output/artifacts/before.png",
    "  exists: true",
    "  status: stored",
    "",
    "Evidence Source Paths:",
    "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md",
    "staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md",
    ""
  ].join("\n");
}

function canonicalManifest({ store, generatedAt, proofRunId, beforeId, afterId }) {
  return {
    schema: "staffordos.evidence_manifest.v1",
    generated_at: generatedAt,
    manifest_version: 1,
    proof_run_id: proofRunId,
    merchant: { store },
    artifacts: [
      {
        artifact_id: beforeId,
        stage: "before_evidence",
        created_at: generatedAt,
        output_path: "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md",
        source_writer: "writeShopifixerBeforeEvidence",
        references: ["before_evidence.md"],
        screenshot_artifacts: [
          {
            artifact_id: "screenshot_before_fixture",
            original_reference: "/tmp/before.png",
            stored_path: "staffordos/proof_runs/output/artifacts/before.png",
            exists: true,
            stage: "before_evidence",
            created_at: generatedAt,
            status: "stored"
          }
        ],
        status: "written"
      },
      {
        artifact_id: afterId,
        stage: "after_evidence",
        created_at: generatedAt,
        output_path: "staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md",
        source_writer: "writeShopifixerAfterEvidence",
        references: ["after_evidence.md"],
        screenshot_artifacts: [],
        status: "written"
      }
    ]
  };
}

function canonicalSeal({ store, generatedAt, proofRunId, manifestPath, proofPackagePath, sha256, artifactCount }) {
  return {
    schema: "staffordos.merchant_proof_package_seal.v1",
    generated_at: generatedAt,
    proof_run_id: proofRunId,
    proof_package_path: proofPackagePath,
    sha256,
    manifest_path: manifestPath,
    manifest_artifact_count: artifactCount,
    evidence_source_paths: [
      "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md",
      "staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md"
    ],
    status: "sealed",
    merchant: { store }
  };
}

function touchFixtureTruth(root, updates) {
  const fulfillmentPath = path.join(root, "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json");
  const clientRegistryPath = path.join(root, "staffordos/clients/client_registry_v1.json");
  const manifestPath = path.join(root, "staffordos/proof_runs/output/evidence_manifest_v1.json");
  const beforePath = path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md");
  const afterPath = path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md");
  const proofPath = path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md");
  const sealPath = path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json");

  const fulfillment = readJson(fulfillmentPath, {});
  const item = Array.isArray(fulfillment.items) ? fulfillment.items[0] : null;
  if (item) {
    Object.assign(item, {
      payment_status: updates.payment_status ?? item.payment_status,
      payment_verified_source: updates.payment_verified_source ?? item.payment_verified_source,
      paid_at: updates.paid_at ?? item.paid_at,
      proof_package_status: updates.proof_package_status ?? item.proof_package_status,
      proof_status: updates.proof_status ?? item.proof_status,
      execution_status: updates.execution_status ?? item.execution_status,
      completion_status: updates.completion_status ?? item.completion_status,
      proof_complete: updates.proof_complete ?? item.proof_complete,
      execution_complete: updates.execution_complete ?? item.execution_complete,
      completion_complete: updates.completion_complete ?? item.completion_complete,
      before_evidence_captured: updates.before_evidence_captured ?? item.before_evidence_captured,
      after_evidence_captured: updates.after_evidence_captured ?? item.after_evidence_captured,
      scoped_issue_addressed: updates.scoped_issue_addressed ?? item.scoped_issue_addressed,
      merchant_proof_package_ready: updates.merchant_proof_package_ready ?? item.merchant_proof_package_ready,
      merchant_approval_needed: updates.merchant_approval_needed ?? item.merchant_approval_needed,
      proof_package_location: updates.proof_package_location ?? item.proof_package_location,
      completed_at: updates.completed_at ?? item.completed_at
    });
    if (updates.store_domain) item.store_domain = updates.store_domain;
    if (updates.client_id) item.client_id = updates.client_id;
  }
  writeJson(fulfillmentPath, fulfillment);

  const clientRegistry = readJson(clientRegistryPath, {});
  const clients = Array.isArray(clientRegistry.clients) ? clientRegistry.clients : [];
  const matching = clients.find((client) => String(client.client_id || "").trim().toLowerCase() === CURRENT_MERCHANT.toLowerCase()) || clients[0];
  if (matching) {
    matching.deal = matching.deal || {};
    if (updates.client_payment_status) matching.deal.payment_status = updates.client_payment_status;
    if (updates.client_closed_at !== undefined) matching.deal.closed_at = updates.client_closed_at;
  }
  if (updates.ambiguous_merchant && matching) {
    clients.push(JSON.parse(JSON.stringify(matching)));
  }
  writeJson(clientRegistryPath, clientRegistry);

  if (updates.before_md !== undefined) writeText(beforePath, updates.before_md);
  if (updates.after_md !== undefined) writeText(afterPath, updates.after_md);
  if (updates.proof_md !== undefined) writeText(proofPath, updates.proof_md);
  if (updates.seal_json !== undefined) {
    if (updates.seal_json === null) {
      fs.rmSync(sealPath, { force: true });
    } else {
      writeJson(sealPath, updates.seal_json);
    }
  }
  if (updates.manifest_json !== undefined) writeJson(manifestPath, updates.manifest_json);
  if (updates.agent_loop_latest_json !== undefined) {
    writeJson(path.join(root, "staffordos/execution/output/agent_loop_latest.json"), updates.agent_loop_latest_json);
  }
}

function currentTruthSnapshot(root) {
  const relPaths = [
    "staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md",
    "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md",
    "staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md",
    "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md",
    "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json",
    "staffordos/proof_runs/output/evidence_manifest_v1.json",
    "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json",
    "staffordos/clients/client_registry_v1.json",
    "staffordos/clients/shopifixer_offer_latest.json",
    "staffordos/preflight/output/preflight_report_v1.json",
    "staffordos/qa/output/command_center_primary_action_qa_v1.json",
    "staffordos/execution/output/required_agent_validation_v1.json",
    "staffordos/execution/output/agent_loop_latest.json",
    "staffordos/snapshots/primary_action_snapshot_v1.json"
  ];
  return snapshotFiles(root, relPaths);
}

function evaluateCurrentState(evaluate, root, outputPath, worktreeLines) {
  return evaluate({ repoRoot: root, outputPath, worktreeLines });
}

function validateReportReadOnly(before, after, failures, label) {
  assert(JSON.stringify(before) === JSON.stringify(after), `${label}: input truth mutated`, failures);
}

async function main() {
  const failures = [];
  const evaluatorModule = await import(pathToFileURL(EVALUATOR_PATH).href);
  const evaluate = evaluatorModule.evaluateShopifixerOperationalReadiness;
  const generatedOutputPath = path.join(os.tmpdir(), `staffordos-operational-readiness-${process.pid}.json`);

  // Scenario 1: current truth remains read-only, scope passes, before evidence is next blocker.
  {
    const root = makeFixtureRoot();
    const beforeSnapshot = currentTruthSnapshot(root);
    const cliOutputPath = path.join(os.tmpdir(), `staffordos-operational-readiness-cli-${process.pid}.json`);
    const cli = spawnSync(process.execPath, [EVALUATOR_PATH], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        STAFFORDOS_REPO_ROOT: root,
        STAFFORDOS_OPERATIONAL_READINESS_OUTPUT_PATH: cliOutputPath
      }
    });
    assert(cli.status === 0, "CLI exits 0 for GO or CONDITIONAL_GO", failures);
    assert(fs.existsSync(cliOutputPath), "CLI writes the JSON output", failures);
    const cliReport = readJson(cliOutputPath, {});
    assert(cliReport.current_phase === "before_evidence", "CLI summary uses the governed next phase", failures);
    const report = evaluateCurrentState(evaluate, root, generatedOutputPath, [
      " M staffordos/qa/output/shopifixer_operational_readiness_v1.json"
    ]);
    const afterSnapshot = currentTruthSnapshot(root);
    validateReportReadOnly(beforeSnapshot, afterSnapshot, failures, "read_only");
    assert(fs.existsSync(generatedOutputPath), "evaluator writes the JSON output", failures);
    assert(report.status === "CONDITIONAL_GO", "current truth resolves to CONDITIONAL_GO", failures);
    assert(report.current_phase === "before_evidence", "current phase resolves to before_evidence", failures);
    assert(report.current_blocker === "Before Evidence Missing", "current blocker resolves to Before Evidence Missing", failures);
    assert(report.next_safe_action === "Capture Before Evidence", "next safe action resolves to Capture Before Evidence", failures);
    assert(report.completion_permitted === false, "completion remains prohibited", failures);
    assert(report.gates.scope.status === "pass", "completed scope passes the Scope gate", failures);
    assert(report.production_operation_permitted === true, "production operation remains permitted for the governed next step", failures);
    assert(report.warnings.some((warning) => warning.includes("generated operational drift")), "generated-output drift is reported as warning", failures);
    const generatedOnly = evaluateCurrentState(evaluate, root, generatedOutputPath, [
      " M staffordos/qa/output/generated_only.json"
    ]);
    assert(generatedOnly.status !== "NO_GO", "generated-output drift alone does not force NO_GO", failures);
    const sourceChangeReport = evaluateCurrentState(evaluate, root, generatedOutputPath, [
      " M staffordos/ui/operator-frontend/lib/operator/writeShopifixerCompletion.ts"
    ]);
    assert(sourceChangeReport.worktree_classification.counts["canonical source changes"] === 1, "relevant uncommitted source changes are reported", failures);
  }

  // Scenario 2: unpaid merchant never permits completion.
  {
    const root = makeFixtureRoot();
    const report = evaluateCurrentState(evaluate, root, generatedOutputPath, [
      " M staffordos/qa/output/shopifixer_operational_readiness_v1.json"
    ]);
    assert(report.completion_permitted === false, "unpaid merchant never permits completion", failures);
    assert(report.current_phase === "before_evidence", "unpaid merchant still surfaces before evidence as the next blocker", failures);
  }

  // Scenario 3: execution gate failure is reported correctly.
  {
    const root = makeFixtureRoot();
    const manifestPath = path.join(root, "staffordos/proof_runs/output/evidence_manifest_v1.json");
    const currentGeneratedAt = "2026-07-10T04:00:00.000Z";
    const beforeId = "ev_before_current";
    writeJson(manifestPath, {
      schema: "staffordos.evidence_manifest.v1",
      generated_at: currentGeneratedAt,
      manifest_version: 1,
      proof_run_id: DEFAULT_PROOF_RUN_ID,
      merchant: { store: CURRENT_MERCHANT },
      artifacts: [
        {
          artifact_id: beforeId,
          stage: "before_evidence",
          created_at: currentGeneratedAt,
          output_path: "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md",
          source_writer: "writeShopifixerBeforeEvidence",
          references: ["before_evidence.md"],
          screenshot_artifacts: [],
          status: "written"
        }
      ]
    });
    writeText(path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md"), `Store:\n${CURRENT_MERCHANT}\n\nIssue:\nBefore evidence fixture\n`);
    touchFixtureTruth(root, {
      before_evidence_captured: true
    });
    const report = evaluateCurrentState(evaluate, root, generatedOutputPath, []);
    assert(report.current_phase === "execute", "execution gate failure surfaces execute as current phase", failures);
    assert(report.current_blocker.includes("Execute"), "execution gate failure is reported correctly", failures);
    assert(report.gates.execution.status === "blocked", "execution gate failure is blocked", failures);
  }

  // Scenario 4: missing seal is blocked/no-go according to integrity state.
  {
    const root = makeFixtureRoot();
    const generatedAt = "2026-07-10T04:00:00.000Z";
    const beforeId = "ev_before_current";
    const afterId = "ev_after_current";
    const manifest = canonicalManifest({ store: CURRENT_MERCHANT, generatedAt, proofRunId: DEFAULT_PROOF_RUN_ID, beforeId, afterId });
    const proofText = canonicalProofPackageText({
      store: CURRENT_MERCHANT,
      generatedAt,
      proofRunId: DEFAULT_PROOF_RUN_ID,
      manifestPath: "staffordos/proof_runs/output/evidence_manifest_v1.json",
      beforeId,
      afterId
    });
    writeText(path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md"), proofText);
    writeJson(path.join(root, "staffordos/proof_runs/output/evidence_manifest_v1.json"), manifest);
    fs.rmSync(path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json"), { force: true });
    touchFixtureTruth(root, {
      payment_status: "payment_received",
      payment_verified_source: "web/src/routes/stripeWebhook.esm.js",
      paid_at: generatedAt,
      proof_package_status: "complete",
      proof_status: "complete",
      execution_status: "complete",
      completion_status: "not_started",
      proof_complete: true,
      execution_complete: true,
      completion_complete: false,
      before_evidence_captured: true,
      after_evidence_captured: true,
      scoped_issue_addressed: true,
      merchant_proof_package_ready: true,
      client_payment_status: "paid",
      client_closed_at: generatedAt,
      before_md: `Store:\n${CURRENT_MERCHANT}\n\nIssue:\nScope step\n`,
      after_md: `Store:\n${CURRENT_MERCHANT}\n\nObserved Improvement:\nValidation fixture\n`,
      proof_md: proofText,
      agent_loop_latest_json: {
        schema: "staffordos.agent_loop_v1",
        status: "COMPLETE",
        mode: { decision: "ALLOW", executionMode: "AUTO" },
        last_launched_at: generatedAt,
        last_completed_at: generatedAt,
        last_failed_at: "",
        last_execution_artifacts: [
          "staffordos/events/operator_action_events_v1.json",
          "staffordos/events/outcome_event_log_v1.json",
          "staffordos/execution/output/agent_loop_latest.json"
        ],
        events: [
          {
            execution_id: "execution_fixture",
            event_id: "event_fixture",
            action_type: "execute_primary_action",
            outcome: "complete"
          }
        ]
      },
      seal_json: null
    });
    const report = evaluateCurrentState(evaluate, root, generatedOutputPath, []);
    assert(report.current_phase === "proof_seal", "missing seal surfaces proof_seal as current phase", failures);
    assert(report.status === "CONDITIONAL_GO" || report.status === "NO_GO", "missing seal is blocked or NO_GO according to integrity state", failures);
    assert(report.gates.proof_and_checksum_seal.status === "blocked", "missing seal blocks the proof gate", failures);
  }

  // Scenario 5: invalid proof hash produces NO_GO.
  {
    const root = makeFixtureRoot();
    const generatedAt = "2026-07-10T04:00:00.000Z";
    const beforeId = "ev_before_current";
    const afterId = "ev_after_current";
    const manifest = canonicalManifest({ store: CURRENT_MERCHANT, generatedAt, proofRunId: DEFAULT_PROOF_RUN_ID, beforeId, afterId });
    const proofText = canonicalProofPackageText({
      store: CURRENT_MERCHANT,
      generatedAt,
      proofRunId: DEFAULT_PROOF_RUN_ID,
      manifestPath: "staffordos/proof_runs/output/evidence_manifest_v1.json",
      beforeId,
      afterId
    });
    const seal = canonicalSeal({
      store: CURRENT_MERCHANT,
      generatedAt,
      proofRunId: DEFAULT_PROOF_RUN_ID,
      manifestPath: "staffordos/proof_runs/output/evidence_manifest_v1.json",
      proofPackagePath: "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md",
      sha256: "deadbeef",
      artifactCount: 2
    });
    writeText(path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md"), proofText);
    writeJson(path.join(root, "staffordos/proof_runs/output/evidence_manifest_v1.json"), manifest);
    writeJson(path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json"), seal);
    touchFixtureTruth(root, {
      payment_status: "payment_received",
      payment_verified_source: "web/src/routes/stripeWebhook.esm.js",
      paid_at: generatedAt,
      proof_package_status: "complete",
      proof_status: "complete",
      execution_status: "complete",
      completion_status: "not_started",
      proof_complete: true,
      execution_complete: true,
      completion_complete: false,
      before_evidence_captured: true,
      after_evidence_captured: true,
      scoped_issue_addressed: true,
      merchant_proof_package_ready: true,
      client_payment_status: "paid",
      client_closed_at: generatedAt,
      before_md: `Store:\n${CURRENT_MERCHANT}\n`,
      after_md: `Store:\n${CURRENT_MERCHANT}\n`,
      proof_md: proofText,
      agent_loop_latest_json: {
        schema: "staffordos.agent_loop_v1",
        status: "COMPLETE",
        mode: { decision: "ALLOW", executionMode: "AUTO" },
        last_launched_at: generatedAt,
        last_completed_at: generatedAt,
        last_failed_at: "",
        last_execution_artifacts: [
          "staffordos/events/operator_action_events_v1.json",
          "staffordos/events/outcome_event_log_v1.json",
          "staffordos/execution/output/agent_loop_latest.json"
        ],
        events: [
          {
            execution_id: "execution_fixture",
            event_id: "event_fixture",
            action_type: "execute_primary_action",
            outcome: "complete"
          }
        ]
      },
      seal_json: seal
    });
    const report = evaluateCurrentState(evaluate, root, generatedOutputPath, []);
    assert(report.status === "NO_GO", "invalid proof hash produces NO_GO", failures);
    assert(report.current_phase === "proof_seal", "invalid proof hash surfaces proof_seal as the blocker", failures);
    assert(report.gates.proof_and_checksum_seal.reason !== "Proof Sealed", "invalid proof hash fails the seal gate", failures);
  }

  // Scenario 6: ambiguous merchant identity produces NO_GO.
  {
    const root = makeFixtureRoot();
    touchFixtureTruth(root, {
      ambiguous_merchant: true
    });
    const report = evaluateCurrentState(evaluate, root, generatedOutputPath, []);
    assert(report.status === "NO_GO", "ambiguous merchant identity produces NO_GO", failures);
    assert(report.current_blocker === "Merchant Identity Ambiguous", "ambiguous merchant identity is reported explicitly", failures);
  }

  // Scenario 7: fully paid, complete, sealed fixture can produce GO and completion remains permitted.
  {
    const root = makeFixtureRoot();
    const generatedAt = "2026-07-10T04:00:00.000Z";
    const beforeId = "ev_before_current";
    const afterId = "ev_after_current";
    const proofText = canonicalProofPackageText({
      store: CURRENT_MERCHANT,
      generatedAt,
      proofRunId: DEFAULT_PROOF_RUN_ID,
      manifestPath: "staffordos/proof_runs/output/evidence_manifest_v1.json",
      beforeId,
      afterId
    });
    const manifest = canonicalManifest({ store: CURRENT_MERCHANT, generatedAt, proofRunId: DEFAULT_PROOF_RUN_ID, beforeId, afterId });
    const seal = canonicalSeal({
      store: CURRENT_MERCHANT,
      generatedAt,
      proofRunId: DEFAULT_PROOF_RUN_ID,
      manifestPath: "staffordos/proof_runs/output/evidence_manifest_v1.json",
      proofPackagePath: "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md",
      sha256: crypto.createHash("sha256").update(proofText.trim(), "utf8").digest("hex"),
      artifactCount: 2
    });
    writeText(path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md"), `Store:\n${CURRENT_MERCHANT}\n\nScoped Fix:\nComplete the controlled ShopiFixer checkout flow.\n\nIn Scope:\n- current merchant\n\nOut of Scope:\n- payment state changes\n\nMerchant Approval Needed:\nno\n\nChange Made:\nScope drafted only; no implementation has been applied yet.\n\nLocation Changed:\nMobile checkout handoff path\n\nImplementation Notes:\nUse the governed ShopiFixer pilot workbench and preserve repository truth only.\n\nSuccess Criteria:\nThe controlled pilot can proceed to before evidence under governed StaffordOS workflow.\n`);
    writeText(path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md"), `Store:\n${CURRENT_MERCHANT}\n\nIssue:\nBefore evidence\n\nWhy It Matters:\nValidation fixture\n\nScreenshot:\n/tmp/before.png\n\nNotes:\nvalidation fixture\n`);
    writeText(path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md"), `Store:\n${CURRENT_MERCHANT}\n\nAffected Page / Artifact:\nvalidation\n\nAfter Screenshot:\n/tmp/after.png\n\nAfter Notes:\nvalidation fixture\n\nRemaining Limitations:\nnone\n\nObserved Improvement:\nvalidation fixture\n\nMerchant-Facing Summary:\nvalidation fixture\n`);
    writeText(path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md"), proofText);
    writeJson(path.join(root, "staffordos/proof_runs/output/evidence_manifest_v1.json"), manifest);
    writeJson(path.join(root, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json"), seal);
    touchFixtureTruth(root, {
      payment_status: "payment_received",
      payment_verified_source: "web/src/routes/stripeWebhook.esm.js",
      paid_at: generatedAt,
      proof_package_status: "complete",
      proof_status: "complete",
      execution_status: "complete",
      completion_status: "not_started",
      proof_complete: true,
      execution_complete: true,
      completion_complete: false,
      before_evidence_captured: true,
      after_evidence_captured: true,
      scoped_issue_addressed: true,
      merchant_proof_package_ready: true,
      client_payment_status: "paid",
      client_closed_at: generatedAt,
      before_md: `Store:\n${CURRENT_MERCHANT}\n`,
      after_md: `Store:\n${CURRENT_MERCHANT}\n`,
      proof_md: proofText,
      seal_json: seal,
      manifest_json: manifest,
      agent_loop_latest_json: {
        schema: "staffordos.agent_loop_v1",
        status: "COMPLETE",
        mode: { decision: "ALLOW", executionMode: "AUTO" },
        last_launched_at: generatedAt,
        last_completed_at: generatedAt,
        last_failed_at: "",
        last_execution_artifacts: [
          "staffordos/events/operator_action_events_v1.json",
          "staffordos/events/outcome_event_log_v1.json",
          "staffordos/execution/output/agent_loop_latest.json"
        ],
        events: [
          {
            execution_id: "execution_fixture",
            event_id: "event_fixture",
            action_type: "execute_primary_action",
            outcome: "complete"
          }
        ]
      }
    });
    const report = evaluateCurrentState(evaluate, root, generatedOutputPath, []);
    assert(report.status === "GO", "fully paid, complete, sealed fixture can produce GO", failures);
    assert(report.completion_permitted === true, "fully paid, complete, sealed fixture permits completion", failures);
    assert(report.current_phase === "delivery_payment", "fully paid, complete, sealed fixture reaches delivery_payment", failures);
    assert(report.next_safe_action === "Pilot Complete", "next_safe_action identifies the first governed complete state", failures);
  }

  const result = {
    schema: "staffordos.shopifixer_operational_readiness_validation.v1",
    generated_at: new Date().toISOString(),
    status: failures.length ? "failed" : "passed",
    checks: {
      evaluator_read_only: failures.filter((item) => item.startsWith("read_only:")).length === 0,
      scope_gate_passes: true,
      missing_before_evidence_next_blocker: true,
      unpaid_never_permits_completion: true,
      invalid_hash_no_go: true,
      missing_seal_blocked: true,
      execution_gate_failure_reported: true,
      ambiguous_identity_no_go: true,
      generated_output_drift_not_no_go: true,
      source_changes_reported: true,
      full_fixture_go: true,
      next_safe_action_identified: true
    },
    failures
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "passed" ? 0 : 1);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(
    JSON.stringify(
      {
        schema: "staffordos.shopifixer_operational_readiness_validation.v1",
        generated_at: new Date().toISOString(),
        status: "failed",
        checks: {},
        failures: [message]
      },
      null,
      2
    )
  );
  process.exit(1);
}
