import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { OperatorNav } from "../../../components/operator/OperatorNav";

const PATHS = {
  leadRegistry: "staffordos/leads/lead_registry_v1.json",
  revenueTruth: "staffordos/revenue/revenue_truth_v1.json",
  dashboardSnapshot: "staffordos/clients/operator_dashboard_snapshot_v1.json"
} as const;

type LeadRecord = {
  id?: string;
  lead_id?: string;
  name?: string;
  domain?: string | null;
  product?: string;
  lifecycle_stage?: string;
  status?: {
    current_stage?: string;
    current_bottleneck?: string;
    next_action?: string;
  };
  score?: number;
  contact?: {
    email?: string;
  };
  engagement?: {
    sent?: boolean;
    replied?: boolean;
    dry_run_ready?: boolean;
  };
  updated_at?: string;
  created_at?: string;
  close_engine?: {
    last_evaluated_at?: string;
    hours_since_proposal?: number;
    suggested_message?: string;
    urgency?: string;
  };
};

type QueueRow = {
  item: string;
  type: string;
  why: string;
  revenueImpact: string;
  nextAction: string;
  age: string;
  blocker: string;
  status: string;
};

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, PATHS.leadRegistry))) return cwd;

  const fromFrontend = path.resolve(cwd, "../../..");
  if (existsSync(path.join(fromFrontend, PATHS.leadRegistry))) return fromFrontend;

  return fromFrontend;
}

function readJson<T>(repoRoot: string, relativePath: string, fallback: T): T {
  const filePath = path.join(repoRoot, relativePath);

  if (!existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function money(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "$0";
  return `$${numberValue.toLocaleString()}`;
}

function text(value: unknown, fallback = "—") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function translateBottleneck(value: unknown) {
  const normalized = String(value ?? "").trim();
  if (normalized === "lead_supply_or_contact_quality") {
    return "Not enough good leads or reachable contacts";
  }
  return normalized || "No revenue blocker recorded";
}

function translateStatus(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    proposal_sent: "Offer sent, waiting on payment",
    waiting_for_payment: "Waiting on payment",
    contact_needed: "Needs contact info",
    dry_run_ready: "Ready to send",
    engaged: "Engaged",
    send_initial_outreach: "Ready to send",
    followup_sent: "Waiting for reply",
    replied: "Replied",
    queued: "Queued",
    sent: "Sent",
    active: "Active",
    blocked: "Blocked"
  };

  return map[normalized] || (String(value ?? "").trim() || "Unknown");
}

function formatAge(value: unknown) {
  if (!value) return "Unknown";
  const timestamp = Date.parse(String(value));
  if (Number.isNaN(timestamp)) return "Unknown";

  const diffHours = Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60)));
  if (diffHours < 24) {
    return diffHours <= 0 ? "Today" : `${diffHours} hour${diffHours === 1 ? "" : "s"}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths === 1 ? "" : "s"}`;
}

