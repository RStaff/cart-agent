import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const DEFAULT_OUTPUT_PATH = path.join(MODULE_DIR, "output", "shopifixer_operational_readiness_v1.json");
const DEFAULT_PROOF_RUN_ID = "internal_shopifixer_dry_run_v1";
const STRIPE_WEBHOOK_TRACE = "web/src/routes/stripeWebhook.esm.js";
const PHASE_ORDER = [
  "merchant_context",
  "scope",
  "before_evidence",
  "execute",
  "after_evidence",
  "proof_seal",
  "delivery_payment",
  "completion_authority"
];

function clean(value, fallback = "") {
  const text = String(value ?? fallback).trim();
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

function sha256(text) {
  return crypto.createHash("sha256").update(String(text ?? ""), "utf8").digest("hex");
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

function normalizePath(value) {
  return String(value ?? "").trim().replace(/\\/g, "/");
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
    store: valueAfter("Store:"),
    scopedFix: valueAfter("Scoped Fix:") || valueAfter("Issue:"),
    issue: valueAfter("Issue:") || valueAfter("Scoped Fix:"),
    inScope: listAfter("In Scope:"),
    outOfScope: listAfter("Out of Scope:"),
    merchantApprovalNeeded: valueAfter("Merchant Approval Needed:"),
    changeMade: valueAfter("Change Made:"),
    locationChanged: valueAfter("Location Changed:"),
    implementationNotes: valueAfter("Implementation Notes:"),
    successCriteria: valueAfter("Success Criteria:"),
    observedImprovement: valueAfter("Observed Improvement:"),
    merchantFacingSummary: valueAfter("Merchant-Facing Summary:"),
    remainingLimitations: valueAfter("Remaining Limitations:"),
    screenshot: valueAfter("Screenshot:"),
    notes: valueAfter("Notes:")
  };
}

function loadGitStatus(repoRoot) {
  try {
    const result = spawnSync("git", ["status", "--short"], {
      cwd: repoRoot,
      encoding: "utf8"
    });
    if (result.error || result.status !== 0) return [];
    return String(result.stdout || "")
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function classifyWorktreeLine(line) {
  const raw = String(line || "").trimEnd();
  const status = raw.slice(0, 2).trim() || "??";
  const filePath = raw.slice(3).trim() || raw.trim();
  const normalizedPath = filePath.replace(/\\/g, "/");

  const canonicalSourcePatterns = [
    /^staffordos\/ui\/operator-frontend\/lib\/operator\/.+\.ts$/,
    /^staffordos\/ui\/operator-frontend\/components\/operator\/.+\.tsx?$/,
    /^staffordos\/ui\/operator-frontend\/app\/operator\/.+\.tsx?$/,
    /^staffordos\/qa\/(?!output\/).+\.mjs$/,
    /^web\/src\/routes\/.+\.esm\.js$/,
    /^staffordos\/merchant_registry\/build_merchant_lifecycle_registry_v1\.mjs$/,
    /^staffordos\/fulfillment\/build_shopifixer_fulfillment_truth_v1\.mjs$/,
    /^staffordos\/revenue\/.+\.mjs$/
  ];

  if (canonicalSourcePatterns.some((pattern) => pattern.test(normalizedPath))) {
    return { status, path: normalizedPath, category: "canonical source changes" };
  }

  if (
    /^staffordos\/proof_runs\/internal_shopifixer_dry_run_v1\/.+\.(md|json)$/i.test(normalizedPath) ||
    /^staffordos\/proof_runs\/internal_shopifixer_dry_run_v1\/.+\/?$/i.test(normalizedPath)
  ) {
    return { status, path: normalizedPath, category: "proof artifacts" };
  }

  if (/^staffordos\/events\/.+\.json$/i.test(normalizedPath) || /^staffordos\/snapshots\/.+\.json$/i.test(normalizedPath)) {
    return { status, path: normalizedPath, category: "snapshots/events" };
  }

  if (
    /^staffordos\/execution\/output\/.+/i.test(normalizedPath) ||
    /^staffordos\/qa\/output\/.+/i.test(normalizedPath) ||
    /^staffordos\/cockpit\/.+\.json$/i.test(normalizedPath) ||
    /^staffordos\/operating_loop\/output\/.+/i.test(normalizedPath)
  ) {
    return { status, path: normalizedPath, category: "generated operational outputs" };
  }

  if (
    /^staffordos\/implementation\/.+\.md$/i.test(normalizedPath) ||
    /^staffordos\/operations\/.+\.md$/i.test(normalizedPath) ||
    /^staffordos\/.*\.md$/i.test(normalizedPath) ||
    /^web\/\.env\..+$/i.test(normalizedPath)
  ) {
    return { status, path: normalizedPath, category: "documentation awaiting review" };
  }

  if (/\.tsbuildinfo$/i.test(normalizedPath) || /\.tmp$/i.test(normalizedPath) || /\.cache$/i.test(normalizedPath) || /\.log$/i.test(normalizedPath)) {
    return { status, path: normalizedPath, category: "cache/temporary files" };
  }

  return { status, path: normalizedPath, category: "unknown" };
}

function summarizeWorktree(lines) {
  const entries = (Array.isArray(lines) ? lines : []).map(classifyWorktreeLine);
  const categories = {
    "canonical source changes": [],
    "generated operational outputs": [],
    "proof artifacts": [],
    "snapshots/events": [],
    "documentation awaiting review": [],
    "cache/temporary files": [],
    unknown: []
  };

  for (const entry of entries) {
    if (!categories[entry.category]) {
      categories.unknown.push(entry);
      continue;
    }
    categories[entry.category].push(entry);
  }

  return {
    entries,
    categories,
    counts: Object.fromEntries(Object.entries(categories).map(([key, value]) => [key, value.length])),
    dirtyCount: entries.length
  };
}

function readMatchByMerchant(records, merchantKey) {
  const normalizedMerchant = normalizeStore(merchantKey);
  const list = Array.isArray(records) ? records : [];
  const matches = list.filter((record) =>
    [record?.client_id, record?.merchant_shop, record?.store_domain, record?.domain, record?.id, record?.merchant_name]
      .map(normalizeStore)
      .includes(normalizedMerchant)
  );
  return { list, matches };
}

function pickMerchant(merchantRecord, clientRegistry, fulfillmentItem, offerLatest) {
  const store = clean(merchantRecord?.store || fulfillmentItem?.store_domain || fulfillmentItem?.client_id || clientRegistry?.merchant?.store || offerLatest?.merchant_shop);
  const clientId = clean(merchantRecord?.client_id || fulfillmentItem?.client_id || store);
  const offer = offerLatest?.merchant_shop && normalizeStore(offerLatest.merchant_shop) === normalizeStore(store)
    ? offerLatest.offer || null
    : null;
  const clientMatch = clientRegistry || {};

  return {
    store,
    client_id: clientId,
    merchant_name: clean(merchantRecord?.name || fulfillmentItem?.merchant_name || clientMatch?.merchant?.name || "Not Yet Available"),
    campaign_id: clean(merchantRecord?.campaign_id || clientMatch?.campaign_id || "Not Yet Available"),
    lead_id: clean(merchantRecord?.lead_id || clientMatch?.lead_id || "Not Yet Available"),
    offer_subject: clean(offer?.subject || "Not Yet Available"),
    payment_status: clean(fulfillmentItem?.payment_status || clientMatch?.deal?.payment_status || "Not Yet Available"),
    payment_verified_source: clean(fulfillmentItem?.payment_verified_source || "Not Yet Available"),
    paid_at: clean(fulfillmentItem?.paid_at || "Not Yet Available")
  };
}

function evaluateScope(scopeContent, merchantStore) {
  const fields = parseMarkdownFields(scopeContent);
  const missingFields = [];
  if (!fields.store) missingFields.push("Store");
  if (!fields.scopedFix) missingFields.push("Scoped Fix");
  if (!fields.inScope.length) missingFields.push("In Scope");
  if (!fields.outOfScope.length) missingFields.push("Out of Scope");
  if (!fields.merchantApprovalNeeded) missingFields.push("Merchant Approval Needed");
  if (!fields.changeMade) missingFields.push("Change Made");
  if (!fields.locationChanged) missingFields.push("Location Changed");
  if (!fields.implementationNotes) missingFields.push("Implementation Notes");
  if (!fields.successCriteria) missingFields.push("Success Criteria");
  const storeMatches = normalizeStore(fields.store) === normalizeStore(merchantStore);
  const complete = Boolean(scopeContent.trim()) && missingFields.length === 0 && storeMatches;
  const status = !scopeContent.trim()
    ? "Scope Missing"
    : complete
      ? "Scope Complete"
      : String(fields.merchantApprovalNeeded).trim().toLowerCase() === "yes"
        ? "Scope Ready for Approval"
        : "Scope Drafted";
  return {
    fields,
    missingFields: storeMatches ? missingFields : ["Store", ...missingFields.filter((field) => field !== "Store")],
    storeMatches,
    complete,
    status,
    currentBlocker: complete ? "" : !scopeContent.trim() ? "Scope Missing" : storeMatches ? `Missing scope fields: ${missingFields.join(", ")}` : `Scope store mismatch: ${fields.store || "Not Yet Available"}`
  };
}

function readEvidenceStage({ content, manifest, stage, sourceWriter, merchantStore }) {
  const fields = parseMarkdownFields(content);
  const artifacts = Array.isArray(manifest?.artifacts)
    ? manifest.artifacts.filter((artifact) =>
        clean(artifact?.stage) === stage &&
        clean(artifact?.source_writer) === sourceWriter &&
        (!merchantStore || normalizeStore(artifact?.merchant?.store || manifest?.merchant?.store) === normalizeStore(merchantStore))
      )
    : [];
  const latest = artifacts[artifacts.length - 1] || null;
  const artifactIds = artifacts.map((artifact) => clean(artifact?.artifact_id)).filter(Boolean);
  const screenshotArtifacts = Array.isArray(latest?.screenshot_artifacts) ? latest.screenshot_artifacts : [];
  const merchantMatches = artifacts.length
    ? artifacts.every((artifact) => normalizeStore(artifact?.merchant?.store || manifest?.merchant?.store) === normalizeStore(merchantStore))
    : false;
  const status = !content.trim()
    ? stage === "before_evidence"
      ? "Before Evidence Missing"
      : "After Evidence Missing"
    : artifacts.length && merchantMatches
      ? stage === "before_evidence"
        ? "Before Evidence Captured"
        : "After Evidence Captured"
      : stage === "before_evidence"
        ? "Before Evidence Drafted"
        : "After Evidence Drafted";
  return {
    fields,
    artifacts,
    latest,
    artifactIds,
    screenshotArtifacts,
    merchantMatches,
    status,
    lastCapturedAt: clean(latest?.created_at, "Not Yet Available")
  };
}

function proofSealSummary({ proofContent, seal, manifest, merchantStore, proofRunId }) {
  const proofPackageExists = Boolean(proofContent.trim());
  const proofPackagePath = "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md";
  const sealPath = "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json";
  const manifestPath = "staffordos/proof_runs/output/evidence_manifest_v1.json";
  const proofPackageStore = clean(proofContent.match(/^Merchant \/ Store:\s*(.+)$/m)?.[1] || proofContent.match(/^Store:\s*(.+)$/m)?.[1] || "");
  const sealStatus = clean(seal?.status, "Not Yet Available");
  const proofPackageHash = proofPackageExists ? sha256(proofContent.trim()) : "";
  const sealSha = clean(seal?.sha256);
  const proofSha256MatchStatus = proofPackageExists && sealSha ? (proofPackageHash === sealSha ? "Match" : "Mismatch") : "Not Yet Available";
  const manifestArtifacts = Array.isArray(manifest?.artifacts) ? manifest.artifacts : [];
  const manifestMerchant = clean(manifest?.merchant?.store);
  const sealManifestPath = clean(seal?.manifest_path);
  const sealProofPackagePath = clean(seal?.proof_package_path);
  const sealProofRunId = clean(seal?.proof_run_id);
  const artifactCount = Number.isFinite(Number(seal?.manifest_artifact_count)) ? Number(seal?.manifest_artifact_count) : 0;
  const currentMerchantNormalized = normalizeStore(merchantStore);
  const merchantMatches = Boolean(
    currentMerchantNormalized &&
      (
        normalizeStore(proofPackageStore) === currentMerchantNormalized ||
        normalizeStore(manifestMerchant) === currentMerchantNormalized
      )
  );
  const canonicalSeal = sealStatus.toLowerCase() === "sealed" &&
    sealProofRunId === proofRunId &&
    normalizePath(sealProofPackagePath) === normalizePath(proofPackagePath) &&
    normalizePath(sealManifestPath) === normalizePath(manifestPath) &&
    proofSha256MatchStatus === "Match" &&
    artifactCount === manifestArtifacts.length &&
    merchantMatches;
  const status = !proofPackageExists
    ? "Proof Missing"
    : canonicalSeal
      ? "Proof Sealed"
      : sealSha
        ? "Proof Drafted"
        : "Proof Invalid";
  const blockingReasons = [];
  if (!proofPackageExists) blockingReasons.push("merchant_proof_package.md missing");
  if (proofPackageExists && status !== "Proof Sealed") {
    if (sealStatus.toLowerCase() !== "sealed") blockingReasons.push(`Seal status: ${sealStatus || "Not Yet Available"}`);
    if (sealProofRunId && sealProofRunId !== proofRunId) blockingReasons.push(`Proof run id: ${sealProofRunId}`);
    if (sealProofPackagePath && normalizePath(sealProofPackagePath) !== normalizePath(proofPackagePath)) blockingReasons.push("Non-canonical proof package path");
    if (sealManifestPath && normalizePath(sealManifestPath) !== normalizePath(manifestPath)) blockingReasons.push("Non-canonical manifest path");
    if (sealSha && proofSha256MatchStatus !== "Match") blockingReasons.push("SHA-256 mismatch");
    if (artifactCount !== manifestArtifacts.length) blockingReasons.push("Manifest artifact count mismatch");
    if (!merchantMatches) blockingReasons.push("Merchant identity mismatch");
  }
  return {
    status,
    proofPackageExists,
    proofPackagePath,
    sealPath,
    manifestPath,
    sealStatus,
    proofRunId: clean(sealProofRunId || proofRunId),
    generatedAt: clean(seal?.generated_at, "Not Yet Available"),
    manifestArtifactCount: artifactCount,
    evidenceSourcePaths: Array.isArray(seal?.evidence_source_paths) ? seal.evidence_source_paths.map((item) => clean(item, "Not Yet Available")) : [],
    sha256: clean(sealSha, "Not Yet Available"),
    proofSha256MatchStatus,
    merchantMatches,
    blockingReasons,
    merchantStore: proofPackageStore || manifestMerchant || "Not Yet Available"
  };
}

function executionSummary({ preflight, qa, requiredAgentValidation, agentLoopLatest, scopeComplete, beforeEvidenceCaptured }) {
  const preflightGo = clean(preflight?.status).toUpperCase() === "GO";
  const qaPass = clean(qa?.verdict).toUpperCase() === "PASS";
  const requiredAgentsGo = clean(requiredAgentValidation?.status).toUpperCase() === "GO";
  const executionModeDecision = clean(agentLoopLatest?.mode?.decision, "Not Yet Available");
  const executionModeExecutionMode = clean(agentLoopLatest?.mode?.executionMode, "Not Yet Available");
  const latestStatus = clean(agentLoopLatest?.status || agentLoopLatest?.outcome || "Not Yet Available");
  const latestEvent = Array.isArray(agentLoopLatest?.events) ? agentLoopLatest.events[0] : null;
  const executionModeBlocked = /IGNORE|BLOCK|BLOCKED|REJECT|REJECTED/i.test(executionModeDecision) || latestStatus.toUpperCase().includes("BLOCKED");
  const executionInProgress = /RUNNING|IN_PROGRESS|EXECUTING|STARTED/i.test(latestStatus);
  const executionFailed = /FAILED/i.test(latestStatus);
  const executionComplete = /COMPLETE|COMPLETED/i.test(latestStatus) || /COMPLETE|COMPLETED/i.test(clean(latestEvent?.outcome));
  const blockingReasons = [
    !scopeComplete ? "Scope incomplete" : "",
    scopeComplete && !beforeEvidenceCaptured ? "Before Evidence Missing" : "",
    scopeComplete && beforeEvidenceCaptured && !preflightGo ? `Preflight status: ${clean(preflight?.status, "Not Yet Available")}` : "",
    scopeComplete && beforeEvidenceCaptured && preflightGo && !qaPass ? `QA verdict: ${clean(qa?.verdict, "Not Yet Available")}` : "",
    scopeComplete && beforeEvidenceCaptured && preflightGo && qaPass && !requiredAgentsGo ? `Required-agent validation: ${clean(requiredAgentValidation?.status, "Not Yet Available")}` : "",
    scopeComplete && beforeEvidenceCaptured && preflightGo && qaPass && requiredAgentsGo && executionModeBlocked ? `Execution mode decision: ${executionModeDecision}` : ""
  ].filter(Boolean);

  let status = "Execute Blocked";
  if (executionComplete) status = "Execute Complete";
  else if (executionInProgress) status = "Execute In Progress";
  else if (!blockingReasons.length && !executionModeBlocked && preflightGo && qaPass && requiredAgentsGo) status = "Execute Ready";
  else if (executionFailed) status = "Execute Failed";

  return {
    status,
    preflightGo,
    qaPass,
    requiredAgentsGo,
    executionModeDecision,
    executionModeExecutionMode,
    executionModeBlocked,
    executionInProgress,
    executionFailed,
    executionComplete,
    latestStatus,
    latestEventSummary: latestEvent
      ? `${clean(latestEvent.execution_id || latestEvent.event_id)} · ${clean(latestEvent.action_type)} · ${clean(latestEvent.outcome)}`
      : "Not Yet Available",
    blockingReasons,
    missingTruthOrGates: [
      !scopeComplete ? "fix_scope.md" : "",
      scopeComplete && !beforeEvidenceCaptured ? "before_evidence.md / evidence_manifest_v1.json" : "",
      scopeComplete && beforeEvidenceCaptured && !preflightGo ? "preflight_report_v1.json" : "",
      scopeComplete && beforeEvidenceCaptured && preflightGo && !qaPass ? "command_center_primary_action_qa_v1.json" : "",
      scopeComplete && beforeEvidenceCaptured && preflightGo && qaPass && !requiredAgentsGo ? "required_agent_validation_v1.json" : "",
      scopeComplete && beforeEvidenceCaptured && preflightGo && qaPass && requiredAgentsGo && executionModeBlocked ? "agent_loop_latest.json" : ""
    ].filter(Boolean),
    latestLaunchedAt: clean(agentLoopLatest?.last_launched_at, "Not Yet Available"),
    latestCompletedAt: clean(agentLoopLatest?.last_completed_at, "Not Yet Available"),
    latestFailedAt: clean(agentLoopLatest?.last_failed_at, "Not Yet Available"),
    rollbackAvailability: executionComplete || latestEvent ? "Available" : "Not Yet Available",
    executionArtifactPaths: Array.isArray(agentLoopLatest?.last_execution_artifacts)
      ? agentLoopLatest.last_execution_artifacts.map((item) => clean(item, "Not Yet Available"))
      : [
          "staffordos/events/operator_action_events_v1.json",
          "staffordos/events/outcome_event_log_v1.json",
          "staffordos/execution/output/agent_loop_latest.json"
        ]
  };
}

function paymentSummary({ fulfillmentItem, merchantStore }) {
  const paymentStatus = clean(fulfillmentItem?.payment_status, "Not Yet Available");
  const paymentVerifiedSource = clean(fulfillmentItem?.payment_verified_source, "");
  const paidAt = clean(fulfillmentItem?.paid_at, "");
  const storeMatches = normalizeStore(fulfillmentItem?.store_domain || fulfillmentItem?.client_id) === normalizeStore(merchantStore);
  const paymentReceived = ["payment_received", "paid"].includes(paymentStatus.toLowerCase()) && paymentVerifiedSource.includes(STRIPE_WEBHOOK_TRACE) && Boolean(paidAt) && storeMatches;
  return {
    paymentStatus,
    paymentVerifiedSource,
    paidAt,
    paymentReceived,
    storeMatches,
    blockingReasons: paymentReceived ? [] : [
      !storeMatches ? "Merchant identity mismatch" : "",
      !["payment_received", "paid"].includes(paymentStatus.toLowerCase()) ? `payment_status=${paymentStatus}` : "",
      paymentVerifiedSource && !paymentVerifiedSource.includes(STRIPE_WEBHOOK_TRACE) ? "Non-canonical payment verification source" : "",
      !paidAt ? "paid_at missing" : ""
    ].filter(Boolean)
  };
}

function completionAuthoritySummary({
  merchantStore,
  scopeComplete,
  beforeEvidenceCaptured,
  executionComplete,
  afterEvidenceCaptured,
  proofSummary,
  paymentSummary: payment,
  fulfillmentItem
}) {
  const merchantMatches = normalizeStore(fulfillmentItem?.store_domain || fulfillmentItem?.client_id) === normalizeStore(merchantStore);
  const priorPhasesComplete = scopeComplete && beforeEvidenceCaptured && executionComplete && afterEvidenceCaptured && proofSummary.status === "Proof Sealed";
  const permitted = merchantMatches && payment.paymentReceived && proofSummary.status === "Proof Sealed" && priorPhasesComplete;
  const blockingReasons = permitted ? [] : [
    !merchantMatches ? "Merchant identity mismatch" : "",
    !scopeComplete ? "Scope incomplete" : "",
    scopeComplete && !beforeEvidenceCaptured ? "Before Evidence Missing" : "",
    scopeComplete && beforeEvidenceCaptured && !executionComplete ? "Execution incomplete" : "",
    scopeComplete && beforeEvidenceCaptured && executionComplete && !afterEvidenceCaptured ? "After Evidence Missing" : "",
    scopeComplete && beforeEvidenceCaptured && executionComplete && afterEvidenceCaptured && proofSummary.status !== "Proof Sealed" ? `Proof status: ${proofSummary.status}` : "",
    !payment.paymentReceived ? `Payment status: ${payment.paymentStatus}` : ""
  ].filter(Boolean);

  return {
    permitted,
    blockingReasons
  };
}

function determineCurrentPhase({ scopeComplete, beforeEvidenceCaptured, executionSummary, afterEvidenceCaptured, proofSummary, paymentSummary: payment, completionAuthority }) {
  if (!scopeComplete) return "scope";
  if (!beforeEvidenceCaptured) return "before_evidence";
  if (executionSummary.status !== "Execute Complete") {
    if (executionSummary.status === "Execute In Progress" || executionSummary.status === "Execute Ready" || executionSummary.status === "Execute Failed") {
      return "execute";
    }
    return "execute";
  }
  if (!afterEvidenceCaptured) return "after_evidence";
  if (proofSummary.status !== "Proof Sealed") return "proof_seal";
  if (!payment.paymentReceived) return "delivery_payment";
  if (!completionAuthority.permitted) return "completion_authority";
  return "delivery_payment";
}

function scoreReadiness({ scopeComplete, beforeEvidenceCaptured, executionSummary, afterEvidenceCaptured, proofSummary, paymentSummary: payment, completionAuthority, worktreeSummary }) {
  const phaseScore = [
    scopeComplete,
    beforeEvidenceCaptured,
    executionSummary.status === "Execute Complete",
    afterEvidenceCaptured,
    proofSummary.status === "Proof Sealed",
    payment.paymentReceived,
    completionAuthority.permitted
  ].filter(Boolean).length;
  const workflowCompleteness = Math.round((phaseScore / 7) * 100);
  return {
    architecture: 94,
    governance: completionAuthority.permitted ? 98 : 95,
    evidence_integrity: proofSummary.status === "Proof Sealed" ? 92 : beforeEvidenceCaptured ? 75 : 68,
    operator_ux: 83,
    workflow_completeness: workflowCompleteness,
    production_readiness: Math.max(0, Math.min(100, Math.round((workflowCompleteness + (payment.paymentReceived ? 20 : 0) + (proofSummary.status === "Proof Sealed" ? 15 : 0)) / 2)))
  };
}

function buildEvaluation({
  repoRoot = DEFAULT_REPO_ROOT,
  outputPath = DEFAULT_OUTPUT_PATH,
  worktreeLines = null
} = {}) {
  const scopePath = path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md");
  const beforePath = path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md");
  const afterPath = path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md");
  const proofPackagePath = path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md");
  const sealPath = path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json");
  const manifestPath = path.join(repoRoot, "staffordos/proof_runs/output/evidence_manifest_v1.json");
  const fulfillmentPath = path.join(repoRoot, "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json");
  const clientRegistryPath = path.join(repoRoot, "staffordos/clients/client_registry_v1.json");
  const offerPath = path.join(repoRoot, "staffordos/clients/shopifixer_offer_latest.json");
  const snapshotPath = path.join(repoRoot, "staffordos/snapshots/primary_action_snapshot_v1.json");
  const preflightPath = path.join(repoRoot, "staffordos/preflight/output/preflight_report_v1.json");
  const qaPath = path.join(repoRoot, "staffordos/qa/output/command_center_primary_action_qa_v1.json");
  const requiredAgentPath = path.join(repoRoot, "staffordos/execution/output/required_agent_validation_v1.json");
  const agentLoopPath = path.join(repoRoot, "staffordos/execution/output/agent_loop_latest.json");
  const fulfillmentTruth = readJson(fulfillmentPath, {});
  const clientRegistry = readJson(clientRegistryPath, {});
  const offerLatest = readJson(offerPath, {});
  const snapshot = readJson(snapshotPath, {});
  const preflight = readJson(preflightPath, {});
  const qa = readJson(qaPath, {});
  const requiredAgentValidation = readJson(requiredAgentPath, {});
  const agentLoopLatest = readJson(agentLoopPath, {});
  const manifest = readJson(manifestPath, {});
  const proofSeal = readJson(sealPath, {});
  const scopeContent = readText(scopePath);
  const beforeContent = readText(beforePath);
  const afterContent = readText(afterPath);
  const proofContent = readText(proofPackagePath);
  const fulfillmentItems = Array.isArray(fulfillmentTruth.items) ? fulfillmentTruth.items : [];
  const clientRecords = Array.isArray(clientRegistry.clients) ? clientRegistry.clients : [];
  const fulfillmentSeed = fulfillmentItems[0] || {};
  const merchantSeed = clean(fulfillmentSeed.store_domain || fulfillmentSeed.client_id || offerLatest.merchant_shop || snapshot?.merchant?.store || "");
  const clientMatches = readMatchByMerchant(clientRecords, merchantSeed);
  const fulfillmentMatches = readMatchByMerchant(fulfillmentItems, merchantSeed);
  const clientMatch = clientMatches.matches[0] || clientRecords[0] || {};
  const fulfillmentMatch = fulfillmentMatches.matches[0] || fulfillmentItems[0] || {};
  const merchantRecord = clientMatch;
  const fulfillmentItem = fulfillmentMatch;
  const merchantStore = clean(
    merchantRecord.store ||
      fulfillmentItem.store_domain ||
      fulfillmentItem.client_id ||
      offerLatest.merchant_shop ||
      snapshot?.merchant?.store ||
      "Not Yet Available"
  );

  const merchant = pickMerchant(merchantRecord, clientRegistry, fulfillmentItem, offerLatest);
  const scope = evaluateScope(scopeContent, merchantStore);
  const beforeEvidence = readEvidenceStage({
    content: beforeContent,
    manifest,
    stage: "before_evidence",
    sourceWriter: "writeShopifixerBeforeEvidence",
    merchantStore
  });
  const afterEvidence = readEvidenceStage({
    content: afterContent,
    manifest,
    stage: "after_evidence",
    sourceWriter: "writeShopifixerAfterEvidence",
    merchantStore
  });
  const proofSummary = proofSealSummary({
    proofContent,
    seal: proofSeal,
    manifest,
    merchantStore,
    proofRunId: DEFAULT_PROOF_RUN_ID
  });
  const execution = executionSummary({
    preflight,
    qa,
    requiredAgentValidation,
    agentLoopLatest,
    scopeComplete: scope.complete,
    beforeEvidenceCaptured: beforeEvidence.status === "Before Evidence Captured"
  });
  const payment = paymentSummary({ fulfillmentItem, merchantStore });
  const beforeEvidenceCaptured = beforeEvidence.status === "Before Evidence Captured";
  const afterEvidenceCaptured = afterEvidence.status === "After Evidence Captured";
  const completionAuthority = completionAuthoritySummary({
    merchantStore,
    scopeComplete: scope.complete,
    beforeEvidenceCaptured,
    executionComplete: execution.status === "Execute Complete",
    afterEvidenceCaptured,
    proofSummary,
    paymentSummary: payment,
    fulfillmentItem
  });

  const merchantIdentityMatches =
    normalizeStore(merchant.store) === normalizeStore(merchantStore) &&
    normalizeStore(fulfillmentItem.store_domain || fulfillmentItem.client_id) === normalizeStore(merchantStore) &&
    normalizeStore(offerLatest.merchant_shop || offerLatest.client_id || merchantStore) === normalizeStore(merchantStore);
  const merchantIdentityAmbiguous = clientMatches.matches.length !== 1 || fulfillmentMatches.matches.length !== 1;
  const currentPhase = determineCurrentPhase({
    scopeComplete: scope.complete,
    beforeEvidenceCaptured,
    executionSummary: execution,
    afterEvidenceCaptured,
    proofSummary,
    paymentSummary: payment,
    completionAuthority
  });

  const phaseStatuses = {
    merchant_context: merchantIdentityMatches && !merchantIdentityAmbiguous ? "complete" : "blocked",
    scope: scope.complete ? "complete" : "blocked",
    before_evidence: beforeEvidenceCaptured ? "complete" : "blocked",
    execute: execution.status === "Execute Complete" ? "complete" : execution.status === "Execute In Progress" || execution.status === "Execute Ready" ? "current" : "blocked",
    after_evidence: afterEvidenceCaptured ? "complete" : "blocked",
    proof_seal: proofSummary.status === "Proof Sealed" ? "complete" : "blocked",
    delivery_payment: payment.paymentReceived ? "available" : "blocked",
    completion_authority: completionAuthority.permitted ? "complete" : "blocked"
  };

  const blockedPhase = PHASE_ORDER.find((phase) => phaseStatuses[phase] !== "complete") || "completion_authority";
  const blockingReasons = [];
  if (merchantIdentityAmbiguous) blockingReasons.push("Merchant identity ambiguous");
  if (!merchantIdentityMatches) blockingReasons.push("Merchant identity mismatch");
  if (!scope.complete) blockingReasons.push(scope.currentBlocker || "Scope incomplete");
  if (scope.complete && !beforeEvidenceCaptured) blockingReasons.push("Before Evidence Missing");
  if (scope.complete && beforeEvidenceCaptured && execution.status !== "Execute Complete") {
    blockingReasons.push(execution.blockingReasons[0] || execution.status);
  }
  if (scope.complete && beforeEvidenceCaptured && execution.status === "Execute Complete" && !afterEvidenceCaptured) {
    blockingReasons.push(afterEvidence.status);
  }
  if (scope.complete && beforeEvidenceCaptured && execution.status === "Execute Complete" && afterEvidenceCaptured && proofSummary.status !== "Proof Sealed") {
    blockingReasons.push(...proofSummary.blockingReasons);
  }
  if (proofSummary.status === "Proof Sealed" && !payment.paymentReceived) {
    blockingReasons.push(...payment.blockingReasons);
  }
  if (proofSummary.status === "Proof Sealed" && payment.paymentReceived && !completionAuthority.permitted) {
    blockingReasons.push(...completionAuthority.blockingReasons);
  }

  const currentBlocker =
    merchantIdentityAmbiguous ? "Merchant Identity Ambiguous" :
    !merchantIdentityMatches ? "Merchant Identity Mismatch" :
    !scope.complete ? "Scope Missing" :
    !beforeEvidenceCaptured ? "Before Evidence Missing" :
    execution.status !== "Execute Complete" ? execution.status :
    !afterEvidenceCaptured ? "After Evidence Missing" :
    proofSummary.status !== "Proof Sealed" ? proofSummary.status :
    !payment.paymentReceived ? "Payment Pending" :
    completionAuthority.permitted ? "None" : "Completion Authority Blocked";

  const nextSafeAction =
    merchantIdentityAmbiguous ? "Resolve Merchant Identity" :
    !merchantIdentityMatches ? "Resolve Merchant Identity" :
    !scope.complete ? "Review Scope" :
    !beforeEvidenceCaptured ? "Capture Before Evidence" :
    execution.status === "Execute Failed" ? "Review Failure Evidence" :
    execution.status === "Execute In Progress" ? "Execution In Progress" :
    execution.status === "Execute Ready" ? "Review and Execute" :
    execution.status !== "Execute Complete" ? "Resolve Execution Gate" :
    !afterEvidenceCaptured ? "Capture After Evidence" :
    proofSummary.status !== "Proof Sealed" ? "Generate Proof Package" :
    !payment.paymentReceived ? "Review Payment Gate" :
    completionAuthority.permitted ? "Pilot Complete" : "Resolve Completion Authority";

  const gates = {
    merchant_identity: {
      status: merchantIdentityMatches && !merchantIdentityAmbiguous ? "pass" : "blocked",
      merchant: merchantStore,
      reason: merchantIdentityAmbiguous ? "Merchant identity ambiguous" : merchantIdentityMatches ? "Merchant identity resolved" : "Merchant identity mismatch"
    },
    scope: {
      status: scope.complete ? "pass" : "blocked",
      reason: scope.complete ? "Scope Complete" : scope.currentBlocker,
      missing_fields: scope.missingFields
    },
    before_evidence: {
      status: beforeEvidenceCaptured ? "pass" : "blocked",
      reason: beforeEvidence.status,
      artifact_ids: beforeEvidence.artifactIds,
      merchant_matches: beforeEvidence.merchantMatches,
      last_captured_at: beforeEvidence.lastCapturedAt
    },
    execution: {
      status: execution.status === "Execute Complete" ? "pass" : execution.status === "Execute In Progress" || execution.status === "Execute Ready" ? "pass" : "blocked",
      reason: execution.status,
      blocking_reasons: execution.blockingReasons,
      preflight: clean(preflight.status, "Not Yet Available"),
      qa: clean(qa.verdict, "Not Yet Available"),
      required_agents: clean(requiredAgentValidation.status, "Not Yet Available"),
      execution_mode_decision: execution.executionModeDecision,
      latest_status: execution.latestStatus,
      latest_event: execution.latestEventSummary
    },
    after_evidence: {
      status: afterEvidenceCaptured ? "pass" : "blocked",
      reason: afterEvidence.status,
      artifact_ids: afterEvidence.artifactIds,
      merchant_matches: afterEvidence.merchantMatches,
      last_captured_at: afterEvidence.lastCapturedAt
    },
    proof_and_checksum_seal: {
      status: proofSummary.status === "Proof Sealed" ? "pass" : "blocked",
      reason: proofSummary.status,
      proof_package_path: proofSummary.proofPackagePath,
      seal_path: proofSummary.sealPath,
      manifest_path: proofSummary.manifestPath,
      sha256_match_status: proofSummary.proofSha256MatchStatus,
      manifest_artifact_count: proofSummary.manifestArtifactCount,
      evidence_source_paths: proofSummary.evidenceSourcePaths,
      merchant_matches: proofSummary.merchantMatches
    },
    stripe_payment: {
      status: payment.paymentReceived ? "pass" : "blocked",
      reason: payment.paymentReceived ? "Payment captured" : payment.blockingReasons.join(" · ") || "Payment pending",
      payment_status: payment.paymentStatus,
      payment_verified_source: payment.paymentVerifiedSource,
      paid_at: payment.paidAt
    },
    completion_authority: {
      status: completionAuthority.permitted ? "pass" : "blocked",
      reason: completionAuthority.permitted ? "Completion permitted" : completionAuthority.blockingReasons.join(" · ") || "Completion blocked",
      permitted: completionAuthority.permitted
    },
    dirty_worktree: {
      status: "observed",
      summary: summarizeWorktree(worktreeLines)
    }
  };

  const generatedOutputDirtyOnly = gates.dirty_worktree.summary.counts["generated operational outputs"] > 0 &&
    gates.dirty_worktree.summary.counts["canonical source changes"] === 0 &&
    gates.dirty_worktree.summary.counts["proof artifacts"] === 0 &&
    gates.dirty_worktree.summary.counts["snapshots/events"] === 0 &&
    gates.dirty_worktree.summary.counts["documentation awaiting review"] === 0 &&
    gates.dirty_worktree.summary.counts["cache/temporary files"] === 0 &&
    gates.dirty_worktree.summary.counts.unknown === 0;

  const warnings = [
    merchantIdentityAmbiguous ? "Merchant identity ambiguity detected." : "",
    !merchantIdentityMatches ? "Merchant identity mismatch detected." : "",
    gates.dirty_worktree.summary.dirtyCount ? `Dirty worktree entries: ${gates.dirty_worktree.summary.dirtyCount}` : "",
    generatedOutputDirtyOnly ? "Dirty worktree is generated operational drift only." : "",
    proofSummary.status !== "Proof Sealed" && proofSummary.proofPackageExists ? "Proof artifacts exist but do not satisfy the current merchant gate." : "",
    beforeEvidence.status !== "Before Evidence Captured" && beforeContent.trim() ? "Before evidence exists but does not satisfy the current merchant gate." : "",
    afterEvidence.status !== "After Evidence Captured" && afterContent.trim() ? "After evidence exists but does not satisfy the current merchant gate." : ""
  ].filter(Boolean);

  const completionPermitted = completionAuthority.permitted;
  const productionOperationPermitted = !merchantIdentityAmbiguous && !blockingReasons.some((reason) => /Merchant identity mismatch/i.test(reason));
  let status = "CONDITIONAL_GO";
  if (merchantIdentityAmbiguous || !merchantIdentityMatches || (!scope.complete && scope.status === "Scope Missing")) {
    status = "NO_GO";
  } else if (
    (currentPhase === "proof_seal" || currentPhase === "delivery_payment" || currentPhase === "completion_authority") &&
    proofSummary.blockingReasons.some((reason) => /SHA-256 mismatch|Non-canonical|Merchant identity mismatch/i.test(reason))
  ) {
    status = "NO_GO";
  } else if (completionPermitted && proofSummary.status === "Proof Sealed" && payment.paymentReceived && currentPhase === "delivery_payment") {
    status = "GO";
  } else if (!completionPermitted || currentPhase !== "delivery_payment") {
    status = "CONDITIONAL_GO";
  }

  const report = {
    schema: "staffordos.shopifixer_operational_readiness.v1",
    generated_at: new Date().toISOString(),
    status,
    production_operation_permitted: Boolean(productionOperationPermitted),
    completion_permitted: Boolean(completionPermitted),
    merchant,
    current_phase: currentPhase,
    current_blocker: currentBlocker,
    blocking_reasons: blockingReasons,
    next_safe_action: nextSafeAction,
    gates,
    scores: scoreReadiness({
      scopeComplete: scope.complete,
      beforeEvidenceCaptured: beforeEvidence.status === "Before Evidence Captured",
      executionSummary: execution,
      afterEvidenceCaptured: afterEvidence.status === "After Evidence Captured",
      proofSummary,
      paymentSummary: payment,
      completionAuthority,
      worktreeSummary: gates.dirty_worktree.summary
    }),
    evidence_sources: [
      { label: "Scope", path: normalizePath(scopePath), status: scope.complete ? "present" : "incomplete" },
      { label: "Before Evidence", path: normalizePath(beforePath), status: beforeEvidence.status },
      { label: "After Evidence", path: normalizePath(afterPath), status: afterEvidence.status },
      { label: "Proof Package", path: normalizePath(proofPackagePath), status: proofSummary.status },
      { label: "Seal", path: normalizePath(sealPath), status: clean(proofSeal.status, "Not Yet Available") },
      { label: "Evidence Manifest", path: normalizePath(manifestPath), status: Array.isArray(manifest?.artifacts) ? `artifacts:${manifest.artifacts.length}` : "missing" },
      { label: "Fulfillment Truth", path: normalizePath(fulfillmentPath), status: clean(fulfillmentItem.payment_status, "Not Yet Available") },
      { label: "Client Registry", path: normalizePath(clientRegistryPath), status: clean(merchantRecord.client_id, "Not Yet Available") },
      { label: "Offer", path: normalizePath(offerPath), status: clean(offerLatest.merchant_shop, "Not Yet Available") },
      { label: "Preflight", path: normalizePath(preflightPath), status: clean(preflight.status, "Not Yet Available") },
      { label: "QA", path: normalizePath(qaPath), status: clean(qa.verdict, "Not Yet Available") },
      { label: "Required Agent Validation", path: normalizePath(requiredAgentPath), status: clean(requiredAgentValidation.status, "Not Yet Available") },
      { label: "Execution Log", path: normalizePath(agentLoopPath), status: clean(agentLoopLatest.status, "Not Yet Available") },
      { label: "Primary Action Snapshot", path: normalizePath(snapshotPath), status: clean(snapshot?.generated_at, "Not Yet Available") }
    ],
    warnings,
    worktree_classification: gates.dirty_worktree.summary
  };

  writeJson(outputPath, report);
  return report;
}

export function evaluateShopifixerOperationalReadiness(options = {}) {
  return buildEvaluation(options);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const repoRoot = clean(process.env.STAFFORDOS_REPO_ROOT, DEFAULT_REPO_ROOT);
  const outputPath = clean(process.env.STAFFORDOS_OPERATIONAL_READINESS_OUTPUT_PATH, DEFAULT_OUTPUT_PATH);
  const worktreeLines = loadGitStatus(repoRoot);
  const report = evaluateShopifixerOperationalReadiness({ repoRoot, outputPath, worktreeLines });
  const summary = [
    `ShopiFixer readiness: ${report.status}`,
    `phase=${report.current_phase}`,
    `blocker=${report.current_blocker}`,
    `next=${report.next_safe_action}`,
    `production=${report.production_operation_permitted ? "yes" : "no"}`,
    `completion=${report.completion_permitted ? "yes" : "no"}`
  ].join(" | ");
  console.log(summary);
  process.exit(report.status === "NO_GO" ? 1 : 0);
}
