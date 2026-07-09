import fs from "node:fs";
import path from "node:path";

import { ShopifixerPilotWorkspace } from "../../../components/operator/ShopifixerPilotWorkspace";
import { loadShopifixerCommandCenter } from "../../../lib/operator/loadShopifixerCommandCenter";
import { loadOperatorLeads } from "../../../lib/leads/loadOperatorLeads";
import { getCampaignResolverReport } from "../../../lib/operator/campaignResolver";
import { loadPreflightReport } from "../../../lib/operator/loadPreflightReport";
import { loadCommandCenterQaReport } from "../../../lib/operator/loadCommandCenterQaReport";

type ProofFile = {
  label: string;
  path: string;
};

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

function phaseStatus(index: number, currentIndex: number): "ready" | "in_progress" | "blocked" | "complete" {
  if (index < currentIndex) return "complete";
  if (index === currentIndex) return "in_progress";
  if (index === currentIndex + 1) return "ready";
  return "blocked";
}

export default async function ShopifixerPilotPage() {
  const repoRoot = resolveRepoRoot();
  const shopifixer = await loadShopifixerCommandCenter();
  const shopifixerRecord = shopifixer as any;
  const leadData = await loadOperatorLeads();
  const campaignReport = getCampaignResolverReport();
  const preflight = loadPreflightReport();
  const qa = loadCommandCenterQaReport();
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
  const evidenceManifest = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/proof_runs/output/evidence_manifest_v1.json"),
    {}
  );
  const proofSeal = readJson<Record<string, any>>(
    path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json"),
    {}
  );

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
  const currentPhase = "merchant_context";
  const phases = [
    { key: "merchant_context", label: "Merchant Context" },
    { key: "scope", label: "Scope" },
    { key: "before_evidence", label: "Before Evidence" },
    { key: "execute", label: "Execute" },
    { key: "after_evidence", label: "After Evidence" },
    { key: "proof_seal", label: "Proof & Seal" },
    { key: "delivery", label: "Delivery" },
  ].map((phase, index) => ({
    ...phase,
    status: phaseStatus(index, 0),
    disabled: index !== 0
  }));

  const proofFileStatuses = PROOF_FILES.map((file) => ({
    label: file.label,
    value: fs.existsSync(path.join(repoRoot, file.path)) ? "Present" : "Missing"
  }));

  const evidenceManifestPath = path.join(repoRoot, "staffordos/proof_runs/output/evidence_manifest_v1.json");
  const beforeEvidencePath = path.join(repoRoot, `${PROOF_RUN_ROOT}/before_evidence.md`);
  const afterEvidencePath = path.join(repoRoot, `${PROOF_RUN_ROOT}/after_evidence.md`);
  const proofPackagePath = path.join(repoRoot, `${PROOF_RUN_ROOT}/merchant_proof_package.md`);
  const sealPath = path.join(repoRoot, `${PROOF_RUN_ROOT}/merchant_proof_package.seal.json`);

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
      currentPhase={currentPhase}
      phases={phases}
      progress={{
        completed: phases.filter((phase) => phase.status === "complete").length,
        total: phases.length
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