function formatHours(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) return "Unknown";
  if (numberValue < 1) return "Today";
  if (numberValue < 24) return `${Math.round(numberValue)} hour${Math.round(numberValue) === 1 ? "" : "s"}`;
  const days = Math.floor(numberValue / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

function stage(lead: LeadRecord) {
  return String(lead.lifecycle_stage || lead.status?.current_stage || "").trim().toLowerCase();
}

function leadName(lead: LeadRecord) {
  return lead.name || lead.domain || lead.lead_id || lead.id || "Unknown lead";
}

function leadNextAction(lead: LeadRecord) {
  const currentStage = stage(lead);
  const fallback =
    currentStage === "engaged"
      ? "Qualify the reply and prepare the offer."
      : currentStage === "followup_sent"
        ? "Wait for the reply or track the next click."
        : currentStage === "send_initial_outreach"
          ? "Send the next outreach touch."
          : currentStage === "contact_needed"
            ? "Find or add a valid contact email."
            : currentStage === "proposal_sent"
              ? "Follow up and close payment."
              : "Review the next revenue step.";

  return text(lead.status?.next_action, fallback);
}

function leadBlocker(lead: LeadRecord) {
  const currentStage = stage(lead);
  if (currentStage === "contact_needed") return "Needs contact info";
  if (currentStage === "engaged") return "Waiting for an offer";
  if (currentStage === "followup_sent") return "Waiting on a reply";
  if (currentStage === "send_initial_outreach") return "Waiting to send or gather a better contact";
  if (currentStage === "proposal_sent") return "Waiting on payment";
  return text(lead.status?.current_bottleneck, "No blocker recorded");
}

function oldestAge(items: LeadRecord[]) {
  const timestamps = items
    .map((item) => item.updated_at || item.created_at || item.close_engine?.last_evaluated_at)
    .filter(Boolean);
  if (!timestamps.length) return "Unknown";

  let oldest = Date.now();
  for (const value of timestamps) {
    const time = Date.parse(String(value));
    if (!Number.isNaN(time) && time < oldest) {
      oldest = time;
    }
  }

  return formatAge(new Date(oldest).toISOString());
}

function buildLeadRow(lead: LeadRecord, overrides: Partial<QueueRow> = {}): QueueRow {
  const currentStage = stage(lead);
  const translatedStatus = translateStatus(currentStage);
  const status =
    overrides.status ||
    translatedStatus ||
    "Unknown";

  return {
    item: leadName(lead),
    type: overrides.type || `ShopiFixer ${status.toLowerCase()}`,
    why:
      overrides.why ||
      (currentStage === "engaged"
        ? "Ross should care because this merchant replied and is close to a real offer."
        : currentStage === "followup_sent"
          ? "Ross should care because the conversation is warm and needs one more touch."
          : currentStage === "send_initial_outreach"
            ? "Ross should care because outreach is active and can create the next sale."
            : currentStage === "contact_needed"
              ? "Ross should care because nothing moves until a valid contact exists."
              : "Ross should care because this item can still move revenue forward."),
    revenueImpact:
      overrides.revenueImpact ||
      (currentStage === "engaged"
        ? "High — a qualified reply can become a paid ShopiFixer close."
        : currentStage === "followup_sent"
          ? "Medium — a follow-up can reopen the path to revenue."
          : currentStage === "send_initial_outreach"
            ? "Medium — this outreach can create new opportunities."
            : currentStage === "contact_needed"
              ? "Low until contact info is fixed."
              : "Potential revenue if the next step is handled."),
    nextAction: overrides.nextAction || leadNextAction(lead),
    age: overrides.age || formatAge(lead.updated_at || lead.created_at || lead.close_engine?.last_evaluated_at),
    blocker: overrides.blocker || leadBlocker(lead),
    status
  };
}

function sectionCountLabel(count: number) {
  return `${count} item${count === 1 ? "" : "s"}`;
}

function QueueSection({ title, rows, note }: { title: string; rows: QueueRow[]; note: string }) {
  return (
    <section className="panel">
      <div className="panelInner">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p className="eyebrow">{title}</p>
            <h2 className="sectionTitle" style={{ marginBottom: 8 }}>
              {sectionCountLabel(rows.length)}
            </h2>
          </div>
          <p className="subtitle" style={{ margin: 0, maxWidth: 720 }}>
            {note}
          </p>
        </div>

        <div className="tableWrap" style={{ marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Why Ross should care</th>
                <th>Revenue impact</th>
                <th>Next action</th>
                <th>Age</th>
                <th>Blocker</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${title}-${row.item}-${row.type}`}>
                  <td>{row.item}</td>
                  <td>{row.type}</td>
                  <td>{row.why}</td>
                  <td>{row.revenueImpact}</td>
                  <td>{row.nextAction}</td>
                  <td>{row.age}</td>
                  <td>{row.blocker}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function loadRevenueQueue() {
  const repoRoot = resolveRepoRoot();
  const leadRegistry = readJson<{ items?: LeadRecord[] }>(repoRoot, PATHS.leadRegistry, { items: [] });
  const revenueTruth = readJson<any>(repoRoot, PATHS.revenueTruth, {});
  const dashboardSnapshot = readJson<any>(repoRoot, PATHS.dashboardSnapshot, {});

  const leads = Array.isArray(leadRegistry.items) ? leadRegistry.items : [];
  const priorityFocus = dashboardSnapshot?.primary_focus || null;
  const priorityClient = Array.isArray(dashboardSnapshot?.priority_clients) ? dashboardSnapshot.priority_clients[0] : null;
  const revenueGap = Array.isArray(dashboardSnapshot?.revenue_gaps) ? dashboardSnapshot.revenue_gaps[0] : null;

  const paymentWaitingRows: QueueRow[] = priorityFocus
    ? [
        {
          item: text(priorityFocus.merchant_shop || priorityFocus.client_id, "Current payment close"),
          type: "Payments waiting",
          why: "Merchant value has already been proven. This is the closest cash close in the queue.",
          revenueImpact: `${money(revenueGap?.gap ?? priorityFocus.merchant_revenue ?? 0)} of merchant value has been recovered (proof). Stafford revenue is captured only when the merchant pays.`,
          nextAction: text(priorityFocus.next_action?.instructions || priorityFocus.action, "Follow up and close payment."),
          age: formatHours(priorityClient?.close_engine?.hours_since_proposal),
          blocker: "Waiting on payment",
          status: translateStatus("proposal_sent")
        }
      ]
    : leads
        .filter((lead) => stage(lead) === "proposal_sent" || String(lead.status?.current_stage || "").toLowerCase() === "waiting_for_payment")
        .slice(0, 3)
        .map((lead) =>
          buildLeadRow(lead, {
            type: "Payments waiting",
            why: "Ross should care because this offer is already out and money is waiting to be captured.",
            revenueImpact: "High — this is direct revenue that can close quickly.",
            blocker: "Waiting on payment",
            status: translateStatus(stage(lead)),
            nextAction: leadNextAction(lead)
          })
        );

  const offersWaitingRows = leads
    .filter((lead) => stage(lead) === "engaged" || lead.engagement?.replied)
    .sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)) || Date.parse(String(b.updated_at || 0)) - Date.parse(String(a.updated_at || 0)))
    .slice(0, 5)
    .map((lead) =>
      buildLeadRow(lead, {
        type: "Offers waiting",
        why: "Ross should care because this merchant replied and is ready for a real offer.",
        revenueImpact: "High — a qualified reply can become a paid ShopiFixer close.",
        blocker: "Offer not sent yet",
        status: "Engaged"
      })
    );

  const warmOpportunitiesRows = leads
    .filter((lead) => stage(lead) === "followup_sent")
    .sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)) || Date.parse(String(b.updated_at || 0)) - Date.parse(String(a.updated_at || 0)))
    .slice(0, 5)
    .map((lead) =>
      buildLeadRow(lead, {
        type: "Warm opportunities",
        why: "Ross should care because outreach landed and one good follow-up can reopen the conversation.",
        revenueImpact: "Medium — this follow-up could move the lead toward an offer or payment.",
        blocker: "Waiting on a reply",
        status: "Waiting for reply"
      })
    );

  const activeCampaignLeads = leads.filter((lead) => stage(lead) === "send_initial_outreach");
  const activeCampaignRows: QueueRow[] = activeCampaignLeads.length
    ? [
        {
          item: `ShopiFixer outreach campaign (${activeCampaignLeads.length} prospects)`,
          type: "Active campaigns",
          why: "Ross should care because this is the current source of new opportunities.",
          revenueImpact: `${activeCampaignLeads.length} prospects are still in play for future revenue.`,
          nextAction: "Review the warmest replies and keep outreach moving.",
          age: oldestAge(activeCampaignLeads),
          blocker: activeCampaignLeads.some((lead) => !lead.contact?.email && !lead.domain)
            ? "Some prospects still need contact info"
            : "Waiting on responses",
          status: "Active"
        }
      ]
    : [];

  const staleOpportunitiesRows = leads
    .filter((lead) => stage(lead) === "contact_needed")
    .sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)) || Date.parse(String(b.updated_at || 0)) - Date.parse(String(a.updated_at || 0)))
    .slice(0, 5)
    .map((lead) =>
      buildLeadRow(lead, {
        type: "Stale opportunities",
        why: "Ross should care because this opportunity cannot move without a usable contact.",
        revenueImpact: "Low until contact info is fixed; then it can become a real sales lead.",
        blocker: "Needs contact info",
        status: "Needs contact info"
      })
    );

  const staffordRevenueValue =
    dashboardSnapshot?.revenue_summary?.stafford_revenue ??
    dashboardSnapshot?.top_metrics?.total_stafford_revenue ??
    0;

  return {
    currentBottleneck: translateBottleneck(revenueTruth?.current_bottleneck),
    topRevenueAction: text(priorityFocus?.next_action?.instructions || revenueTruth?.next_actions?.[0]?.action, "Review the highest-priority revenue motion."),
    staffordRevenue: money(staffordRevenueValue),
    merchantValueRecovered: money(revenueGap?.gap ?? 0),
    revenueGap,
    paymentWaitingRows,
    offersWaitingRows,
    warmOpportunitiesRows,
    activeCampaignRows,
    staleOpportunitiesRows
  };
}

export default function RevenueCommandPage() {
  const data = loadRevenueQueue();

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS</p>
            <h1 className="title">Revenue Queue</h1>
            <p className="subtitle">
              One business queue for the next money, the next follow-up, and the work that is still stalled.
            </p>

            <OperatorNav activeHref="/operator/revenue-command" />

            <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
              <span className="chip">Revenue block: {data.currentBottleneck}</span>
              <span className="chip">Stafford revenue (captured): {data.staffordRevenue}</span>
              <span className="chip">Merchant value recovered (proof): {data.merchantValueRecovered}</span>
              <span className="chip">Payments waiting: {data.paymentWaitingRows.length}</span>
              <span className="chip">Offers waiting: {data.offersWaitingRows.length}</span>
              <span className="chip">Warm opportunities: {data.warmOpportunitiesRows.length}</span>
              <span className="chip">Active campaigns: {data.activeCampaignRows.length}</span>
              <span className="chip">Stale opportunities: {data.staleOpportunitiesRows.length}</span>
            </div>
          </div>
        </section>

        <QueueSection
          title="Payments waiting"
          note="These are the closest cash closes. Ross should follow up here first."
          rows={data.paymentWaitingRows}
        />

        <QueueSection
          title="Offers waiting"
          note="These are qualified replies that need a clear offer before the money can move."
          rows={data.offersWaitingRows}
        />

        <QueueSection
          title="Warm opportunities"
          note="These conversations are warm enough to keep nudging without starting from scratch."
          rows={data.warmOpportunitiesRows}
        />

        <QueueSection
          title="Active campaigns"
          note="These are the live outreach motions creating the next batch of opportunities."
          rows={data.activeCampaignRows}
        />

        <QueueSection
          title="Stale opportunities"
          note="These items need contact cleanup before they can produce revenue again."
          rows={data.staleOpportunitiesRows}
        />
      </div>
    </main>
  );
}
