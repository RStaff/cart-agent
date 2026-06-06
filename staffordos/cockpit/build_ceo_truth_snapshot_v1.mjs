import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(REPO_ROOT, "staffordos", "cockpit");
const OUT_JSON = path.join(OUT_DIR, "ceo_truth_snapshot_v1.json");
const OUT_MD = path.join(OUT_DIR, "ceo_truth_snapshot_v1.md");

const SOURCE_FILES = [
  "staffordos/leads/lead_registry_v1.json",
  "staffordos/leads/lead_events_v1.json",
  "staffordos/leads/send_ledger_v1.json",
  "staffordos/clients/client_registry_v1.json",
  "staffordos/revenue/revenue_truth_v1.json",
  "staffordos/clients/operator_dashboard_snapshot_v1.json",
  "staffordos/snapshots/primary_action_snapshot_v1.json",
  "staffordos/system_map/system_map_truth_v1.json",
  "staffordos/operator_daemon/operator_daemon_state_v1.json",
  "staffordos/snapshots/unit_work_snapshot_v1.json",
];

function abs(relPath) {
  return path.join(REPO_ROOT, relPath);
}

function exists(relPath) {
  return existsSync(abs(relPath));
}

function readJson(relPath, fallback) {
  const filePath = abs(relPath);
  if (!existsSync(filePath)) {
    return {
      value: fallback,
      exists: false,
      status: "missing",
      updated_at: null,
      file: relPath,
    };
  }

  try {
    const raw = readFileSync(filePath, "utf8");
    const value = JSON.parse(raw);
    return {
      value,
      exists: true,
      status: "loaded",
      updated_at: statSync(filePath).mtime.toISOString(),
      file: relPath,
    };
  } catch (error) {
    return {
      value: fallback,
      exists: true,
      status: "malformed",
      updated_at: statSync(filePath).mtime.toISOString(),
      file: relPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function text(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readSnapshotInputs() {
  const leadRegistry = readJson("staffordos/leads/lead_registry_v1.json", { items: [] });
  const leadEvents = readJson("staffordos/leads/lead_events_v1.json", { events: [] });
  const sendLedger = readJson("staffordos/leads/send_ledger_v1.json", { items: [] });
  const clientRegistry = readJson("staffordos/clients/client_registry_v1.json", { clients: [] });
  const revenueTruth = readJson("staffordos/revenue/revenue_truth_v1.json", {});
  const dashboardSnapshot = readJson("staffordos/clients/operator_dashboard_snapshot_v1.json", {});
  const primaryActionSnapshot = readJson("staffordos/snapshots/primary_action_snapshot_v1.json", {});
  const systemMapTruth = readJson("staffordos/system_map/system_map_truth_v1.json", {});
  const operatorDaemonState = readJson("staffordos/operator_daemon/operator_daemon_state_v1.json", {});
  const unitWorkSnapshot = readJson("staffordos/snapshots/unit_work_snapshot_v1.json", { open_work: [], summary: {} });

  return {
    leadRegistry,
    leadEvents,
    sendLedger,
    clientRegistry,
    revenueTruth,
    dashboardSnapshot,
    primaryActionSnapshot,
    systemMapTruth,
    operatorDaemonState,
    unitWorkSnapshot,
  };
}

function normalizeClient(client) {
  return {
    client_id: text(client.client_id),
    merchant_shop: text(client.merchant_shop || client.shop || client.domain),
    lifecycle_stage: text(client.lifecycle?.stage || client.lifecycle_stage),
    payment_status: text(client.deal?.payment_status || client.payment_status),
    audit_status: text(client.shopifixer?.audit_status),
    fix_status: text(client.shopifixer?.fix_status),
    abando_installed: client.abando?.installed === true,
    merchant_revenue_recovered: num(client.abando?.merchant_revenue_recovered),
    stafford_revenue_earned: num(client.business?.stafford_revenue_earned),
    priority_score: num(client.priority_score?.total ?? client.priority_score),
    next_action: {
      type: text(client.next_action?.type),
      owner: text(client.next_action?.owner),
      instructions: text(client.next_action?.instructions),
      auto_executable: client.next_action?.auto_executable === true,
    },
    blockers: Array.isArray(client.blocker_detection?.blockers) ? client.blocker_detection.blockers : [],
  };
}

function normalizeLead(lead) {
  return {
    lead_id: text(lead.lead_id || lead.id),
    merchant_shop: text(lead.name || lead.domain),
    lifecycle_stage: text(lead.lifecycle_stage),
    score: num(lead.score || lead.conversion_score || lead.status?.conversion_score),
    next_action: text(lead.status?.next_action || lead.next_action),
    routing_primary_offer: text(lead.routing?.primary_offer || lead.routing?.primary),
    routing_secondary_offer: text(lead.routing?.secondary_offer || lead.routing?.secondary),
    routing_rule: text(lead.routing?.rule),
  };
}

function deriveRevenueSection(inputs) {
  const dashboard = inputs.dashboardSnapshot.value || {};
  const clients = Array.isArray(inputs.clientRegistry.value.clients) ? inputs.clientRegistry.value.clients : [];
  const revenueSummary = dashboard.revenue_summary || {};
  const topMetrics = dashboard.top_metrics || {};

  const staffordRevenue = revenueSummary.stafford_revenue ?? clients.reduce((sum, client) => sum + num(client.revenue?.total_lifetime_value), 0);
  const recurringRevenue = revenueSummary.recurring_mrr ?? clients.reduce((sum, client) => sum + num(client.revenue?.abando_recurring_mrr), 0);
  const merchantRecovered = revenueSummary.merchant_revenue_recovered ?? clients.reduce((sum, client) => sum + num(client.abando?.merchant_revenue_recovered), 0);
  const activeRevenueClients = topMetrics.active_revenue_clients ?? clients.filter((client) => text(client.lifecycle?.stage) === "revenue_active").length;

  return {
    stafford_revenue: staffordRevenue,
    recurring_revenue: recurringRevenue,
    merchant_revenue_recovered: merchantRecovered,
    active_revenue_clients: activeRevenueClients,
  };
}

function deriveShopiFixerPipeline(inputs) {
  const clients = Array.isArray(inputs.clientRegistry.value.clients) ? inputs.clientRegistry.value.clients.map(normalizeClient) : [];
  const leads = Array.isArray(inputs.leadRegistry.value.items) ? inputs.leadRegistry.value.items.map(normalizeLead) : [];

  const auditsRequested = clients.filter((client) => client.lifecycle_stage === "audit_requested").length;
  const proposalsSent = clients.filter((client) => client.lifecycle_stage === "proposal_sent").length;
  const paidClients = clients.filter((client) => {
    const paymentStatus = String(client.payment_status || "").toLowerCase();
    return ["paid", "payment_received", "collected", "complete", "completed", "succeeded"].includes(paymentStatus) ||
      client.stafford_revenue_earned > 0;
  }).length;
  const clientsWaitingForFulfillment = clients.filter((client) => {
    const paymentStatus = String(client.payment_status || "").toLowerCase();
    return ["paid", "payment_received", "collected", "complete", "completed", "succeeded"].includes(paymentStatus) &&
      client.fix_status === "not_started";
  }).length;

  return {
    leads: leads.length,
    audits_requested: auditsRequested,
    proposals_sent: proposalsSent,
    paid_clients: paidClients,
    clients_waiting_for_fulfillment: clientsWaitingForFulfillment,
  };
}

function deriveFulfillment(inputs) {
  const clients = Array.isArray(inputs.clientRegistry.value.clients) ? inputs.clientRegistry.value.clients.map(normalizeClient) : [];

  return {
    fix_in_progress: clients.filter((client) => ["fix_in_progress", "qa", "proof_ready"].includes(client.lifecycle_stage) || ["in_progress", "active", "qa", "proof_ready"].includes(client.fix_status)).length,
    fix_completed: clients.filter((client) => client.lifecycle_stage === "fix_completed" || client.fix_status === "completed").length,
    proof_needed: null,
    review_needed: null,
    referral_needed: null,
  };
}

function deriveAbando(inputs) {
  const clients = Array.isArray(inputs.clientRegistry.value.clients) ? inputs.clientRegistry.value.clients.map(normalizeClient) : [];
  return {
    installs: clients.filter((client) => client.abando_installed).length,
    recovery_revenue: clients.reduce((sum, client) => sum + client.merchant_revenue_recovered, 0),
    active_recovery_clients: clients.filter((client) => client.abando_installed && client.merchant_revenue_recovered > 0).length,
  };
}

function deriveSystemHealth(inputs, metrics) {
  const dashboard = inputs.dashboardSnapshot.value || {};
  const revenueTruth = inputs.revenueTruth.value || {};
  const systemMap = inputs.systemMapTruth.value || {};
  const daemon = inputs.operatorDaemonState.value || {};
  const clients = Array.isArray(inputs.clientRegistry.value.clients) ? inputs.clientRegistry.value.clients.map(normalizeClient) : [];
  const leads = Array.isArray(inputs.leadRegistry.value.items) ? inputs.leadRegistry.value.items.map(normalizeLead) : [];

  const blockers = [];

  const bottleneck = text(revenueTruth.current_bottleneck) || text(systemMap.system_status?.current_bottleneck);
  if (bottleneck) {
    blockers.push(`Revenue truth bottleneck: ${bottleneck}`);
  }

  const auditRequested = metrics.shopifixer_pipeline.audits_requested || 0;
  const paidClients = metrics.shopifixer_pipeline.paid_clients || 0;
  if (auditRequested > 0) {
    blockers.push(`${auditRequested} client(s) are waiting on audit completion before payment close.`);
  }
  if (paidClients === 0) {
    blockers.push("No paid ShopiFixer clients are currently represented in client truth.");
  }

  const proofNeeded = metrics.fulfillment.proof_needed;
  const reviewNeeded = metrics.fulfillment.review_needed;
  const referralNeeded = metrics.fulfillment.referral_needed;
  if (proofNeeded === null || reviewNeeded === null || referralNeeded === null) {
    blockers.push("Proof/review/referral completion metrics are not directly represented in current runtime truth.");
  }

  const missingSources = [];
  for (const info of inputs.__sourceFileInfo) {
    if (!info.exists) missingSources.push(info.file);
  }

  return {
    blockers,
    stale_truth: {
      status: "unknown",
      reason: "No governed staleness threshold defined for CEO snapshot inputs; only source timestamps are available.",
      inspected_sources: inputs.__sourceFileInfo.map((item) => ({
        file: item.file,
        status: item.status,
        updated_at: item.updated_at,
      })),
      daemon: {
        status: text(daemon.status) || "unknown",
        last_run: text(daemon.last_run),
        loops_run: num(daemon.loops_run),
      },
    },
    missing_sources: missingSources,
    warnings: [
      "Top 5 actions are synthesized from existing runtime truth and remain partial until a single governed top-5 action artifact exists.",
      `Lead registry contains ${leads.length} record(s); current lead truth is real but still lead-heavy.`,
      dashboard.primary_focus?.action ? `Primary dashboard focus: ${text(dashboard.primary_focus.action)}` : "No dashboard primary focus available.",
    ],
  };
}

function derivePrimaryAction(inputs) {
  const primary = inputs.primaryActionSnapshot.value?.primary_action || {};
  const dashboard = inputs.dashboardSnapshot.value || {};
  const clients = Array.isArray(inputs.clientRegistry.value.clients) ? inputs.clientRegistry.value.clients.map(normalizeClient) : [];
  const unitWork = inputs.unitWorkSnapshot.value || {};

  return {
    action_label: text(primary.action_label),
    action_type: text(primary.action_type),
    domain_id: text(primary.domain_id),
    product_id: text(primary.product_id),
    owner: text(primary.owner),
    priority_score: num(primary.priority_score),
    urgency: text(primary.urgency),
    confidence: num(primary.confidence),
    confidence_band: text(primary.confidence_band),
    next_step: text(primary.next_step),
    expected_outcome: text(primary.expected_outcome),
    evidence: Array.isArray(primary.evidence) ? primary.evidence : [],
    risk: Array.isArray(primary.risk) ? primary.risk : [],
    source_file: "staffordos/snapshots/primary_action_snapshot_v1.json",
    supporting_context: Array.isArray(primary.supporting_context) ? primary.supporting_context : [],
    context: {
      revenue_gap: num(inputs.dashboardSnapshot.value?.revenue_gaps?.[0]?.gap),
      primary_focus: text(dashboard.primary_focus?.action),
      open_work_items: Array.isArray(unitWork.open_work) ? unitWork.open_work.length : 0,
      client_count: clients.length,
    }
  };
}

function deriveTopFiveActions(inputs, primaryAction) {
  const dashboard = inputs.dashboardSnapshot.value || {};
  const clients = Array.isArray(inputs.clientRegistry.value.clients) ? inputs.clientRegistry.value.clients.map(normalizeClient) : [];
  const leads = Array.isArray(inputs.leadRegistry.value.items) ? inputs.leadRegistry.value.items.map(normalizeLead) : [];
  const unitWork = inputs.unitWorkSnapshot.value || {};

  const candidates = [];

  if (primaryAction.action_label) {
    candidates.push({
      action_label: primaryAction.action_label,
      source_file: primaryAction.source_file,
      source_field: "primary_action.next_step",
      owner: primaryAction.owner || "ross",
      evidence: primaryAction.evidence,
      confidence: primaryAction.confidence,
      authority: "authoritative primary action",
      rank_basis: primaryAction.priority_score || 100,
    });
  }

  if (dashboard.primary_focus?.action) {
    candidates.push({
      action_label: text(dashboard.primary_focus.action),
      source_file: "staffordos/clients/operator_dashboard_snapshot_v1.json",
      source_field: "primary_focus.action",
      owner: "ross",
      evidence: [
        text(dashboard.primary_focus.reason),
        text(dashboard.primary_focus.next_action?.instructions),
      ].filter(Boolean),
      confidence: 0.75,
      authority: "dashboard derived truth",
      rank_basis: num(dashboard.primary_focus.priority_total || dashboard.primary_focus.priority_score),
    });
  }

  const currentClient = clients.find((client) => client.client_id === "cart-agent-dev.myshopify.com") || clients[0] || null;
  if (currentClient?.next_action?.instructions) {
    candidates.push({
      action_label: currentClient.next_action.instructions,
      source_file: "staffordos/clients/client_registry_v1.json",
      source_field: "clients[].next_action.instructions",
      owner: currentClient.next_action.owner || "system",
      evidence: [
        `Client: ${currentClient.client_id}`,
        `Lifecycle: ${currentClient.lifecycle_stage}`,
        `Payment: ${currentClient.payment_status}`,
      ],
      confidence: 0.7,
      authority: "client registry truth",
      rank_basis: currentClient.priority_score,
    });
  }

  const openWork = Array.isArray(unitWork.open_work) ? unitWork.open_work : [];
  if (openWork.length > 0) {
    for (const item of openWork) {
      if (!item?.next_action) continue;
      candidates.push({
        action_label: text(item.next_action),
        source_file: "staffordos/snapshots/unit_work_snapshot_v1.json",
        source_field: "open_work[].next_action",
        owner: text(item.owner) || "system",
        evidence: [
          `Unit: ${text(item.unit_id)}`,
          `Type: ${text(item.type)}`,
          `Stage: ${text(item.stage)}`,
          `Domain: ${text(item.domain_id)}`,
        ].filter(Boolean),
        confidence: 0.65,
        authority: "unit work truth",
        rank_basis: item.type === "opportunity" ? 90 : item.type === "delivery" ? 70 : 50,
      });
    }
  }

  const leadActions = leads
    .filter((lead) => lead.next_action)
    .map((lead) => ({
      action_label: lead.next_action,
      source_file: "staffordos/leads/lead_registry_v1.json",
      source_field: "items[].status.next_action / next_action",
      owner: "system",
      evidence: [
        `Lead: ${lead.merchant_shop || lead.lead_id}`,
        `Stage: ${lead.lifecycle_stage}`,
        `Primary offer: ${lead.routing_primary_offer || "unknown"}`,
      ],
      confidence: 0.55,
      authority: "lead registry truth",
      rank_basis: lead.score,
    }));

  candidates.push(...leadActions);

  const unique = uniqueBy(candidates, (item) => `${item.action_label}::${item.source_file}`);
  unique.sort((a, b) => b.rank_basis - a.rank_basis);

  const items = unique.slice(0, 5).map((item, index) => ({
    rank: index + 1,
    action_label: item.action_label,
    source_file: item.source_file,
    source_field: item.source_field,
    owner: item.owner,
    authority: item.authority,
    evidence: item.evidence,
    confidence: item.confidence,
  }));

  return {
    status: "partial",
    items,
    evidence: items.flatMap((item) => item.evidence || []),
    note: items.length >= 5
      ? "Five actions were synthesized from existing runtime truth."
      : `Only ${items.length} distinct actions could be derived from current runtime truth without inventing data.`,
  };
}

function deriveActionSource(inputs) {
  return {
    primary: "staffordos/snapshots/primary_action_snapshot_v1.json",
    supporting: [
      "staffordos/clients/operator_dashboard_snapshot_v1.json",
      "staffordos/clients/client_registry_v1.json",
      "staffordos/leads/lead_registry_v1.json",
      "staffordos/snapshots/unit_work_snapshot_v1.json",
    ],
    status: "partial",
  };
}

function buildSnapshot() {
  const sourceFileInfo = SOURCE_FILES.map((file) => {
    const filePath = abs(file);
    if (!exists(file)) {
      return {
        file,
        exists: false,
        status: "missing",
        updated_at: null,
      };
    }

    try {
      const stats = statSync(filePath);
      return {
        file,
        exists: true,
        status: "loaded",
        updated_at: stats.mtime.toISOString(),
      };
    } catch (error) {
      return {
        file,
        exists: true,
        status: "error",
        updated_at: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const inputs = readSnapshotInputs();
  inputs.__sourceFileInfo = sourceFileInfo;

  const revenue = deriveRevenueSection(inputs);
  const shopifixerPipeline = deriveShopiFixerPipeline(inputs);
  const fulfillment = deriveFulfillment(inputs);
  const abando = deriveAbando(inputs);
  const systemHealth = deriveSystemHealth(inputs, { revenue, shopifixer_pipeline: shopifixerPipeline, fulfillment });
  const primaryAction = derivePrimaryAction(inputs);
  const topFiveActions = deriveTopFiveActions(inputs, primaryAction);
  const actionSource = deriveActionSource(inputs);

  const snapshot = {
    metadata: {
      schema: "staffordos.ceo_truth_snapshot.v1",
      generated_at: new Date().toISOString(),
      source_files: sourceFileInfo,
      confidence: topFiveActions.status === "authoritative" ? "high" : "partial",
    },
    revenue,
    shopifixer_pipeline: shopifixerPipeline,
    fulfillment,
    abando,
    system_health: systemHealth,
    operator_actions: {
      primary_action: primaryAction,
      top_5_actions: topFiveActions,
      action_source: actionSource,
      confidence: {
        level: topFiveActions.status === "authoritative" ? "high" : "partial",
        primary_action: "high",
        top_5_actions: topFiveActions.status,
        note: "Primary action is authoritative; the top-5 list is synthesized from runtime truth and remains partial until a single governed top-5 artifact exists.",
      },
    },
  };

  return snapshot;
}

function renderMarkdown(snapshot) {
  const lines = [];
  lines.push("# CEO Truth Snapshot v1");
  lines.push("");
  lines.push(`Generated at: ${snapshot.metadata.generated_at}`);
  lines.push(`Confidence: ${snapshot.metadata.confidence}`);
  lines.push("");
  lines.push("## Revenue");
  lines.push(`- Stafford revenue: ${snapshot.revenue.stafford_revenue ?? "unavailable"}`);
  lines.push(`- Recurring revenue: ${snapshot.revenue.recurring_revenue ?? "unavailable"}`);
  lines.push(`- Merchant revenue recovered: ${snapshot.revenue.merchant_revenue_recovered ?? "unavailable"}`);
  lines.push(`- Active revenue clients: ${snapshot.revenue.active_revenue_clients ?? "unavailable"}`);
  lines.push("");
  lines.push("## ShopiFixer Pipeline");
  lines.push(`- Leads: ${snapshot.shopifixer_pipeline.leads ?? "unavailable"}`);
  lines.push(`- Audits requested: ${snapshot.shopifixer_pipeline.audits_requested ?? "unavailable"}`);
  lines.push(`- Proposals sent: ${snapshot.shopifixer_pipeline.proposals_sent ?? "unavailable"}`);
  lines.push(`- Paid clients: ${snapshot.shopifixer_pipeline.paid_clients ?? "unavailable"}`);
  lines.push(`- Clients waiting for fulfillment: ${snapshot.shopifixer_pipeline.clients_waiting_for_fulfillment ?? "unavailable"}`);
  lines.push("");
  lines.push("## Fulfillment");
  lines.push(`- Fix in progress: ${snapshot.fulfillment.fix_in_progress ?? "unavailable"}`);
  lines.push(`- Fix completed: ${snapshot.fulfillment.fix_completed ?? "unavailable"}`);
  lines.push(`- Proof needed: ${snapshot.fulfillment.proof_needed === null ? "null" : snapshot.fulfillment.proof_needed}`);
  lines.push(`- Review needed: ${snapshot.fulfillment.review_needed === null ? "null" : snapshot.fulfillment.review_needed}`);
  lines.push(`- Referral needed: ${snapshot.fulfillment.referral_needed === null ? "null" : snapshot.fulfillment.referral_needed}`);
  lines.push("");
  lines.push("## Abando");
  lines.push(`- Installs: ${snapshot.abando.installs ?? "unavailable"}`);
  lines.push(`- Recovery revenue: ${snapshot.abando.recovery_revenue ?? "unavailable"}`);
  lines.push(`- Active recovery clients: ${snapshot.abando.active_recovery_clients ?? "unavailable"}`);
  lines.push("");
  lines.push("## System Health");
  lines.push(`- Blockers: ${(snapshot.system_health.blockers || []).length}`);
  lines.push(`- Missing sources: ${(snapshot.system_health.missing_sources || []).length}`);
  lines.push(`- Stale truth: ${snapshot.system_health.stale_truth?.status || "unknown"}`);
  lines.push("");
  lines.push("## Primary Action");
  const primary = snapshot.operator_actions.primary_action;
  lines.push(`- Action: ${primary.action_label || "unavailable"}`);
  lines.push(`- Owner: ${primary.owner || "unknown"}`);
  lines.push(`- Domain: ${primary.domain_id || "unknown"}`);
  lines.push(`- Confidence: ${primary.confidence ?? "unavailable"}`);
  lines.push(`- Next step: ${primary.next_step || "unavailable"}`);
  lines.push("");
  lines.push("## Top 5 Actions");
  if (snapshot.operator_actions.top_5_actions?.items?.length) {
    for (const action of snapshot.operator_actions.top_5_actions.items) {
      lines.push(`${action.rank}. ${action.action_label} (${action.source_file})`);
    }
  } else {
    lines.push("- unavailable");
  }
  lines.push("");
  lines.push(`Top 5 status: ${snapshot.operator_actions.top_5_actions?.status || "unknown"}`);
  lines.push(`Action source: ${JSON.stringify(snapshot.operator_actions.action_source)}`);
  lines.push("");
  lines.push("## Notes");
  for (const warning of snapshot.system_health.warnings || []) {
    lines.push(`- ${warning}`);
  }
  lines.push("");
  lines.push("This snapshot is read-only and derived from existing runtime truth files only.");

  return `${lines.join("\n")}\n`;
}

export function buildCeoTruthSnapshot() {
  const snapshot = buildSnapshot();
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_JSON, `${JSON.stringify(snapshot, null, 2)}\n`);
  writeFileSync(OUT_MD, renderMarkdown(snapshot));
  return snapshot;
}

function isDirectRun() {
  return Boolean(process.argv[1]) && path.resolve(process.argv[1]) === __filename;
}

if (isDirectRun()) {
  const snapshot = buildCeoTruthSnapshot();
  console.log(JSON.stringify({
    ok: true,
    schema: snapshot.metadata.schema,
    generated_at: snapshot.metadata.generated_at,
    primary_action: snapshot.operator_actions.primary_action.action_label,
    top_5_status: snapshot.operator_actions.top_5_actions.status,
    confidence: snapshot.metadata.confidence,
  }, null, 2));
}
