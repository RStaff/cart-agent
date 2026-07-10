import fs from "node:fs";
import path from "node:path";

import { redirect } from "next/navigation";
import { ShopifixerPilotWorkspace } from "../../../components/operator/ShopifixerPilotWorkspace";
import { loadShopifixerCommandCenter } from "../../../lib/operator/loadShopifixerCommandCenter";
import { loadOperatorLeads } from "../../../lib/leads/loadOperatorLeads";
import { getCampaignResolverReport } from "../../../lib/operator/campaignResolver";
import { loadPreflightReport } from "../../../lib/operator/loadPreflightReport";
import { loadCommandCenterQaReport } from "../../../lib/operator/loadCommandCenterQaReport";
import { writeShopifixerBeforeEvidence } from "../../../lib/operator/writeShopifixerBeforeEvidence";
import { writeShopifixerAfterEvidence } from "../../../lib/operator/writeShopifixerAfterEvidence";
import { writeShopifixerScopedFix } from "../../../lib/operator/writeShopifixerScopedFix";

type ProofFile = {
  label: string;
  path: string;
};

type PhaseState = "available" | "current" | "blocked" | "complete";

const PROOF_RUN_ROOT = "staffordos/proof_runs/internal_shopifixer_dry_run_v1";
const PROOF_FILES: ProofFile[] = [
  { label: "Before evidence", path: `${PROOF_RUN_ROOT}/before_evidence.md` },
  { label: "After evidence", path: `${PROOF_RUN_ROOT}/after_evidence.md` },
  { label: "Scoped fix", path: `${PROOF_RUN_ROOT}/fix_scope.md` },
  { label: "Proof package", path: `${PROOF_RUN_ROOT}/merchant_proof_package.md` },
  { label: "Checksum seal", path: `${PROOF_RUN_ROOT}/merchant_proof_package.seal.json` },
  { label: "Evidence manifest", path: "staffordos/proof_runs/output/evidence_manifest_v1.json" },
];

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "staffordos/proof_runs/output/evidence_manifest_v1.json"))) return cwd;

  const fromFrontend = path.resolve(cwd, "../../..");
  if (fs.existsSync(path.join(fromFrontend, "staffordos/proof_runs/output/evidence_manifest_v1.json"))) {
    return fromFrontend;
  }

  return fromFrontend;
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function text(value: unknown, fallback = "Not Yet Implemented") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function money(value: unknown, fallback = "Not Yet Available") {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return `$${Math.round(numberValue).toLocaleString()}`;
}

function normalizeKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function findMatchingRecord<T extends Record<string, any>>(records: T[], merchantKey: string) {
  const normalizedMerchant = normalizeKey(merchantKey);
  return (
    records.find((record) =>
      [record.client_id, record.merchant_shop, record.store_domain, record.domain, record.id, record.lead_id]
        .map(normalizeKey)
        .includes(normalizedMerchant)
    ) || null
  );
}

function merchantContextFallback(value: unknown) {
  return text(value, "Not Yet Available");
}

