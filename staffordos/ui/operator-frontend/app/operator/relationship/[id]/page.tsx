import Link from "next/link";
import { notFound } from "next/navigation";
import { OperatorNav } from "../../../../components/operator/OperatorNav";
import { getDecisionEngineReport } from "../../../../lib/operator/decisionEngineResolver";
import { resolveActionCandidates } from "../../../../lib/operator/actionResolver";
import { resolveRelationshipById } from "../../../../lib/operator/relationshipResolver";
import { loadExecutionLog } from "../../../../lib/operator/loadExecutionLog";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type PageProps = {
  params: Promise<{
    id?: string;
  }> | {
    id?: string;
  };
};

const PATHS = {
  revenueTruth: "staffordos/revenue/revenue_truth_v1.json",
  clientRegistry: "staffordos/clients/client_registry_v1.json",
  merchantLifecycle: "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json",
  fulfillmentTruth: "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json",
} as const;

type PacketRecord = {
  packet_id?: string;
  reservation_id?: string | null;
  store_domain?: string | null;
  payment_reference?: string | null;
  status?: string | null;
  execution_status?: string | null;
  proof_status?: string | null;
  completion_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PacketListResponse = {
  ok?: boolean;
  packets?: PacketRecord[];
};

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, PATHS.revenueTruth))) return cwd;

  const fromFrontend = path.resolve(cwd, "../../..");
  if (existsSync(path.join(fromFrontend, PATHS.revenueTruth))) return fromFrontend;

  return fromFrontend;
}

