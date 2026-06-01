import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

type AnyRecord = Record<string, any>;

const SOURCE = "staffordos/clients/client_registry_v1.json";

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, SOURCE))) return cwd;

  const fromOperatorFrontend = path.resolve(cwd, "../../..");
  if (existsSync(path.join(fromOperatorFrontend, SOURCE))) return fromOperatorFrontend;

  return fromOperatorFrontend;
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeContact(contact: AnyRecord = {}) {
  return {
    email: normalizeText(contact.email),
    name: normalizeText(contact.name),
    role: normalizeText(contact.role),
    confidence: normalizeText(contact.confidence),
  };
}

function paymentStatusFor(client: AnyRecord) {
  const explicitStatus = normalizeText(client.deal?.payment_status || client.payment_status);
  if (explicitStatus) return explicitStatus;

  if (client.revenue?.shopifixer_collected === true) return "paid";
  if (toNumber(client.business?.stafford_revenue_earned) > 0) return "paid";

  return null;
}

function isPaidClient(client: AnyRecord) {
  const paymentStatus = String(paymentStatusFor(client) || "").toLowerCase();
  const paidStatuses = new Set([
    "paid",
    "payment_received",
    "collected",
    "complete",
    "completed",
    "succeeded",
  ]);

  return (
    paidStatuses.has(paymentStatus) ||
    client.revenue?.shopifixer_collected === true ||
    toNumber(client.business?.stafford_revenue_earned) > 0
  );
}

function normalizeBlocker(blocker: unknown) {
  if (typeof blocker === "string") {
    return {
      type: null,
      severity: null,
      message: blocker,
    };
  }

  const item = blocker && typeof blocker === "object" ? blocker as AnyRecord : {};

  return {
    type: normalizeText(item.type || item.id || item.code),
    severity: normalizeText(item.severity || item.highest_severity),
    message: normalizeText(item.message || item.reason || item.block_reason || item.text),
  };
}

function blockersFor(client: AnyRecord) {
  const blockers = Array.isArray(client.blocker_detection?.blockers)
    ? client.blocker_detection.blockers.map(normalizeBlocker)
    : [];

  if (client.lifecycle?.blocked === true || client.blocker_detection?.blocked === true) {
    blockers.push({
      type: "lifecycle",
      severity: normalizeText(client.blocker_detection?.highest_severity) || "blocked",
      message: normalizeText(client.lifecycle?.block_reason) || "Client is marked blocked.",
    });
  }

  return blockers.filter((blocker: AnyRecord) => blocker.message || blocker.type || blocker.severity);
}

function nextActionFor(client: AnyRecord) {
  const action = client.next_action || {};

  return {
    type: normalizeText(action.type),
    owner: normalizeText(action.owner),
    due_at: normalizeText(action.due_at),
    instructions: normalizeText(action.instructions || action.next_action || client.status?.next_action),
    auto_executable: action.auto_executable === true,
    updated_at: normalizeText(action.updated_at),
  };
}

function priorityScoreFor(client: AnyRecord) {
  if (typeof client.priority_score === "number") return client.priority_score;
  return toNumber(client.priority_score?.total);
}

function normalizeClient(client: AnyRecord) {
  return {
    client_id: normalizeText(client.client_id),
    merchant_shop: normalizeText(client.merchant_shop || client.shop || client.domain),
    status: normalizeText(client.status),
    lifecycle_stage: normalizeText(client.lifecycle?.stage || client.lifecycle_stage || client.decision_trace?.lifecycle_stage),
    contact: normalizeContact(client.contact || {}),
    payment_status: paymentStatusFor(client),
    shopifixer_audit_status: normalizeText(client.shopifixer?.audit_status),
    shopifixer_fix_status: normalizeText(client.shopifixer?.fix_status),
    abando_installed: client.abando?.installed === true,
    merchant_revenue_recovered: toNumber(client.abando?.merchant_revenue_recovered),
    stafford_revenue_earned: toNumber(client.business?.stafford_revenue_earned),
    next_action: nextActionFor(client),
    blockers: blockersFor(client),
    priority_score: priorityScoreFor(client),
  };
}

