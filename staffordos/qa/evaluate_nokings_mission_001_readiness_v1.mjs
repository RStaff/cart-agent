import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const DEFAULT_BINDING_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json");
const DEFAULT_PROOF_RUN_DIR = path.join(DEFAULT_REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1");
const DEFAULT_OUTPUT_PATH = path.join(MODULE_DIR, "output", "nokings_mission_001_readiness_v1.json");

function clean(value, fallback = "Not Yet Available") {
  const text = String(value ?? "").trim();
  return text.length ? text : fallback;
}

function readText(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  } catch {
    return "";
  }
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

function sha256(value) {
  return crypto.createHash("sha256").update(String(value ?? ""), "utf8").digest("hex");
}

function normalizeStore(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function parseMarkdownFields(content) {
  const lines = String(content || "").split(/\r?\n/);
  function valueAfter(label) {
    const index = lines.findIndex((line) => line.trim() === label);
    if (index < 0) return "";
    for (let i = index + 1; i < lines.length; i += 1) {
      const candidate = lines[i].trim();
      if (!candidate) continue;
      if (/^[A-Za-z][A-Za-z /&-]+:$/.test(candidate)) break;
      return candidate.replace(/^-+\s*/, "");
    }
    return "";
  }
  function listAfter(label) {
    const index = lines.findIndex((line) => line.trim() === label);
    if (index < 0) return [];
    const items = [];
    for (let i = index + 1; i < lines.length; i += 1) {
      const candidate = lines[i].trim();
      if (!candidate) continue;
      if (/^[A-Za-z][A-Za-z /&-]+:$/.test(candidate)) break;
      items.push(candidate.replace(/^-+\s*/, ""));
    }
    return items;
  }

  return {
    status: valueAfter("Status:"),
    store: valueAfter("Store:"),
    issue: valueAfter("Issue:"),
    scopedFix: valueAfter("Smallest Scoped Fix:"),
    inScope: listAfter("In Scope:"),
    outOfScope: listAfter("Out of Scope:"),
    merchantApprovalRequired: valueAfter("Merchant Approval Required:"),
    changeLocation: valueAfter("Change Location:"),
    implementationNotes: valueAfter("Implementation Notes:"),
    successCriteria: valueAfter("Success Criteria:"),
    affectedPage: valueAfter("Affected Page / Artifact:"),
    observedImprovement: valueAfter("Observed Improvement:"),
    merchantFacingSummary: valueAfter("Merchant-Facing Summary:"),
    remainingLimitations: valueAfter("Remaining Limitations:"),
    screenshot: valueAfter("Screenshot:"),
    notes: valueAfter("Notes:")
  };
}

function loadBinding(bindingPath) {
  return readJson(bindingPath, {});
}

function stageStatus(status, reason) {
  return {
    status,
    reason
  };
}

function evaluateNokingsMissionReadiness({
  repoRoot = DEFAULT_REPO_ROOT,
  bindingPath = DEFAULT_BINDING_PATH,
  proofRunDir = DEFAULT_PROOF_RUN_DIR
} = {}) {
  const binding = loadBinding(bindingPath);
  const missionScopePath = path.join(proofRunDir, "fix_scope.md");
  const beforePath = path.join(proofRunDir, "before_evidence.md");
  const afterPath = path.join(proofRunDir, "after_evidence.md");
  const proofPackagePath = path.join(proofRunDir, "merchant_proof_package.md");
  const executionNotesPath = path.join(proofRunDir, "execution_notes.md");

  const missionScope = parseMarkdownFields(readText(missionScopePath));
  const beforeEvidence = parseMarkdownFields(readText(beforePath));
  const afterEvidence = parseMarkdownFields(readText(afterPath));
  const proofPackage = parseMarkdownFields(readText(proofPackagePath));
  const store = clean(binding?.canonical_store_domain || binding?.merchant?.store_domain || binding?.merchant?.client_id || "");
  const bindingStoreMatches = normalizeStore(binding?.canonical_store_domain) === "no-kings-athletics.myshopify.com";
  const missionIdMatches = clean(binding?.mission_id) === "mission_001";
  const productMatches = clean(binding?.product) === "ShopiFixer";
  const environmentMatches = clean(binding?.environment_type) === "controlled_training";
  const proofRunId = clean(binding?.proof_run_id);
  const proofRunPath = clean(binding?.proof_run_path);
  const proofRunPathExists = fs.existsSync(proofRunDir);
  const storefrontUrl = clean(binding?.storefront_url, "Not Yet Available");
  const paymentRequired = binding?.payment_required === true;
  const paymentAuthority = clean(binding?.payment_authority);

  const merchantBindingPass = Boolean(bindingStoreMatches && missionIdMatches && productMatches && environmentMatches && proofRunId && proofRunPath && proofRunPathExists);
  const scopeComplete = clean(missionScope.status).toLowerCase() === "complete" && normalizeStore(missionScope.store) === "no-kings-athletics.myshopify.com";
  const scopeBlocker = scopeComplete ? "" : "Mission scope not yet established";
  const beforeEvidenceCaptured = clean(beforeEvidence.status).toLowerCase() === "complete" || clean(beforeEvidence.status).toLowerCase() === "captured";
  const executionAuthorityPass = merchantBindingPass && scopeComplete && beforeEvidenceCaptured;
  const afterEvidenceCaptured = clean(afterEvidence.status).toLowerCase() === "complete" || clean(afterEvidence.status).toLowerCase() === "captured";
  const proofReady = clean(proofPackage.status).toLowerCase() === "complete";
  const rollbackReady = Boolean(merchantBindingPass && proofRunPathExists);

  const gatingReasons = [
    !merchantBindingPass ? "Merchant binding incomplete" : "",
    !scopeComplete ? "Scope Incomplete" : "",
    !beforeEvidenceCaptured ? "Before Evidence Missing" : "",
    !executionAuthorityPass ? "Execution authority not yet available" : "",
    !afterEvidenceCaptured ? "After Evidence Missing" : "",
    !proofReady ? "Proof Drafted" : "",
    paymentRequired ? "Payment required by mission binding" : ""
  ].filter(Boolean);

  const currentPhase = !merchantBindingPass
    ? "merchant_binding"
    : !scopeComplete
      ? "scope"
      : !beforeEvidenceCaptured
        ? "before_evidence"
        : !executionAuthorityPass
          ? "execute"
          : !afterEvidenceCaptured
            ? "after_evidence"
            : !proofReady
              ? "proof_seal"
              : paymentRequired
                ? "delivery_payment"
                : "scope";

  const currentBlocker = gatingReasons[0] || "Not Yet Available";
  const nextSafeAction = !merchantBindingPass
    ? "Complete mission binding"
    : !scopeComplete
      ? "Establish governed mission scope"
      : !beforeEvidenceCaptured
        ? "Capture Before Evidence"
        : !executionAuthorityPass
          ? "Establish execution authority"
          : !afterEvidenceCaptured
            ? "Capture After Evidence"
            : !proofReady
              ? "Generate proof package"
              : paymentRequired
                ? "Resolve payment applicability"
                : "Mission binding established";

  const productionOperationPermitted = merchantBindingPass;
  const completionPermitted = false;
  const status = merchantBindingPass && !paymentRequired && gatingReasons.length > 0 ? "CONDITIONAL_GO" : merchantBindingPass && !gatingReasons.length ? "GO" : "NO_GO";

  const report = {
    schema: "staffordos.nokings_mission_001_readiness.v1",
    generated_at: new Date().toISOString(),
    status,
    production_operation_permitted: productionOperationPermitted,
    completion_permitted: completionPermitted,
    merchant: {
      merchant_name: clean(binding?.merchant?.merchant_name, "NoKings Athletics"),
      store: store,
      canonical_store_domain: clean(binding?.canonical_store_domain, "no-kings-athletics.myshopify.com"),
      storefront_url: storefrontUrl,
      shopify_admin_identity: clean(binding?.shopify_admin_identity, "Not Yet Available"),
      product: clean(binding?.product, "ShopiFixer"),
      environment_type: clean(binding?.environment_type, "controlled_training"),
      proof_run_id: proofRunId,
      proof_run_path: proofRunPath
    },
    current_phase: currentPhase,
    current_blocker: currentBlocker,
    blocking_reasons: gatingReasons,
    next_safe_action: nextSafeAction,
    payment_required: paymentRequired,
    gates: {
      merchant_binding: merchantBindingPass ? stageStatus("pass", "NoKings binding established") : stageStatus("blocked", "NoKings binding incomplete"),
      scope: scopeComplete ? stageStatus("pass", "Governed mission scope established") : stageStatus("blocked", scopeBlocker),
      before_evidence: beforeEvidenceCaptured ? stageStatus("pass", "Before evidence scaffold present") : stageStatus("blocked", "Before Evidence Missing"),
      execution: executionAuthorityPass ? stageStatus("pass", "Execution authority may proceed after scope and before evidence") : stageStatus("blocked", "Execution authority not yet available"),
      after_evidence: afterEvidenceCaptured ? stageStatus("pass", "After evidence scaffold present") : stageStatus("blocked", "After Evidence Missing"),
      proof: proofReady ? stageStatus("pass", "Proof package scaffold present") : stageStatus("blocked", "Proof Drafted"),
      rollback: rollbackReady ? stageStatus("pass", "Separate mission proof-run path is available for rollback") : stageStatus("blocked", "Rollback path not yet established"),
      payment_applicability: paymentRequired
        ? stageStatus("blocked", paymentAuthority)
        : stageStatus("pass", "No payment required unless canonical mission doctrine explicitly requires it")
    },
    scores: {
      merchant_binding: merchantBindingPass ? 100 : 0,
      scope: scopeComplete ? 100 : 25,
      before_evidence: beforeEvidenceCaptured ? 100 : 0,
      execution: executionAuthorityPass ? 100 : 0,
      after_evidence: afterEvidenceCaptured ? 100 : 0,
      proof: proofReady ? 100 : 0,
      rollback: rollbackReady ? 100 : 50,
      payment: paymentRequired ? 0 : 100,
      overall: merchantBindingPass ? (scopeComplete ? (beforeEvidenceCaptured ? 70 : 40) : 35) : 0
    },
    evidence_sources: [
      "STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md",
      "SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md",
      "SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md",
      "staffordos/governance/archive/20260604_artifact_archive/canonical_systems_v1.md",
      "staffordos/governance/archive/20260604_artifact_archive/canonical_artifact_inventory_v1.md",
      "staffordos/governance/archive/20260604_artifact_archive/commercialization_truth_map_v1.md",
      "staffordos/governance/archive/20260604_artifact_archive/commercialization_gaps_v1.md",
      "staffordos/audits/no_kings/evidence/before_evidence_record_v1.md",
      "staffordos/audits/no_kings/evidence/before/homepage_desktop_before.png",
      "staffordos/audits/no_kings/evidence/before/homepage_mobile_before.png",
      "staffordos/audits/no_kings/execution_truth/execution_access_result_v1.md",
      "staffordos/audits/no_kings/execution_truth/theme_pull_test_v2.txt",
      bindingPath,
      missionScopePath,
      beforePath,
      afterPath,
      proofPackagePath,
      executionNotesPath
    ],
    warnings: [
      "Mission 001 is a controlled training environment, not paid-commercial work.",
      "NoKings evidence remains a separate proof target from the generic cart-agent-dev ShopiFixer pilot.",
      "No seal or completion truth is fabricated.",
      "No Shopify mutation is performed by this evaluator."
    ]
  };

  return report;
}

function runCli() {
  const repoRoot = process.env.NOKINGS_REPO_ROOT ? path.resolve(process.env.NOKINGS_REPO_ROOT) : DEFAULT_REPO_ROOT;
  const bindingPath = process.env.NOKINGS_BINDING_PATH ? path.resolve(process.env.NOKINGS_BINDING_PATH) : DEFAULT_BINDING_PATH;
  const proofRunDir = process.env.NOKINGS_PROOF_RUN_DIR ? path.resolve(process.env.NOKINGS_PROOF_RUN_DIR) : DEFAULT_PROOF_RUN_DIR;
  const outputPath = process.env.NOKINGS_READINESS_OUTPUT_PATH ? path.resolve(process.env.NOKINGS_READINESS_OUTPUT_PATH) : DEFAULT_OUTPUT_PATH;
  const report = evaluateNokingsMissionReadiness({ repoRoot, bindingPath, proofRunDir });
  writeJson(outputPath, report);
  console.log(
    `NoKings Mission 001 readiness: ${report.status} | phase=${report.current_phase} | blocker=${report.current_blocker} | next=${report.next_safe_action} | payment=${report.payment_required ? "required" : "not_required"} | completion=${report.completion_permitted ? "yes" : "no"}`
  );
  process.exit(report.status === "NO_GO" ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}

function pathToFileURL(filePath) {
  return new URL(`file://${path.resolve(filePath)}`);
}

export { evaluateNokingsMissionReadiness };