function readJson<T>(repoRoot: string, relativePath: string, fallback: T): T {
  const filePath = path.join(repoRoot, relativePath);
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function text(value: unknown, fallback = "—") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function money(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "$0";
  return `$${numberValue.toLocaleString()}`;
}

function dateText(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatList(items: unknown[], fallback = "None") {
  const values = items.map((item) => text(item, "")).filter(Boolean);
  return values.length ? values : [fallback];
}

function summarizeAction(action: any) {
  if (!action) return "Unavailable";
  const blocker = action.blocker ? ` · blocker: ${action.blocker}` : "";
  const confidence = typeof action.confidence === "number" ? ` · confidence ${Math.round(action.confidence * 100)}%` : "";
  return `${text(action.title || action.action_type, "Unavailable")} (${text(action.action_type)}) · ${text(action.status)}${blocker}${confidence}`;
}

function sectionValue(label: string, value: unknown) {
  return (
    <div>
      <strong>{label}:</strong> {text(value)}
    </div>
  );
}

function normalizeId(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^lead_/, "")
    .replace(/^rel_/, "");
}

function normalizeStore(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function resolvePacketApiBases() {
  const rawBases = [
    process.env.PACKET_AUTHORITY_URL,
    process.env.NEXT_PUBLIC_PACKET_AUTHORITY_URL,
    process.env.CART_AGENT_API_URL,
    process.env.NEXT_PUBLIC_CART_AGENT_API_URL,
    process.env.NEXT_PUBLIC_ABANDO_API_BASE,
    process.env.NEXT_PUBLIC_API_BASE,
    process.env.NEXT_PUBLIC_ABANDO_BACKEND_ORIGIN,
    process.env.ABANDO_BACKEND_ORIGIN,
    process.env.ABANDO_API_BASE,
    process.env.CART_AGENT_API_BASE,
    "https://pay.abando.ai",
    "https://cart-agent-api.onrender.com",
  ];

  return Array.from(
    new Set(
      rawBases
        .map((base) => String(base ?? "").trim().replace(/\/$/, ""))
        .filter(Boolean),
    ),
  );
}

function isPaidPacket(packet: PacketRecord | null | undefined) {
  const status = String(packet?.status ?? "").trim().toLowerCase();
  return status === "payment_received" || status === "paid";
}

function comparePacketRecency(left: PacketRecord, right: PacketRecord) {
  const leftTime = Date.parse(String(left.updated_at || left.created_at || ""));
  const rightTime = Date.parse(String(right.updated_at || right.created_at || ""));
  return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
}

async function readPackets(): Promise<PacketRecord[]> {
  for (const base of resolvePacketApiBases()) {
    try {
      const response = await fetch(`${base}/api/operator/packets`, { cache: "no-store" });
      if (!response.ok) continue;

      const payload = (await response.json()) as PacketListResponse;
      if (Array.isArray(payload?.packets)) {
        return payload.packets;
      }
    } catch {
      continue;
    }
  }

  return [];
}

function packetCandidateKeys(relationship: any) {
  return Array.from(
    new Set(
      [
        relationship?.identity?.store_domain,
        relationship?.identity?.merchant_shop,
        relationship?.identity?.client_id,
        relationship?.identity?.domain,
        relationship?.facets?.merchant?.store_domain,
        relationship?.facets?.merchant?.merchant_shop,
        relationship?.facets?.client?.client_id,
        relationship?.facets?.lead?.domain,
      ]
        .map((value) => normalizeStore(value))
        .filter(Boolean),
    ),
  );
}

function matchesPacketRelationship(packet: PacketRecord, candidateKeys: string[]) {
  const packetStore = normalizeStore(packet.store_domain);
  const packetId = normalizeStore(packet.packet_id);
  return Boolean(candidateKeys.includes(packetStore) || candidateKeys.includes(packetId));
}

export default async function RelationshipPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const id = typeof resolvedParams?.id === "string" ? resolvedParams.id.trim() : "";
  if (!id) {
    notFound();
  }

  const relationshipId = id.startsWith("rel_") ? id : `rel_${id}`;
  const relationship = resolveRelationshipById(relationshipId) || resolveRelationshipById(normalizeId(relationshipId)) || null;
  const repoRoot = resolveRepoRoot();
  const revenueTruth = readJson<any>(repoRoot, PATHS.revenueTruth, {});
  const executionLog = loadExecutionLog();
  const actionCandidates = resolveActionCandidates().filter((candidate) => candidate.relationship_id === relationship?.relationship_id);
  const decisionEngine = getDecisionEngineReport();
  const decisionContext = [
    decisionEngine.top_action,
    decisionEngine.top_revenue_action,
    decisionEngine.top_fulfillment_action,
    decisionEngine.top_relationship_action,
    decisionEngine.top_blocker,
    ...(Array.isArray(decisionEngine.supporting_actions) ? decisionEngine.supporting_actions : []),
  ].filter(Boolean);

  if (!relationship) {
    notFound();
  }

  const packetAuthorityPackets = await readPackets();
  const relationshipPacketCandidates = packetCandidateKeys(relationship);
  const livePacket =
    packetAuthorityPackets
      .filter(isPaidPacket)
      .filter((packet) => matchesPacketRelationship(packet, relationshipPacketCandidates))
      .sort(comparePacketRecency)[0] || null;

  const relationshipLead = relationship.facets.lead || {};
  const relationshipClient = relationship.facets.client || {};
  const relationshipMerchant = relationship.facets.merchant || {};
  const relationshipFulfillment = relationship.facets.fulfillment || {};
  const relationshipExecution = relationship.facets.execution || {};
  const relationshipOutcome = relationship.facets.outcome || {};
  const executionEvents = Array.isArray(executionLog.executionEvents) ? executionLog.executionEvents : [];
  const outcomeEvents = Array.isArray(executionLog.outcomeEvents) ? executionLog.outcomeEvents : [];
  const relatedExecutions = executionEvents.filter((event: any) => {
    const customer = text(event.customer, "");
    return [
      relationship.identity.client_id,
      relationship.identity.merchant_shop,
      relationship.identity.store_domain,
      relationship.identity.lead_id,
      relationship.identity.domain,
      relationship.identity.email,
      relationship.display_name,
      relationship.relationship_id,
    ].some((candidate) => normalizeId(candidate || "") === normalizeId(customer));
  });
  const relatedOutcomeEvents = outcomeEvents.filter((event: any) => {
    const customer = text(event.customer, "");
    return [
      relationship.identity.client_id,
      relationship.identity.merchant_shop,
      relationship.identity.store_domain,
      relationship.identity.lead_id,
      relationship.identity.domain,
      relationship.identity.email,
      relationship.display_name,
      relationship.relationship_id,
    ].some((candidate) => normalizeId(candidate || "") === normalizeId(customer));
  });

  const currentTopAction = actionCandidates.find((candidate: any) => candidate.status === "ready") || actionCandidates[0] || null;
  const topBlocker = actionCandidates
    .filter((candidate: any) => candidate.status === "blocked")
    .find((candidate: any) => candidate.blocker) || null;

  const commercialFacts = [
    livePacket?.packet_id ? `Packet ID: ${livePacket.packet_id}` : null,
    livePacket?.reservation_id ? `Reservation ID: ${livePacket.reservation_id}` : null,
    livePacket?.store_domain ? `Store: ${livePacket.store_domain}` : null,
    livePacket?.status ? `Packet status: ${livePacket.status}` : null,
    livePacket?.payment_reference ? `Payment reference: ${livePacket.payment_reference}` : null,
    relationshipClient.payment_status ? `Client payment: ${relationshipClient.payment_status}` : null,
    relationshipClient.closed_at ? `Client closed at: ${dateText(relationshipClient.closed_at)}` : null,
    relationshipClient.lifetime_value ? `Client LTV: ${money(relationshipClient.lifetime_value)}` : null,
    relationshipMerchant.offer_status ? `Offer status: ${relationshipMerchant.offer_status}` : null,
    relationshipMerchant.payment_status ? `Merchant payment: ${relationshipMerchant.payment_status}` : null,
    relationshipMerchant.revenue_status ? `Revenue status: ${relationshipMerchant.revenue_status}` : null,
    revenueTruth?.current_bottleneck ? `Revenue bottleneck: ${revenueTruth.current_bottleneck}` : null,
    Array.isArray(revenueTruth?.next_actions) && revenueTruth.next_actions[0]?.action ? `Revenue next action: ${revenueTruth.next_actions[0].action}` : null,
  ].filter(Boolean) as string[];

  const fulfillmentFacts = [
    relationshipFulfillment.payment_status ? `Payment: ${relationshipFulfillment.payment_status}` : null,
    relationshipFulfillment.fulfillment_status ? `Fulfillment: ${relationshipFulfillment.fulfillment_status}` : null,
    relationshipFulfillment.proof_status ? `Proof: ${relationshipFulfillment.proof_status}` : null,
    relationshipFulfillment.completion_status ? `Completion: ${relationshipFulfillment.completion_status}` : null,
    relationshipFulfillment.completed_at ? `Completed at: ${dateText(relationshipFulfillment.completed_at)}` : null,
    relationshipFulfillment.risk_or_limitation ? `Risk: ${relationshipFulfillment.risk_or_limitation}` : null,
    relationshipFulfillment.remaining_limitations ? `Remaining limitations: ${relationshipFulfillment.remaining_limitations}` : null,
  ].filter(Boolean) as string[];

  const packetWorkspaceUrl = (() => {
    if (!livePacket?.packet_id) return null;
    const url = new URL("/fix-status", "https://staffordmedia.ai");
    url.searchParams.set("packet_id", livePacket.packet_id);
    if (livePacket.payment_reference) url.searchParams.set("session_id", livePacket.payment_reference);
    const store = normalizeStore(livePacket.store_domain || relationshipMerchant.store_domain || relationship.identity.store_domain);
    if (store) url.searchParams.set("store", store);
    if (livePacket.reservation_id) url.searchParams.set("reservation_id", livePacket.reservation_id);
    return `${url.pathname}?${url.searchParams.toString()}`;
  })();

  const outcomeFacts = [
    relationshipOutcome.new_state ? `Latest state: ${relationshipOutcome.new_state}` : null,
    relationshipOutcome.previous_state ? `Previous state: ${relationshipOutcome.previous_state}` : null,
    relationshipOutcome.trigger ? `Trigger: ${relationshipOutcome.trigger}` : null,
    relationshipOutcome.confidence !== null && relationshipOutcome.confidence !== undefined
      ? `Confidence: ${relationshipOutcome.confidence}`
      : null,
    executionLog.lastOutcomeEvent?.new_state ? `Last outcome event: ${executionLog.lastOutcomeEvent.new_state}` : null,
  ].filter(Boolean) as string[];

  const conflicts = formatList(relationship.relationship_core.conflict_notes, "None recorded");
  const conflictTypes = formatList(relationship.relationship_core.conflict_types, "None recorded");
  const provenanceReasons = relationship.provenance.source_match_reasons;

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS / Relationship 360</p>
            <h1 className="title">{relationship.display_name}</h1>
            <p className="subtitle">
              Read-only account view for the canonical relationship and its linked lead, client, merchant, fulfillment, execution, and outcome records.
            </p>

            <OperatorNav activeHref="/operator" />

            <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
              <span className="chip">Relationship: {relationship.relationship_type}</span>
              <span className="chip">Resolver state: {relationship.resolver_state}</span>
              <span className="chip">Health: {relationship.relationship_core.relationship_health}</span>
              <span className="chip">Risk: {relationship.relationship_core.risk_level}</span>
              <span className="chip">Priority: {relationship.relationship_core.priority_score}</span>
              <span className="chip">Confidence: {Math.round(relationship.relationship_core.confidence * 100)}%</span>
            </div>

            <div className="kv" style={{ marginTop: 16 }}>
              {sectionValue("Relationship ID", relationship.relationship_id)}
              {sectionValue("Contactability", relationship.relationship_core.contactability)}
              {sectionValue("Current stage", relationship.relationship_core.current_stage || "Unknown")}
              {sectionValue("Next action", relationship.relationship_core.next_action || "Unknown")}
              {sectionValue("Current stage source", relationship.relationship_core.current_stage_source || "Unknown")}
              {sectionValue("Next action source", relationship.relationship_core.next_action_source || "Unknown")}
              {sectionValue("Next touch", dateText(relationship.relationship_core.next_touch_at))}
              {sectionValue("Top action", summarizeAction(currentTopAction))}
              {sectionValue("Top blocker", summarizeAction(topBlocker))}
            </div>
          </div>
        </section>

        <section className="grid gridTwo">
          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Commercial</h2>
              <div className="kv">
                {commercialFacts.length ? commercialFacts.map((item) => <div key={item}>{item}</div>) : <div>No commercial facts available.</div>}
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Fulfillment</h2>
              <div className="kv">
                {fulfillmentFacts.length ? fulfillmentFacts.map((item) => <div key={item}>{item}</div>) : <div>No fulfillment facts available.</div>}
              </div>
            </div>
          </article>
        </section>

        <section className="grid gridTwo">
          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Outcome</h2>
              <div className="kv">
                <div><strong>Latest outcome:</strong> {relationshipOutcome.new_state || "Awaiting outcome review"}</div>
                {outcomeFacts.length ? outcomeFacts.map((item) => <div key={item}>{item}</div>) : <div>No outcome history available.</div>}
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Actions</h2>
              <div className="kv">
                <div><strong>Top action:</strong> {summarizeAction(decisionEngine.top_action)}</div>
                <div><strong>Top revenue action:</strong> {summarizeAction(decisionEngine.top_revenue_action)}</div>
                <div><strong>Top fulfillment action:</strong> {summarizeAction(decisionEngine.top_fulfillment_action)}</div>
                <div><strong>Top relationship action:</strong> {summarizeAction(decisionEngine.top_relationship_action)}</div>
                <div><strong>Top blocker:</strong> {summarizeAction(decisionEngine.top_blocker)}</div>
                <div><strong>Validation:</strong> {decisionEngine.validation.ok ? "Pass" : "Fail"}</div>
                <div><strong>Action candidates:</strong> {actionCandidates.length}</div>
              </div>
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">Merchant Workspace</p>
            <h2 className="sectionTitle" style={{ marginBottom: 10 }}>
              Live packet authority
            </h2>
            <div className="kv">
              <div><strong>Packet ID:</strong> {livePacket?.packet_id || "No live packet matched yet"}</div>
              <div><strong>Reservation ID:</strong> {livePacket?.reservation_id || "—"}</div>
              <div><strong>Store:</strong> {livePacket?.store_domain || relationshipMerchant.store_domain || relationship.identity.store_domain || "—"}</div>
              <div><strong>Packet status:</strong> {livePacket?.status || relationshipMerchant.payment_status || relationshipFulfillment.payment_status || "—"}</div>
              <div><strong>Payment reference:</strong> {livePacket?.payment_reference || "—"}</div>
              <div><strong>Continuity status:</strong> {livePacket?.status === "payment_received" ? "Paid packet ready" : "Waiting for packet"}</div>
              <div>
                <strong>Next action:</strong>{" "}
                {livePacket?.status === "payment_received"
                  ? "Open merchant workspace"
                  : text(relationshipMerchant.next_required_action || relationshipClient.next_action || relationshipLead.next_action || "Review the next customer relationship.")}
              </div>
            </div>
            <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
              {packetWorkspaceUrl ? <Link href={packetWorkspaceUrl} className="chip">Open Merchant Workspace</Link> : null}
              {livePacket?.packet_id ? <Link href={`/api/packets/${encodeURIComponent(livePacket.packet_id)}`} className="chip">Open Packet Authority</Link> : null}
            </div>
          </div>
        </section>

        <section className="grid gridTwo">
          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Execution History</h2>
              <div className="executionList">
                {relatedExecutions.length ? (
                  relatedExecutions.slice(0, 10).map((event: any) => (
                    <div key={event.execution_id || event.timestamp || `${event.action_type}-${event.customer}`} className="executionItem">
                      <strong>{event.action_type || "Unknown action"}</strong>
                      <p>{event.customer || "unknown customer"} · {event.product || "unknown product"}</p>
                      <small>{dateText(event.timestamp)}</small>
                      <p>{event.outcome || "unknown outcome"}</p>
                      <small>{event.revenue_impact || "unknown revenue impact"}</small>
                    </div>
                  ))
                ) : (
                  <p className="hint">No execution history linked to this relationship yet.</p>
                )}
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Outcome History</h2>
              <div className="executionList">
                {relatedOutcomeEvents.length ? (
                  relatedOutcomeEvents.slice(0, 10).map((event: any) => (
                    <div key={event.event_id || event.timestamp || `${event.previous_state}-${event.new_state}`} className="executionItem">
                      <strong>{event.new_state || "Outcome event"}</strong>
                      <p>{event.customer || "unknown customer"}</p>
                      <small>{dateText(event.timestamp)}</small>
                      <p>{event.previous_state ? `${event.previous_state} → ${event.new_state}` : event.trigger || "No transition recorded"}</p>
                      <small>{event.trigger || "unknown trigger"} · confidence {event.confidence ?? "—"}</small>
                    </div>
                  ))
                ) : (
                  <p className="hint">No outcome history linked to this relationship yet.</p>
                )}
              </div>
            </div>
          </article>
        </section>

        <section className="grid gridTwo">
          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Conflicts</h2>
              <div className="kv">
                <div><strong>Resolver state:</strong> {relationship.resolver_state}</div>
                <div><strong>Conflict types:</strong> {conflictTypes.join(" · ")}</div>
                <div><strong>Conflict notes:</strong> {conflicts.join(" · ")}</div>
                <div><strong>Unresolved action count:</strong> {decisionEngine.counts.unresolved_action_count}</div>
                <div><strong>Conflict action count:</strong> {decisionEngine.counts.conflict_action_count}</div>
                <div><strong>Suppressed actions:</strong> {decisionEngine.suppressed_action_ids.length}</div>
              </div>
              <div className="kv" style={{ marginTop: 12 }}>
                <div><strong>Lead-only:</strong> {relationship.resolver_state === "lead_only" ? "Yes" : "No"}</div>
                <div><strong>Contact unknown:</strong> {relationship.resolver_state === "contact_unknown" ? "Yes" : "No"}</div>
                <div><strong>Operational conflict:</strong> {relationship.resolver_state === "operational_conflict" ? "Yes" : "No"}</div>
                <div><strong>Unresolved identity:</strong> {relationship.resolver_state === "unresolved_identity" ? "Yes" : "No"}</div>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Provenance</h2>
              <div className="kv">
                <div><strong>Primary source:</strong> {relationship.provenance.primary_source}</div>
                <div><strong>Secondary sources:</strong> {formatList(relationship.provenance.secondary_sources, "None").join(" · ")}</div>
                <div><strong>Match reasons - lead:</strong> {formatList(provenanceReasons.lead, "None").join(" · ")}</div>
                <div><strong>Match reasons - client:</strong> {formatList(provenanceReasons.client, "None").join(" · ")}</div>
                <div><strong>Match reasons - merchant:</strong> {formatList(provenanceReasons.merchant, "None").join(" · ")}</div>
                <div><strong>Match reasons - fulfillment:</strong> {formatList(provenanceReasons.fulfillment, "None").join(" · ")}</div>
                <div><strong>Match reasons - execution:</strong> {formatList(provenanceReasons.execution, "None").join(" · ")}</div>
                <div><strong>Match reasons - outcome:</strong> {formatList(provenanceReasons.outcome, "None").join(" · ")}</div>
              </div>
              <div className="kv" style={{ marginTop: 12 }}>
                <div><strong>Lead links:</strong> {formatList(relationship.links.lead_registry_ids, "None").join(" · ")}</div>
                <div><strong>Client links:</strong> {formatList(relationship.links.client_registry_ids, "None").join(" · ")}</div>
                <div><strong>Merchant links:</strong> {formatList(relationship.links.merchant_lifecycle_ids, "None").join(" · ")}</div>
                <div><strong>Fulfillment links:</strong> {formatList(relationship.links.fulfillment_ids, "None").join(" · ")}</div>
                <div><strong>Execution links:</strong> {formatList(relationship.links.execution_ids, "None").join(" · ")}</div>
                <div><strong>Outcome links:</strong> {formatList(relationship.links.outcome_event_ids, "None").join(" · ")}</div>
              </div>
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Raw relationship facets</h2>
            <div className="grid gridTwo">
              <div className="kv">
                <div><strong>Lead ID:</strong> {relationshipLead.lead_id || "—"}</div>
                <div><strong>Lead name:</strong> {relationshipLead.name || "—"}</div>
                <div><strong>Lead domain:</strong> {relationshipLead.domain || "—"}</div>
                <div><strong>Lead email:</strong> {relationshipLead.email || "—"}</div>
                <div><strong>Lead stage:</strong> {relationshipLead.current_stage || "—"}</div>
                <div><strong>Lead next action:</strong> {relationshipLead.next_action || "—"}</div>
              </div>
              <div className="kv">
                <div><strong>Client ID:</strong> {relationshipClient.client_id || "—"}</div>
                <div><strong>Client payment:</strong> {relationshipClient.payment_status || "—"}</div>
                <div><strong>Merchant shop:</strong> {relationshipMerchant.merchant_shop || "—"}</div>
                <div><strong>Merchant payment:</strong> {relationshipMerchant.payment_status || "—"}</div>
                <div><strong>Fulfillment ID:</strong> {relationshipFulfillment.fulfillment_id || "—"}</div>
                <div><strong>Fulfillment status:</strong> {relationshipFulfillment.fulfillment_status || "—"}</div>
              </div>
            </div>
          </div>
        </section>

        {decisionContext.length ? (
          <section className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Decision Engine context</h2>
              <div className="executionList">
                {decisionContext.map((action: any) => (
                  <div key={action.action_id} className="executionItem">
                    <strong>{action.action_type}</strong>
                    <p>{action.title || action.why_it_matters}</p>
                    <small>{action.relationship_id} · {action.status}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="panel">
          <div className="panelInner">
            <p className="hint">
              Linked views: Executive Home, Revenue Queue, Execution Log, and Decision Engine all point back to this canonical relationship ID.
            </p>
            <div className="row" style={{ flexWrap: "wrap" }}>
              <Link href="/operator" className="chip">Back to Executive Home</Link>
              <Link href="/operator/revenue-command" className="chip">Revenue Queue</Link>
              <Link href="/operator/execution-log" className="chip">Execution Log</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