function needsAudit(client: AnyRecord) {
  const auditStatus = String(client.shopifixer?.audit_status || "").toLowerCase();
  return !["complete", "completed", "not_applicable", "not_needed"].includes(auditStatus);
}

function fixInProgress(client: AnyRecord) {
  const fixStatus = String(client.shopifixer?.fix_status || "").toLowerCase();
  const lifecycleStage = String(client.lifecycle?.stage || "").toLowerCase();
  return (
    ["in_progress", "active", "qa", "proof_ready"].includes(fixStatus) ||
    ["fix_in_progress", "qa", "proof_ready"].includes(lifecycleStage)
  );
}

function hasProofOrRevenueGap(client: ReturnType<typeof normalizeClient>) {
  return (
    client.merchant_revenue_recovered > client.stafford_revenue_earned ||
    (!["paid", "payment_received", "collected", "complete", "completed", "succeeded"].includes(
      String(client.payment_status || "").toLowerCase()
    ) && ["proposal_sent", "deal_won", "payment_pending"].includes(String(client.lifecycle_stage || "").toLowerCase()))
  );
}

function pickNextBestAction(clients: Array<ReturnType<typeof normalizeClient>>) {
  if (clients.length === 0) {
    return {
      client_id: null,
      merchant_shop: null,
      action: "No clients found in Client Registry.",
      reason: "client_registry_empty",
    };
  }

  const sorted = [...clients].sort((a, b) => {
    const blockerDelta = Number(b.blockers.length > 0) - Number(a.blockers.length > 0);
    if (blockerDelta !== 0) return blockerDelta;
    return b.priority_score - a.priority_score;
  });

  const client = sorted[0];

  return {
    client_id: client.client_id,
    merchant_shop: client.merchant_shop,
    action: client.next_action.instructions || "Review client lifecycle state.",
    reason: client.blockers.length > 0 ? "blocked_high_priority_client" : "highest_priority_client",
  };
}

function emptySummary(nextBestAction: string) {
  return {
    total_clients: 0,
    unpaid_clients: 0,
    paid_clients: 0,
    audits_needed: 0,
    fixes_in_progress: 0,
    proof_or_revenue_gaps: 0,
    next_best_action: {
      client_id: null,
      merchant_shop: null,
      action: nextBestAction,
      reason: "client_registry_unavailable",
    },
  };
}

export async function GET() {
  const generatedAt = new Date().toISOString();
  const repoRoot = resolveRepoRoot();
  const registryPath = path.join(repoRoot, SOURCE);

  if (!existsSync(registryPath)) {
    return NextResponse.json({
      ok: false,
      generated_at: generatedAt,
      source: SOURCE,
      count: 0,
      clients: [],
      summary: emptySummary("Client Registry file is missing."),
      error: "client_registry_missing",
    });
  }

  try {
    const registry = JSON.parse(readFileSync(registryPath, "utf8"));
    const rawClients = Array.isArray(registry.clients) ? registry.clients : [];
    const clients = rawClients.map(normalizeClient);
    const paidClients = rawClients.filter(isPaidClient).length;

    return NextResponse.json({
      ok: true,
      generated_at: generatedAt,
      source: SOURCE,
      count: clients.length,
      clients,
      summary: {
        total_clients: clients.length,
        unpaid_clients: clients.length - paidClients,
        paid_clients: paidClients,
        audits_needed: rawClients.filter(needsAudit).length,
        fixes_in_progress: rawClients.filter(fixInProgress).length,
        proof_or_revenue_gaps: clients.filter(hasProofOrRevenueGap).length,
        next_best_action: pickNextBestAction(clients),
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      generated_at: generatedAt,
      source: SOURCE,
      count: 0,
      clients: [],
      summary: emptySummary("Client Registry file is malformed or unreadable."),
      error: "client_registry_malformed",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
