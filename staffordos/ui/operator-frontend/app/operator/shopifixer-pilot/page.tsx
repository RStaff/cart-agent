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

  const commandCenterMerchant = shopifixerRecord.merchant || {};
  const packet = shopifixerRecord.checkout_linkage || {};
  const customerOutcome = Array.isArray(shopifixerRecord.customer_outcomes) ? shopifixerRecord.customer_outcomes[0] : null;
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