function readText(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function parseScopeSummary(content: string) {
  const lines = String(content || "").split(/\r?\n/);

  function valueAfter(label: string) {
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

  function listAfter(label: string) {
    const index = lines.findIndex((line) => line.trim() === label);
    if (index < 0) return [];
    const items: string[] = [];
    for (let i = index + 1; i < lines.length; i += 1) {
      const candidate = lines[i].trim();
      if (!candidate) continue;
      if (/^[A-Za-z][A-Za-z /&-]+:$/.test(candidate)) break;
      items.push(candidate.replace(/^-+\s*/, ""));
    }
    return items;
  }

  return {
    issue: valueAfter("Scoped Fix:") || valueAfter("Issue:") || "Not Yet Available",
    proposedFix: valueAfter("Scoped Fix:") || "Not Yet Available",
    inScope: listAfter("In Scope:"),
    outOfScope: listAfter("Out of Scope:"),
    merchantApprovalNeeded: valueAfter("Merchant Approval Needed:") || "Not Yet Available",
    successCriteria: valueAfter("Success Criteria:") || "Not Yet Available",
    sourceState: content.trim() ? "fix_scope.md present" : "fix_scope.md missing"
  };
}

function parseEvidenceFields(content: string) {
  const lines = String(content || "").split(/\r?\n/);

  function valueAfter(label: string) {
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

  return {
    issue: valueAfter("Issue:") || "Not Yet Available",
    whyItMatters: valueAfter("Why It Matters:") || "Not Yet Available",
    screenshot: valueAfter("Screenshot:") || "Not Yet Available",
    notes: valueAfter("Notes:") || "Not Yet Available",
    observedImprovement: valueAfter("Observed Improvement:") || "Not Yet Available",
    merchantFacingSummary: valueAfter("Merchant-Facing Summary:") || "Not Yet Available",
    remainingLimitations: valueAfter("Remaining Limitations:") || "Not Yet Available"
  };
}

function phaseStatus(index: number, currentIndex: number): "ready" | "in_progress" | "blocked" | "complete" {
  if (index < currentIndex) return "complete";
  if (index === currentIndex) return "in_progress";
  if (index === currentIndex + 1) return "ready";
  return "blocked";
}

function normalizePhaseKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
}

function resolvePhaseKey(value: unknown) {
  const key = normalizePhaseKey(value);
  const allowed = new Set([
    "merchant_context",
    "scope",
    "before_evidence",
    "execute",
    "after_evidence",
    "proof_seal",
    "delivery"
  ]);
  return allowed.has(key) ? key : "merchant_context";
}

function phaseHref(key: string) {
  return `/operator/shopifixer-pilot?phase=${key.replace(/_/g, "-")}`;
}

const PHASE_KEYS = [
  "merchant_context",
  "scope",
  "before_evidence",
  "execute",
  "after_evidence",
  "proof_seal",
  "delivery"
] as const;

type ShopifixerPilotSearchParams = {
  phase?: string | string[];
  shopifixer_scoped_fix_saved?: string;
  shopifixer_before_saved?: string;
  shopifixer_after_saved?: string;
};

export default async function ShopifixerPilotPage({ searchParams }: { searchParams?: ShopifixerPilotSearchParams }) {
  const repoRoot = resolveRepoRoot();
  const shopifixer = await loadShopifixerCommandCenter();
  const shopifixerRecord = shopifixer as any;
  const leadData = await loadOperatorLeads();
  const campaignReport = getCampaignResolverReport();
  const preflight = loadPreflightReport();
  const qa = loadCommandCenterQaReport();
  const executionLog = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/execution/execution_log_v1.json"),
    {}
  );
  const outcomeEventLog = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/events/outcome_event_log_v1.json"),
    {}
  );
  const primaryActionSnapshot = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/snapshots/primary_action_snapshot_v1.json"),
    {}
  );
  const agentLoopLatest = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/execution/output/agent_loop_latest.json"),
    {}
  );
  const requiredAgentValidation = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/execution/output/required_agent_validation_v1.json"),
    {}
  );
  const campaignAttributionReport = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/qa/output/campaign_attribution_report_v1.json"),
    {}
  );
  const clientRegistry = readJson<{ clients?: Array<Record<string, any>> }>(
    path.join(repoRoot, "staffordos/clients/client_registry_v1.json"),
    {}
  );
  const leadRegistry = readJson<{ items?: Array<Record<string, any>> }>(
    path.join(repoRoot, "staffordos/leads/lead_registry_v1.json"),
    {}
  );
  const offerLatest = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/clients/shopifixer_offer_latest.json"),
    {}
  );
  const operatorDashboard = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/clients/operator_dashboard_snapshot_v1.json"),
    {}
  );
  const scopeFilePath = path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md");
  const scopeFileContent = readText(scopeFilePath);
  const scopeSummary = parseScopeSummary(scopeFileContent);
  const scopeWorkbenchSaved = (searchParams as { shopifixer_scoped_fix_saved?: string } | undefined)?.shopifixer_scoped_fix_saved === "1";
  const scopeWorkbenchDate = new Date().toISOString().slice(0, 10);
  const beforeEvidencePath = path.join(repoRoot, `${PROOF_RUN_ROOT}/before_evidence.md`);
  const beforeEvidenceContent = readText(beforeEvidencePath);
  const beforeEvidenceFields = parseEvidenceFields(beforeEvidenceContent);
  const beforeEvidenceWorkbenchSaved = (searchParams as { shopifixer_before_saved?: string } | undefined)?.shopifixer_before_saved === "1";
  const beforeEvidenceWorkbenchDate = new Date().toISOString().slice(0, 10);
  const afterEvidencePath = path.join(repoRoot, `${PROOF_RUN_ROOT}/after_evidence.md`);
  const afterEvidenceContent = readText(afterEvidencePath);
  const afterEvidenceFields = parseEvidenceFields(afterEvidenceContent);
  const afterEvidenceWorkbenchSaved = (searchParams as { shopifixer_after_saved?: string } | undefined)?.shopifixer_after_saved === "1";
  const afterEvidenceWorkbenchDate = new Date().toISOString().slice(0, 10);
  const evidenceManifest = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/proof_runs/output/evidence_manifest_v1.json"),
    {}
  );
  const proofSeal = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json"),
    {}
  );
  const proofPackagePath = path.join(repoRoot, `${PROOF_RUN_ROOT}/merchant_proof_package.md`);
  const proofPackageContent = readText(proofPackagePath);
  const proofPackageManifestPath = text(proofSeal.manifest_path, "Not Yet Available");
  const manifestArtifactCount = Array.isArray(evidenceManifest.artifacts) ? evidenceManifest.artifacts.length : Number(proofSeal.manifest_artifact_count || 0);
  const missingScreenshotArtifactCount = Array.isArray(evidenceManifest.artifacts)
    ? evidenceManifest.artifacts.reduce((count, artifact: any) => {
        const screenshots = Array.isArray(artifact?.screenshot_artifacts) ? artifact.screenshot_artifacts : [];
        return count + screenshots.filter((item: any) => String(item?.status || "").trim() === "referenced_missing").length;
      }, 0)
    : 0;
  const proofSha256 = text(proofSeal.sha256, "Not Yet Available");
  const proofSha256MatchStatus = proofPackageContent && proofSha256 !== "Not Yet Available"
    ? "Match"
    : "Not Yet Available";
  const proofAndSealStatus = !proofPackageContent.trim()
    ? "Proof Missing"
    : String(proofSeal.status || "").trim().toLowerCase() === "sealed"
      ? "Proof Sealed"
      : proofSeal.sha256
        ? "Proof Drafted"
        : "Proof Invalid";

  const commandCenterMerchant = shopifixerRecord.merchant || {};
  const packet = shopifixerRecord.checkout_linkage || {};
  const customerOutcome = Array.isArray(shopifixerRecord.customer_outcomes) ? shopifixerRecord.customer_outcomes[0] : null;
  const merchantKey = text(commandCenterMerchant.store || commandCenterMerchant.client_id);
  const clientRecords = Array.isArray(clientRegistry.clients) ? clientRegistry.clients : [];
  const leadRecords = Array.isArray(leadRegistry.items) ? leadRegistry.items : [];
  const merchantClient = findMatchingRecord(clientRecords, merchantKey);
  const merchantLead = findMatchingRecord(leadRecords, merchantKey);
  const currentOffer = offerLatest && normalizeKey(offerLatest.merchant_shop || offerLatest.client_id) === normalizeKey(merchantKey)
    ? offerLatest.offer || null
    : null;
  const attributionTotals = campaignAttributionReport.totals || {};
  const currentRevenueGap = Array.isArray(operatorDashboard.revenue_gaps) ? operatorDashboard.revenue_gaps[0] : null;
  const scopeMissingFields = !scopeFileContent.trim()
    ? ["fix_scope.md"]
    : [
        scopeSummary.issue === "Not Yet Available" ? "Issue" : "",
        scopeSummary.proposedFix === "Not Yet Available" ? "Scoped Fix" : "",
        scopeSummary.inScope.length ? "" : "In Scope",
        scopeSummary.outOfScope.length ? "" : "Out of Scope",
        scopeSummary.merchantApprovalNeeded === "Not Yet Available" ? "Merchant Approval Needed" : "",
        scopeSummary.successCriteria === "Not Yet Available" ? "Success Criteria" : ""
      ].filter(Boolean);
  const scopeComplete = Boolean(scopeFileContent.trim()) && scopeMissingFields.length === 0;
  const scopeStatus = !scopeFileContent.trim()
    ? "Scope Missing"
    : scopeComplete
      ? "Scope Complete"
      : String(scopeSummary.merchantApprovalNeeded).trim().toLowerCase() === "yes"
        ? "Scope Ready for Approval"
        : "Scope Drafted";
  const beforeEvidenceArtifacts = Array.isArray(evidenceManifest.artifacts)
    ? evidenceManifest.artifacts.filter(
        (artifact: any) =>
          String(artifact?.stage || "").trim() === "before_evidence" &&
          String(artifact?.source_writer || "").trim() === "writeShopifixerBeforeEvidence"
      )
    : [];
  const beforeEvidenceCaptured = beforeEvidenceArtifacts.length > 0;
  const beforeEvidenceLatest = beforeEvidenceArtifacts[beforeEvidenceArtifacts.length - 1] || null;
  const beforeEvidenceArtifactIds = beforeEvidenceArtifacts.map((artifact: any) => String(artifact?.artifact_id || "").trim()).filter(Boolean);
  const beforeEvidenceScreenshotArtifacts = Array.isArray(beforeEvidenceLatest?.screenshot_artifacts)
    ? beforeEvidenceLatest.screenshot_artifacts
    : [];
  const beforeEvidenceStatus = !beforeEvidenceContent.trim()
    ? "Before Evidence Missing"
    : beforeEvidenceArtifacts.length
      ? "Before Evidence Captured"
      : "Before Evidence Drafted";
  const beforeEvidenceLastCapturedAt = beforeEvidenceLatest?.created_at || "Not Yet Available";
  const afterEvidenceArtifacts = Array.isArray(evidenceManifest.artifacts)
    ? evidenceManifest.artifacts.filter(
        (artifact: any) =>
          String(artifact?.stage || "").trim() === "after_evidence" &&
          String(artifact?.source_writer || "").trim() === "writeShopifixerAfterEvidence"
      )
    : [];
  const afterEvidenceCaptured = afterEvidenceArtifacts.length > 0;
  const afterEvidenceLatest = afterEvidenceArtifacts[afterEvidenceArtifacts.length - 1] || null;
  const afterEvidenceArtifactIds = afterEvidenceArtifacts.map((artifact: any) => String(artifact?.artifact_id || "").trim()).filter(Boolean);
  const afterEvidenceScreenshotArtifacts = Array.isArray(afterEvidenceLatest?.screenshot_artifacts)
    ? afterEvidenceLatest.screenshot_artifacts
    : [];
  const afterEvidenceStatus = !afterEvidenceContent.trim()
    ? "After Evidence Missing"
    : afterEvidenceCaptured
      ? "After Evidence Captured"
      : "After Evidence Drafted";
  const afterEvidenceLastCapturedAt = afterEvidenceLatest?.created_at || "Not Yet Available";
  const latestExecutionEvent = Array.isArray(executionLog.events) ? executionLog.events[0] || null : null;
  const latestOutcomeEvent = Array.isArray(outcomeEventLog.events) ? outcomeEventLog.events[0] || null : null;
  const scopeReady = scopeStatus === "Scope Ready for Approval";
  const preflightGo = String(preflight.status || "").trim().toUpperCase() === "GO";
  const qaPass = String(qa.verdict || "").trim().toUpperCase() === "PASS";
  const requiredAgentsGo = String(requiredAgentValidation.status || "").trim().toUpperCase() === "GO";
  const executionBlocked = String(agentLoopLatest.status || "").toUpperCase().includes("BLOCKED");
  const executionInProgress = /RUNNING|IN_PROGRESS/i.test(String(agentLoopLatest.status || ""));
  const executionComplete = /COMPLETE/i.test(String(agentLoopLatest.status || latestExecutionEvent?.outcome || ""));
  const currentOfferReady = Boolean(currentOffer);
  const paymentCollected = merchantClient?.revenue?.shopifixer_collected === true || String(packet.status || "").toLowerCase().includes("paid");
  const deliveryProofReadyStatus = proofAndSealStatus === "Proof Sealed"
    ? "Ready to Send"
    : proofAndSealStatus === "Proof Drafted" || proofAndSealStatus === "Proof Missing"
      ? "Waiting for Proof"
      : "Not Yet Available";
  const deliveryMerchantStatus = proofAndSealStatus === "Proof Missing"
    ? "Waiting for Proof"
    : paymentCollected
      ? "Ready for Completion"
      : "Payment Pending";
  const deliveryOfferStatus = currentOffer ? "Waiting for Merchant" : "Not Yet Available";
  const deliveryPaymentStatus = paymentCollected ? "Complete" : "Payment Pending";
  const deliveryCompletionReadiness = proofAndSealStatus === "Proof Sealed"
    ? (paymentCollected ? "Complete" : "Ready for Completion")
    : proofAndSealStatus === "Proof Missing"
      ? "Waiting for Proof"
      : "Waiting for Merchant";
  const executeStatus = executionComplete
    ? "Execute Complete"
    : executionInProgress
      ? "Execute In Progress"
      : executionBlocked || !scopeReady || !preflightGo || !qaPass || !requiredAgentsGo
        ? "Execute Blocked"
        : "Execute Ready";
  const rollbackAvailability = executionComplete
    ? "Not Yet Available"
    : latestExecutionEvent
      ? "Available"
      : "Not Yet Available";
  const fixScopeReadiness = !scopeFileContent.trim()
    ? "Scope Missing"
    : scopeStatus;
  const latestProofRun =
    text(proofSeal.proof_run_id, "") && text(proofSeal.proof_run_id, "") !== "Not Yet Implemented"
      ? `${text(proofSeal.proof_run_id)} · ${text(proofSeal.generated_at)}`
      : "Not Yet Available";
  const latestValidationStatus = [
    text(preflight.status, "Not Yet Available"),
    text(qa.verdict, "Not Yet Available"),
    fs.existsSync(path.join(repoRoot, "staffordos/proof_runs/output/evidence_manifest_v1.json")) ? "manifest present" : "manifest missing",
    fs.existsSync(path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json"))
      ? "seal present"
      : "seal missing"
  ].join(" · ");
  const proofFileStatuses = PROOF_FILES.map((file) => ({
    label: file.label,
    value: fs.existsSync(path.join(repoRoot, file.path)) ? "Present" : "Missing"
  }));

  const evidenceManifestPath = path.join(repoRoot, "staffordos/proof_runs/output/evidence_manifest_v1.json");
  const sealPath = path.join(repoRoot, `${PROOF_RUN_ROOT}/merchant_proof_package.seal.json`);
  const selectedPhaseKey = resolvePhaseKey(Array.isArray(searchParams?.phase) ? searchParams?.phase[0] : searchParams?.phase);
  const phaseTruth = {
    merchant_context: Boolean(commandCenterMerchant.store || commandCenterMerchant.client_id),
    scope: scopeComplete,
    before_evidence: beforeEvidenceCaptured,
    execute: scopeReady && preflightGo && qaPass && requiredAgentsGo && !executionBlocked,
    after_evidence: afterEvidenceCaptured,
    proof_seal: Boolean(proofPackageContent.trim()) && String(proofSeal.status || "").trim().toLowerCase() === "sealed" && proofSha256MatchStatus === "Match",
    delivery: currentOfferReady && paymentCollected && Boolean(proofPackageContent.trim()) && String(proofSeal.status || "").trim().toLowerCase() === "sealed"
  } as const;
  const phaseDefinitions = [
    {
      key: "merchant_context",
      label: "Merchant Context",
      blockedReason: "Merchant context truth missing",
      nextSafeAction: "Review Scope",
      authority: "client_registry_v1.json / lead_registry_v1.json / shopifixer command center",
      ctaLabel: "Review Scope",
      ctaHref: phaseHref("scope"),
      note: "Load merchant, lead, campaign, packet, and revenue truth."
    },
    {
      key: "scope",
      label: "Scope",
      blockedReason: !scopeFileContent.trim()
        ? "Scope Missing"
        : scopeComplete
          ? "Scope Complete"
          : `Missing fields: ${scopeMissingFields.join(", ")}`,
      nextSafeAction: scopeComplete ? "Continue to Before Evidence" : "Review Scope",
      authority: "fix_scope.md / shopifixer_offer_latest.json",
      ctaLabel: scopeComplete ? "Continue to Before Evidence" : "Review Scope",
      ctaHref: scopeComplete ? phaseHref("before_evidence") : phaseHref("scope"),
      note: scopeSummary.sourceState
    },
    {
      key: "before_evidence",
      label: "Before Evidence",
      blockedReason: !scopeComplete
        ? "Scope incomplete"
        : beforeEvidenceStatus,
      nextSafeAction: !scopeComplete
        ? "Review Scope"
        : beforeEvidenceCaptured
          ? "Continue to Execute"
          : "Capture Before Evidence",
      authority: "before_evidence.md / evidence_manifest_v1.json",
      ctaLabel: !scopeComplete
        ? "Complete Scope"
        : beforeEvidenceCaptured
          ? "Continue to Execute"
          : "Capture Before Evidence",
      ctaHref: !scopeComplete
        ? phaseHref("scope")
        : beforeEvidenceCaptured
          ? phaseHref("execute")
          : phaseHref("before-evidence"),
      note: beforeEvidenceStatus
    },
    {
      key: "execute",
      label: "Execute",
      blockedReason: executionBlocked
        ? "Execution Mode Blocked"
        : !scopeReady
          ? "Scope Missing"
          : !preflightGo
            ? "Preflight Not GO"
            : !qaPass
              ? "QA Not PASS"
              : !requiredAgentsGo
                ? "Required Agents Not GO"
                : "Execution truth unavailable",
      nextSafeAction: "Open After Evidence Workbench",
      authority: "execution_log_v1.json / outcome_event_log_v1.json / preflight_report_v1.json / command_center_primary_action_qa_v1.json",
      ctaLabel: "Open After Evidence Workbench",
      ctaHref: phaseHref("after_evidence"),
      note: executeStatus
    },
    {
      key: "after_evidence",
      label: "After Evidence",
      blockedReason: !scopeComplete
        ? "Scope incomplete"
        : !beforeEvidenceCaptured
          ? "Before Evidence Missing"
          : !executeStatus.includes("Complete")
            ? "Execution incomplete"
            : afterEvidenceStatus,
      nextSafeAction: !scopeComplete
        ? "Review Scope"
        : !beforeEvidenceCaptured
          ? "Capture Before Evidence"
          : !executeStatus.includes("Complete")
            ? "Review Execution Readiness"
            : afterEvidenceCaptured
              ? "Continue to Proof & Seal"
              : "Capture After Evidence",
      authority: "after_evidence.md / evidence_manifest_v1.json",
      ctaLabel: !scopeComplete
        ? "Complete Scope"
        : !beforeEvidenceCaptured
          ? "Capture Before Evidence"
          : !executeStatus.includes("Complete")
            ? "Review Execution Readiness"
            : afterEvidenceCaptured
              ? "Continue to Proof & Seal"
              : "Capture After Evidence",
      ctaHref: !scopeComplete
        ? phaseHref("scope")
        : !beforeEvidenceCaptured
          ? phaseHref("before-evidence")
          : !executeStatus.includes("Complete")
            ? phaseHref("execute")
            : afterEvidenceCaptured
              ? phaseHref("proof-seal")
              : phaseHref("after-evidence"),
      note: afterEvidenceStatus
    },
    {
      key: "proof_seal",
      label: "Proof & Seal",
      blockedReason: proofAndSealStatus,
      nextSafeAction: "Review Payment Gate",
      authority: "merchant_proof_package.md / merchant_proof_package.seal.json / evidence_manifest_v1.json",
      ctaLabel: "Review Payment Gate",
      ctaHref: phaseHref("delivery"),
      note: proofAndSealStatus
    },
    {
      key: "delivery",
      label: "Delivery & Payment Gate",
      blockedReason: deliveryCompletionReadiness === "Waiting for Merchant"
        ? "Payment Pending"
        : deliveryCompletionReadiness === "Ready for Completion"
          ? "Ready for Completion"
          : "Not Yet Available",
      nextSafeAction: "Review Payment Gate",
      authority: "shopifixer_offer_latest.json / operator_dashboard_snapshot_v1.json / merchant_proof_package.seal.json",
      ctaLabel: "Review Payment Gate",
      ctaHref: "/operator/revenue-command",
      note: deliveryCompletionReadiness
    }
  ] as const;
  const selectedPhaseIndex = PHASE_KEYS.indexOf(selectedPhaseKey as (typeof PHASE_KEYS)[number]);
  const phaseItems = phaseDefinitions.map((phase, index) => {
    const truthComplete = phaseTruth[phase.key as keyof typeof phaseTruth];
    let state: PhaseState = "blocked";

    if (phase.key === selectedPhaseKey && (phase.key !== "before_evidence" || scopeComplete)) {
      state = "current";
    } else if (phase.key === selectedPhaseKey && phase.key === "before_evidence" && !scopeComplete) {
      state = "blocked";
    } else if (truthComplete && index < selectedPhaseIndex) {
      state = "complete";
    } else if (truthComplete) {
      state = "available";
    }

    return {
      ...phase,
      state,
      status: state,
      href: phaseHref(phase.key),
      note: state === "blocked" ? phase.blockedReason : phase.nextSafeAction
    };
  });
  const activePhase = phaseItems.find((phase) => phase.key === selectedPhaseKey) || phaseItems[0];
  const selectedPhaseTruthComplete = phaseTruth[selectedPhaseKey as keyof typeof phaseTruth];
  const recommendedPhase = selectedPhaseTruthComplete
    ? phaseItems.find((phase, index) => index > selectedPhaseIndex && phase.state !== "complete") || activePhase
    : phaseItems.find((phase) => phase.state !== "complete") || activePhase;
  return (
    <ShopifixerPilotWorkspace
      merchant={{
        store: text(commandCenterMerchant.store),
        clientId: text(commandCenterMerchant.client_id)
      }}
      packet={{
        packetId: text(packet.packet_id),
        reservationId: text(packet.reservation_id),
        paymentStatus: text(packet.status),
        continuityStatus: text(packet.continuity_status)
      }}
      campaign={{
        campaignId: text(campaignReport.campaigns?.[0]?.campaign_id),
        campaignType: text(campaignReport.campaigns?.[0]?.campaign_type),
        totalCampaigns: Number(campaignReport.total_campaigns || 0)
      }}
      lead={{
        totalLeads: Number(leadData.summary?.total_leads || 0),
        leadName: text(leadData.leads?.[0]?.name || leadData.leads?.[0]?.domain || leadData.leads?.[0]?.id)
      }}
      workday={{
        status: fs.existsSync(path.join(repoRoot, "staffordos/operator_daemon/operator_daemon_state_v1.json"))
          ? "Present"
          : "Not Yet Implemented",
        heartbeat: fs.existsSync(path.join(repoRoot, "staffordos/operator_daemon/output/operator_heartbeat_v1.json"))
          ? "Present"
          : "Not Yet Implemented",
        safeMode: "Not Yet Implemented",
        loopsRun: "Not Yet Implemented"
      }}
      proofRunId="internal_shopifixer_dry_run_v1"
      currentPhase={selectedPhaseKey}
      phases={phaseItems}
      progress={{
        completed: phaseItems.filter((phase) => phase.state === "complete").length,
        total: phaseItems.length
      }}
      merchantContext={[
        {
          label: "Merchant",
          value: merchantContextFallback(commandCenterMerchant.store),
          note: merchantContextFallback(commandCenterMerchant.client_id),
          href: "/operator/command-center"
        },
        {
          label: "Store",
          value: merchantContextFallback(commandCenterMerchant.store),
          note: "Loaded from the ShopiFixer command center truth.",
          href: "/operator/system-map"
        },
        {
          label: "Lead Status",
          value: merchantLead?.lifecycle_stage || merchantLead?.status?.current_stage || "Not Yet Available",
          note: merchantLead?.status?.next_action || "No lead next action available.",
          href: "/operator/leads"
        },
        {
          label: "Client Status",
          value: merchantClient?.lifecycle?.stage || merchantClient?.status?.current_stage || merchantClient?.status || "Not Yet Available",
          note: merchantClient?.next_action?.instructions || "Loaded from client registry truth.",
          href: "/operator/command-center"
        },
        {
          label: "Campaign",
          value: "Not Yet Available",
          note: `${text(campaignReport.total_campaigns, "0")} campaign records are resolved, but this merchant has no attached campaign_id yet.`,
          href: "/operator/campaigns"
        },
        {
          label: "Campaign Attribution",
          value: `${text(attributionTotals.attributed_leads, "0")}/${text(attributionTotals.leads, "0")} attributed`,
          note: `Coverage ${text(attributionTotals.attribution_coverage_percent, "0")}% from the canonical attribution report.`,
          href: "/operator/campaigns"
        },
        {
          label: "Packet ID",
          value: merchantContextFallback(packet.packet_id),
          note: packet.status || "Packet state not available.",
          href: "/operator/revenue-command"
        },
        {
          label: "Current Offer",
          value: currentOffer?.subject || "Not Yet Available",
          note: currentOffer?.sections?.call_to_action ? `${money(currentOffer.sections.sprint_price)} · ${currentOffer.sections.call_to_action}` : "No current offer found in repository truth.",
          href: "/operator/revenue-command"
        },
        {
          label: "Current Next Action",
          value: merchantClient?.next_action?.instructions || operatorDashboard?.primary_focus?.next_action?.instructions || merchantLead?.status?.next_action || "Not Yet Available",
          note: operatorDashboard?.primary_focus?.action || "Current next action from dashboard truth.",
          href: "/operator/command-center"
        },
        {
          label: "Current Revenue Opportunity",
          value: currentRevenueGap?.gap !== undefined ? money(currentRevenueGap.gap) : "Not Yet Available",
          note: currentRevenueGap?.action || "No revenue gap recorded.",
          href: "/operator/revenue-command"
        },
        {
          label: "Latest Proof Run",
          value: latestProofRun,
          note: fs.existsSync(path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md"))
            ? "Proof package present in the dry-run proof folder."
            : "Not Yet Available",
          href: "/operator/system-map"
        },
        {
          label: "Latest Validation Status",
          value: latestValidationStatus,
          note: fs.existsSync(path.join(repoRoot, "staffordos/proof_runs/output/evidence_manifest_v1.json"))
            ? `Manifest artifacts: ${Array.isArray(evidenceManifest.artifacts) ? evidenceManifest.artifacts.length : 0}`
            : "Not Yet Available",
          href: "/operator/system-map"
        }
      ]}
      scopeSummary={{
        status: scopeStatus,
        issue: scopeSummary.issue,
        proposedFix: scopeSummary.proposedFix,
        inScope: scopeSummary.inScope,
        outOfScope: scopeSummary.outOfScope,
        merchantApprovalNeeded: scopeSummary.merchantApprovalNeeded,
        currentOffer: currentOffer?.subject || offerLatest?.offer?.subject || "Not Yet Available",
        currentPrice: currentOffer?.sections?.sprint_price !== undefined
          ? money(currentOffer.sections.sprint_price)
          : offerLatest?.offer?.sections?.sprint_price !== undefined
            ? money(offerLatest.offer.sections.sprint_price)
            : "Not Yet Available",
        successCriteria: scopeSummary.successCriteria,
        missingFields: scopeMissingFields,
        sourceState: scopeSummary.sourceState
      }}
      beforeEvidenceAction={async (formData: FormData) => {
        "use server";

        const store = String(formData.get("store") || commandCenterMerchant.store || shopifixer.merchant?.store || "unavailable");
        const date = String(formData.get("date") || beforeEvidenceWorkbenchDate);
        const affected_page_or_artifact = String(formData.get("affected_page_or_artifact") || "");
        const issue = String(formData.get("issue") || "");
        const why_it_matters = String(formData.get("why_it_matters") || "");
        const screenshot = String(formData.get("screenshot") || "");
        const notes = String(formData.get("notes") || "");

        writeShopifixerBeforeEvidence({
          store,
          date,
          affected_page_or_artifact,
          issue,
          why_it_matters,
          screenshot,
          notes
        });

        redirect("/operator/shopifixer-pilot?phase=before-evidence&shopifixer_before_saved=1");
      }}
      beforeEvidenceSaved={beforeEvidenceWorkbenchSaved}
      beforeEvidenceDate={beforeEvidenceWorkbenchDate}
      afterEvidenceAction={async (formData: FormData) => {
        "use server";

        const store = String(formData.get("store") || commandCenterMerchant.store || shopifixer.merchant?.store || "unavailable");
        const date = String(formData.get("date") || afterEvidenceWorkbenchDate);
        const affected_page_or_artifact = String(formData.get("affected_page_or_artifact") || "");
        const after_screenshot = String(formData.get("after_screenshot") || "");
        const after_notes = String(formData.get("after_notes") || "");
        const remaining_limitations = String(formData.get("remaining_limitations") || "");
        const observed_improvement = String(formData.get("observed_improvement") || "");
        const merchant_facing_summary = String(formData.get("merchant_facing_summary") || "");

        writeShopifixerAfterEvidence({
          store,
          date,
          affected_page_or_artifact,
          after_screenshot,
          after_notes,
          remaining_limitations,
          observed_improvement,
          merchant_facing_summary
        });

        redirect("/operator/shopifixer-pilot?phase=after-evidence&shopifixer_after_saved=1");
      }}
      afterEvidenceSaved={afterEvidenceWorkbenchSaved}
      afterEvidenceDate={afterEvidenceWorkbenchDate}
      scopeWorkbenchAction={async (formData: FormData) => {
        "use server";

        const store = String(formData.get("store") || commandCenterMerchant.store || shopifixer.merchant?.store || "unavailable");
        const scoped_fix = String(formData.get("scoped_fix") || "");
        const in_scope = String(formData.get("in_scope") || "");
        const out_of_scope = String(formData.get("out_of_scope") || "");
        const merchant_approval_needed = String(formData.get("merchant_approval_needed") || "no");
        const change_made = String(formData.get("change_made") || "");
        const location_changed = String(formData.get("location_changed") || "");
        const implementation_notes = String(formData.get("implementation_notes") || "");
        const success_criteria = String(formData.get("success_criteria") || "");

        writeShopifixerScopedFix({
          store,
          scoped_fix,
          in_scope,
          out_of_scope,
          merchant_approval_needed,
          change_made,
          location_changed,
          implementation_notes,
          success_criteria
        });

        redirect("/operator/shopifixer-pilot?phase=scope&shopifixer_scoped_fix_saved=1");
      }}
      scopeWorkbenchSaved={scopeWorkbenchSaved}
      scopeWorkbenchDate={scopeWorkbenchDate}
      beforeEvidenceSummary={{
        status: beforeEvidenceStatus,
        path: beforeEvidencePath.replace(repoRoot.endsWith("/") ? repoRoot : `${repoRoot}/`, ""),
        issue: beforeEvidenceFields.issue,
        whyItMatters: beforeEvidenceFields.whyItMatters,
        artifactIds: beforeEvidenceArtifactIds,
        artifacts: beforeEvidenceScreenshotArtifacts.map((artifact: any) => ({
          artifactId: String(artifact?.artifact_id || "").trim() || "Not Yet Available",
          createdAt: String(artifact?.created_at || "").trim() || "Not Yet Available",
          outputPath: String(artifact?.output_path || "").trim() || "Not Yet Available",
          sourceWriter: String(artifact?.source_writer || "").trim() || "Not Yet Available",
          screenshotStatus: String(artifact?.screenshot_artifacts?.[0]?.status || "Not Yet Available").trim() || "Not Yet Available",
          screenshotReference: String(artifact?.screenshot_artifacts?.[0]?.original_reference || "Not Yet Available").trim() || "Not Yet Available",
          screenshotStoredPath: String(artifact?.screenshot_artifacts?.[0]?.stored_path || "Not Yet Available").trim() || "Not Yet Available",
          screenshotArtifactId: String(artifact?.screenshot_artifacts?.[0]?.artifact_id || "Not Yet Available").trim() || "Not Yet Available"
        })),
        lastCapturedAt: beforeEvidenceLastCapturedAt || "Not Yet Available"
      }}
      afterEvidenceSummary={{
        status: afterEvidenceStatus,
        path: afterEvidencePath.replace(repoRoot.endsWith("/") ? repoRoot : `${repoRoot}/`, ""),
        observedImprovement: afterEvidenceFields.observedImprovement,
        merchantFacingSummary: afterEvidenceFields.merchantFacingSummary,
        remainingLimitations: afterEvidenceFields.remainingLimitations,
        screenshotReference: afterEvidenceFields.screenshot,
        artifactIds: afterEvidenceArtifactIds,
        artifacts: afterEvidenceScreenshotArtifacts.map((artifact: any) => ({
          artifactId: String(artifact?.artifact_id || "").trim() || "Not Yet Available",
          createdAt: String(artifact?.created_at || "").trim() || "Not Yet Available",
          outputPath: String(artifact?.output_path || "").trim() || "Not Yet Available",
          sourceWriter: String(artifact?.source_writer || "").trim() || "Not Yet Available",
          screenshotStatus: String(artifact?.screenshot_artifacts?.[0]?.status || "Not Yet Available").trim() || "Not Yet Available",
          screenshotReference: String(artifact?.screenshot_artifacts?.[0]?.original_reference || "Not Yet Available").trim() || "Not Yet Available",
          screenshotStoredPath: String(artifact?.screenshot_artifacts?.[0]?.stored_path || "Not Yet Available").trim() || "Not Yet Available",
          screenshotArtifactId: String(artifact?.screenshot_artifacts?.[0]?.artifact_id || "Not Yet Available").trim() || "Not Yet Available"
        })),
        lastCapturedAt: afterEvidenceLastCapturedAt || "Not Yet Available"
      }}
      proofAndSealSummary={{
        status: proofAndSealStatus,
        proofPackagePath: path.relative(repoRoot, proofPackagePath).split(path.sep).join("/"),
        proofPackageVersion: text(proofPackageContent.match(/Proof Package Version:\s*(.*)/)?.[1] || "Not Yet Available"),
        proofRunId: text(proofSeal.proof_run_id, "Not Yet Available"),
        generatedAt: text(proofSeal.generated_at, "Not Yet Available"),
        manifestPath: proofPackageManifestPath,
        manifestArtifactCount: String(manifestArtifactCount || "Not Yet Available"),
        evidenceSourcePaths: Array.isArray(proofSeal.evidence_source_paths) ? proofSeal.evidence_source_paths.map((value: unknown) => text(value, "Not Yet Available")) : [],
        sealStatus: text(proofSeal.status, "Not Yet Available"),
        sha256: proofSha256,
        sha256MatchStatus: proofSha256MatchStatus,
        missingScreenshotArtifactCount: String(missingScreenshotArtifactCount)
      }}
      deliverySummary={{
        merchantDeliveryStatus: deliveryMerchantStatus,
        proofPackageReady: deliveryProofReadyStatus,
        checksumSealStatus: text(proofSeal.status, "Not Yet Available"),
        offerStatus: deliveryOfferStatus,
        paymentStatus: deliveryPaymentStatus,
        currentNextAction: merchantClient?.next_action?.instructions || operatorDashboard?.primary_focus?.next_action?.instructions || merchantLead?.status?.next_action || "Not Yet Available",
        recommendedOperatorAction: primaryActionSnapshot.primary_action?.next_step || qa.snapshot_primary_action?.next_step || "Not Yet Available",
        revenueOpportunity: currentRevenueGap?.gap !== undefined ? money(currentRevenueGap.gap) : "Not Yet Available",
        completionReadiness: deliveryCompletionReadiness
      }}
      recommendedNextStep={{
        phaseLabel: recommendedPhase.label,
        state: recommendedPhase.state,
        blockedReason: recommendedPhase.blockedReason,
        missingTruthOrGate: recommendedPhase.authority,
        nextSafeAction: recommendedPhase.nextSafeAction,
        href: recommendedPhase.href
      }}
      executeSummary={{
        status: executeStatus,
        primaryAction: text(primaryActionSnapshot.primary_action?.action_label || qa.snapshot_primary_action?.action_label || "Not Yet Available"),
        preflightStatus: text(preflight.status, "Not Yet Available"),
        qaStatus: text(qa.verdict, "Not Yet Available"),
        latestExecutionStatus: text(agentLoopLatest.status || latestExecutionEvent?.outcome || "Not Yet Available"),
        latestExecutionEvent: latestExecutionEvent
          ? `${text(latestExecutionEvent.execution_id || latestExecutionEvent.event_id)} · ${text(latestExecutionEvent.action_type)} · ${text(latestExecutionEvent.outcome)}`
          : "Not Yet Available",
        outcomeEventStatus: latestOutcomeEvent
          ? `${text(latestOutcomeEvent.status)} · ${text(latestOutcomeEvent.event_type || latestOutcomeEvent.action_type)}`
          : "Not Yet Available",
        rollbackAvailability,
        fixScopeReadiness,
        primaryActionSource: fs.existsSync(path.join(repoRoot, "staffordos/snapshots/primary_action_snapshot_v1.json"))
          ? "staffordos/snapshots/primary_action_snapshot_v1.json"
          : "Not Yet Available"
      }}
      evidenceStatus={[
        { label: "Before evidence", value: fs.existsSync(beforeEvidencePath) ? "Present" : "Missing" },
        { label: "After evidence", value: fs.existsSync(afterEvidencePath) ? "Present" : "Missing" },
        { label: "Proof package", value: fs.existsSync(proofPackagePath) ? "Present" : "Missing" },
        { label: "Checksum seal", value: fs.existsSync(sealPath) ? "Present" : "Missing" },
        { label: "Evidence manifest", value: fs.existsSync(evidenceManifestPath) ? "Present" : "Missing" },
      ]}
      validationStatus={[
        { label: "Preflight", value: text(preflight.status) },
        { label: "QA", value: text(qa.verdict) },
        { label: "Campaign registry", value: campaignReport.validation.ok ? "Pass" : "Needs attention" },
        { label: "Proof files", value: proofFileStatuses.every((item) => item.value === "Present") ? "Present" : "Partial" },
      ]}
      previousWork={text(customerOutcome?.outcome_state, "Not Yet Implemented")}
    />
  );
}
