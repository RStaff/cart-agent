import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  canonicalClientLifecycleStage,
  canonicalLifecyclePhase,
  canonicalLeadLifecycleStage,
  canonicalLifecycleRecord,
  canonicalNextActionLabel,
} from "../../../../lib/operator/lifecycleTerminology";

type AnyRecord = Record<string, any>;

type SourceResult<T> = {
  data: T;
  status: "loaded" | "missing" | "malformed";
  error: string | null;
};

const SOURCES = {
  leadRegistry: "staffordos/leads/lead_registry_v1.json",
  clientRegistry: "staffordos/clients/client_registry_v1.json",
  dashboardSnapshot: "staffordos/clients/operator_dashboard_snapshot_v1.json",
  proofStatus: "staffordos/leads/send_ledger_v1.json",
} as const;

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, SOURCES.leadRegistry))) return cwd;

  const fromOperatorFrontend = path.resolve(cwd, "../../..");
  if (existsSync(path.join(fromOperatorFrontend, SOURCES.leadRegistry))) {
    return fromOperatorFrontend;
  }

  return fromOperatorFrontend;
}

function readJsonSource<T>(repoRoot: string, source: string, fallback: T): SourceResult<T> {
  const filePath = path.join(repoRoot, source);

  if (!existsSync(filePath)) {
    return {
      data: fallback,
      status: "missing",
      error: `${source} missing`,
    };
  }

  try {
    return {
      data: JSON.parse(readFileSync(filePath, "utf8")) as T,
      status: "loaded",
      error: null,
    };
  } catch (error) {
    return {
      data: fallback,
      status: "malformed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function text(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function lifecycleStage(record: AnyRecord) {
  return text(record.lifecycle_stage || record.lifecycle?.stage || record.status?.current_stage);
}

function leadNextAction(lead: AnyRecord) {
  return canonicalNextActionLabel(lead.status?.next_action || lead.next_action || lead.nextAction);
}

function leadScore(lead: AnyRecord) {
  return toNumber(lead.conversion_score || lead.status?.conversion_score || lead.score);
}

function leadHasContact(lead: AnyRecord) {
  return Boolean(lead.contact?.email || lead.email || lead.execution?.send_target || lead.send_target);
}

function leadOutreachReady(lead: AnyRecord) {
  return Boolean(
    leadHasContact(lead) ||
    lead.execution?.message ||
    lead.message ||
    lead.nextMessage ||
    lead.engagement?.approved_for_send
  );
}

function paymentStatus(client: AnyRecord) {
  const explicit = text(client.deal?.payment_status || client.payment_status);
  if (explicit) return explicit;
  if (client.revenue?.shopifixer_collected === true) return "paid";
  if (toNumber(client.business?.stafford_revenue_earned) > 0) return "paid";
  return null;
}

function isPaidClient(client: AnyRecord) {
  const status = String(paymentStatus(client) || "").toLowerCase();
  return (
    ["paid", "payment_received", "collected", "complete", "completed", "succeeded"].includes(status) ||
    client.revenue?.shopifixer_collected === true ||
    toNumber(client.business?.stafford_revenue_earned) > 0
  );
}

function isUnpaidClient(client: AnyRecord) {
  return !isPaidClient(client);
}

function auditNeeded(client: AnyRecord) {
  const auditStatus = String(client.shopifixer?.audit_status || "").toLowerCase();
  return !["complete", "completed", "not_applicable", "not_needed"].includes(auditStatus);
}

function fixInProgress(client: AnyRecord) {
  const fixStatus = String(client.shopifixer?.fix_status || "").toLowerCase();
  const stage = String(lifecycleStage(client) || "").toLowerCase();
  return (
    ["in_progress", "active", "qa", "proof_ready"].includes(fixStatus) ||
    ["fix_in_progress", "qa", "proof_ready"].includes(stage)
  );
}

function clientPriority(client: AnyRecord) {
  if (typeof client.priority_score === "number") return client.priority_score;
  return toNumber(client.priority_score?.total);
}

function clientNextAction(client: AnyRecord) {
  return {
    type: text(client.next_action?.type),
    owner: text(client.next_action?.owner),
    instructions: text(client.next_action?.instructions || client.next_action?.next_action),
    due_at: text(client.next_action?.due_at),
    updated_at: text(client.next_action?.updated_at),
  };
}

function clientBlockers(client: AnyRecord) {
  const blockers = Array.isArray(client.blocker_detection?.blockers)
    ? client.blocker_detection.blockers
    : [];

  if (client.lifecycle?.blocked === true || client.blocker_detection?.blocked === true) {
    return [
      ...blockers,
      {
        type: "lifecycle",
        severity: client.blocker_detection?.highest_severity || "blocked",
        message: client.lifecycle?.block_reason || "Client is marked blocked.",
      },
    ];
  }

  return blockers;
}

function normalizeClient(client: AnyRecord) {
  const canonical = canonicalLifecycleRecord(client, "client");
  return {
    client_id: text(client.client_id),
    merchant_shop: text(client.merchant_shop || client.shop || client.domain),
    status: text(client.status),
    lifecycle_stage: lifecycleStage(client),
    canonical_lifecycle_stage: canonicalClientLifecycleStage(client),
    canonical_phase: canonicalLifecyclePhase(client, "client"),
    payment_status: paymentStatus(client),
    shopifixer_audit_status: text(client.shopifixer?.audit_status),
    shopifixer_fix_status: text(client.shopifixer?.fix_status),
    merchant_revenue_recovered: toNumber(client.abando?.merchant_revenue_recovered),
    stafford_revenue_earned: toNumber(client.business?.stafford_revenue_earned),
    next_action: clientNextAction(client),
    blockers: clientBlockers(client),
    priority_score: clientPriority(client),
    lifecycle_display: canonical,
  };
}

function countBy<T>(items: T[], pick: (item: T) => string | null) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = pick(item) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function proofSummary(proofs: AnyRecord[]) {
  const dryRun = proofs.filter((proof) => proof.status === "dry_run_proof_recorded");
  const live = proofs.filter((proof) => proof.live_send_attempted === true);

  return {
    total_proofs: proofs.length,
    dry_run_proofs: dryRun.length,
    live_send_attempted: live.length,
    latest_proofs: proofs.slice(-5).reverse().map((proof) => ({
      id: text(proof.id),
      lead_id: text(proof.lead_id),
      lead_name: text(proof.lead_name),
      status: text(proof.status),
      proof_type: text(proof.proof_type),
      created_at: text(proof.created_at),
    })),
  };
}

function buildNextBestAction(input: {
  sourceErrors: Array<{ source: string; status: string; error: string | null }>;
  dashboard: AnyRecord;
  normalizedClients: ReturnType<typeof normalizeClient>[];
  leads: AnyRecord[];
  acquisitionBlocked: number;
  proofOrRevenueGaps: number;
  auditsNeeded: number;
}) {
  const brokenSource = input.sourceErrors.find((source) => source.status !== "loaded");
  if (brokenSource) {
    return {
      area: "Executive Control",
      action: `Repair truth source: ${brokenSource.source}`,
      reason: brokenSource.error || brokenSource.status,
      source: brokenSource.source,
    };
  }

  const dashboardAction = text(input.dashboard.primary_focus?.action);
  if (dashboardAction && input.proofOrRevenueGaps > 0) {
    return {
      area: "Revenue",
      action: dashboardAction,
      reason: text(input.dashboard.primary_focus?.reason) || "proof_or_revenue_gap",
      source: SOURCES.dashboardSnapshot,
      client_id: text(input.dashboard.primary_focus?.client_id),
      merchant_shop: text(input.dashboard.primary_focus?.merchant_shop),
    };
  }

  const priorityClient = [...input.normalizedClients].sort((a, b) => b.priority_score - a.priority_score)[0];
  if (priorityClient?.next_action.instructions) {
    return {
      area: "Conversion",
      action: priorityClient.next_action.instructions,
      reason: "highest_priority_client_next_action",
      source: SOURCES.clientRegistry,
      client_id: priorityClient.client_id,
      merchant_shop: priorityClient.merchant_shop,
    };
  }

  if (input.auditsNeeded > 0) {
    return {
      area: "Conversion",
      action: "Complete missing ShopiFixer audit evidence before scaling outreach.",
      reason: "audits_needed",
      source: SOURCES.clientRegistry,
    };
  }

  if (input.acquisitionBlocked > 0) {
    return {
      area: "Acquisition",
      action: "Resolve missing contact information for blocked leads.",
      reason: "contact_blocked_leads",
      source: SOURCES.leadRegistry,
    };
  }

  const lead = [...input.leads].sort((a, b) => leadScore(b) - leadScore(a))[0];
  if (lead) {
    return {
      area: "Acquisition",
      action: leadNextAction(lead),
      reason: "highest_score_lead_next_action",
      source: SOURCES.leadRegistry,
      lead_id: text(lead.id || lead.lead_id),
      merchant_shop: text(lead.name || lead.domain),
    };
  }

  return {
    area: "Executive Control",
    action: "No business-core next action available from current sources.",
    reason: "empty_sources",
    source: "ceo-snapshot",
  };
}

export async function GET() {
  const generatedAt = new Date().toISOString();
  const repoRoot = resolveRepoRoot();

  const leadRegistry = readJsonSource<AnyRecord>(repoRoot, SOURCES.leadRegistry, { items: [] });
  const clientRegistry = readJsonSource<AnyRecord>(repoRoot, SOURCES.clientRegistry, { clients: [] });
  const dashboardSnapshot = readJsonSource<AnyRecord>(repoRoot, SOURCES.dashboardSnapshot, {});
  const proofStatus = readJsonSource<AnyRecord>(repoRoot, SOURCES.proofStatus, { items: [] });

  const leads = Array.isArray(leadRegistry.data.items) ? leadRegistry.data.items : [];
  const clients = Array.isArray(clientRegistry.data.clients) ? clientRegistry.data.clients : [];
  const proofs = Array.isArray(proofStatus.data.items) ? proofStatus.data.items : [];
  const normalizedClients = clients.map(normalizeClient);
  const normalizedProof = proofSummary(proofs);

  const leadStages = countBy(leads, lifecycleStage);
  const canonicalLeadStages = countBy(leads, (lead) => canonicalLeadLifecycleStage(lead));
  const productRouting = countBy(leads, (lead) => text(lead.product || lead.routing?.primary_offer || lead.product_surface));
  const paidClients = clients.filter(isPaidClient).length;
  const unpaidClients = clients.filter(isUnpaidClient).length;
  const auditsNeeded = clients.filter(auditNeeded).length;
  const fixesInProgress = clients.filter(fixInProgress).length;
  const proofOrRevenueGaps = normalizedClients.filter((client) => (
    client.merchant_revenue_recovered > client.stafford_revenue_earned ||
    ["proposal_sent", "deal_won", "payment_pending"].includes(String(client.lifecycle_stage || "").toLowerCase())
  )).length;

  const acquisitionBlocked = leads.filter((lead) => !leadHasContact(lead) && !leadOutreachReady(lead)).length;

  const sourceHealth = {
    lead_registry: {
      source: SOURCES.leadRegistry,
      status: leadRegistry.status,
      error: leadRegistry.error,
    },
    client_registry: {
      source: SOURCES.clientRegistry,
      status: clientRegistry.status,
      error: clientRegistry.error,
    },
    dashboard_snapshot: {
      source: SOURCES.dashboardSnapshot,
      status: dashboardSnapshot.status,
      error: dashboardSnapshot.error,
    },
    proof_status: {
      source: SOURCES.proofStatus,
      status: proofStatus.status,
      error: proofStatus.error,
    },
  };

  const sourceErrors = Object.values(sourceHealth).map((source) => ({
    source: source.source,
    status: source.status,
    error: source.error,
  }));

  const nextBestAction = buildNextBestAction({
    sourceErrors,
    dashboard: dashboardSnapshot.data,
    normalizedClients,
    leads,
    acquisitionBlocked,
    proofOrRevenueGaps,
    auditsNeeded,
  });
  const canonicalNextBestAction = {
    ...nextBestAction,
    canonical_area: nextBestAction.area,
    canonical_action: nextBestAction.action,
    canonical_reason: nextBestAction.reason,
  };

  return NextResponse.json({
    ok: true,
    generated_at: generatedAt,
    source_policy: "Aggregates existing read-only truth files only. No registry writes. Missing data is reported as partial, not fabricated.",
    revenue: {
      status: dashboardSnapshot.status === "loaded" || clientRegistry.status === "loaded" ? "partial" : "missing",
      stafford_revenue: toNumber(dashboardSnapshot.data.revenue_summary?.stafford_revenue),
      merchant_revenue_recovered: toNumber(dashboardSnapshot.data.revenue_summary?.merchant_revenue_recovered),
      recurring_mrr: toNumber(dashboardSnapshot.data.revenue_summary?.recurring_mrr),
      total_clients: normalizedClients.length || toNumber(dashboardSnapshot.data.top_metrics?.total_clients),
      active_revenue_clients: toNumber(dashboardSnapshot.data.top_metrics?.active_revenue_clients),
      unpaid_clients: unpaidClients,
      paid_clients: paidClients,
      revenue_gaps: Array.isArray(dashboardSnapshot.data.revenue_gaps)
        ? dashboardSnapshot.data.revenue_gaps
        : [],
    },
    acquisition: {
      status: leadRegistry.status === "loaded" ? "complete" : "missing",
      total_leads: leads.length,
      contact_ready: leads.filter(leadHasContact).length,
      outreach_ready: leads.filter(leadOutreachReady).length,
      sent: leads.filter((lead) => lead.engagement?.sent === true).length,
      engaged: leads.filter((lead) => lifecycleStage(lead) === "engaged" || lead.engagement?.replied === true).length,
      blocked: acquisitionBlocked,
      lifecycle_counts: leadStages,
      canonical_lifecycle_counts: canonicalLeadStages,
      product_routing: productRouting,
      priority_leads: [...leads].sort((a, b) => leadScore(b) - leadScore(a)).slice(0, 5).map((lead) => ({
        lead_id: text(lead.id || lead.lead_id),
        merchant_shop: text(lead.name || lead.domain),
        lifecycle_stage: lifecycleStage(lead),
        canonical_lifecycle_stage: canonicalLeadLifecycleStage(lead),
        canonical_phase: canonicalLifecyclePhase(lead, "lead"),
        next_action: leadNextAction(lead),
        score: leadScore(lead),
      })),
    },
    conversion: {
      status: clientRegistry.status === "loaded" || leadRegistry.status === "loaded" ? "partial" : "missing",
      proposal_sent_clients: normalizedClients.filter((client) => client.lifecycle_stage === "proposal_sent").length,
      canonical_proposal_sent_clients: normalizedClients.filter((client) => client.canonical_lifecycle_stage === "Proposed Fix").length,
      engaged_leads: leads.filter((lead) => lifecycleStage(lead) === "engaged" || lead.engagement?.replied === true).length,
      followup_sent_leads: leads.filter((lead) => lifecycleStage(lead) === "followup_sent").length,
      audits_needed: auditsNeeded,
      payment_pending_clients: normalizedClients.filter((client) => client.payment_status === "payment_pending").length,
      unpaid_clients: unpaidClients,
      closest_to_payment: normalizedClients
        .filter((client) => ["proposal_sent", "deal_won", "payment_pending"].includes(String(client.lifecycle_stage || "").toLowerCase()))
        .sort((a, b) => b.priority_score - a.priority_score)
        .slice(0, 5),
      canonical_closest_to_payment: normalizedClients
        .filter((client) => ["Proposed Fix", "Payment"].includes(String(client.canonical_lifecycle_stage || "")))
        .sort((a, b) => b.priority_score - a.priority_score)
        .slice(0, 5),
    },
    fulfillment: {
      status: clientRegistry.status === "loaded" ? "partial_missing_packet_adapter" : "missing",
      fixes_in_progress: fixesInProgress,
      fix_not_started: normalizedClients.filter((client) => client.shopifixer_fix_status === "not_started").length,
      qa_queue: normalizedClients.filter((client) => client.shopifixer_fix_status === "qa").length,
      proof_queue: normalizedClients.filter((client) => client.shopifixer_fix_status === "proof_ready").length,
      canonical_stage_counts: countBy(normalizedClients, (client) => client.canonical_lifecycle_stage || "Unknown"),
      note: "Packet truth is not included yet because this route is limited to Lead Registry, Client Registry, Dashboard Snapshot, and Proof Status.",
    },
    merchant_success: {
      status: "partial",
      outreach_proof: normalizedProof,
      proof_or_revenue_gaps: proofOrRevenueGaps,
      reviews_requested: 0,
      reviews_received: 0,
      referral_opportunities: 0,
      note: "Current proof source is send ledger proof, not completed ShopiFixer fulfillment proof packages.",
    },
    executive_control: {
      status: "partial",
      source_health: sourceHealth,
      system_health_summary: dashboardSnapshot.data.system_health_summary || {
        green: 0,
        red: 0,
        unknown: Object.values(sourceHealth).filter((source) => source.status !== "loaded").length,
      },
      blockers: [
        ...sourceErrors
          .filter((source) => source.status !== "loaded")
          .map((source) => ({
            area: "source_health",
            severity: "high",
            message: `${source.source} is ${source.status}`,
          })),
        ...(acquisitionBlocked > 0
          ? [{
              area: "acquisition",
              severity: "medium",
              message: `${acquisitionBlocked} leads need contact or outreach readiness.`,
            }]
          : []),
        ...(proofOrRevenueGaps > 0
          ? [{
              area: "revenue",
              severity: "high",
              message: `${proofOrRevenueGaps} client records have proof or revenue gaps.`,
            }]
          : []),
        ...(auditsNeeded > 0
          ? [{
              area: "conversion",
              severity: "medium",
              message: `${auditsNeeded} client records need audit completion.`,
            }]
          : []),
      ],
      capacity_signal: {
        paid_clients: paidClients,
        fixes_in_progress: fixesInProgress,
        proof_queue: normalizedClients.filter((client) => client.shopifixer_fix_status === "proof_ready").length,
      },
    },
    next_best_action: canonicalNextBestAction,
  });
}
