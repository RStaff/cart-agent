import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type ExecutionLogEvent = {
  execution_id?: string;
  timestamp?: string;
  operator?: string;
  action_type?: string;
  customer?: string;
  product?: string;
  stage?: string;
  outcome?: string;
  revenue_impact?: string;
  notes?: string;
};

type OutcomeEvent = {
  event_id?: string;
  timestamp?: string;
  customer?: string;
  previous_state?: string;
  new_state?: string;
  trigger?: string;
  confidence?: number;
};

function resolveRepoRoot() {
  const cwd = process.cwd();
  const candidates = [cwd, path.resolve(cwd, "../../..")];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "staffordos/execution/execution_log_v1.json"))) return candidate;
    if (existsSync(path.join(candidate, "staffordos/events/operator_action_events_v1.json"))) return candidate;
  }

  return path.resolve(cwd, "../../..");
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function text(value: unknown, fallback = "—") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function sameDay(value: string | undefined, reference = new Date()) {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toDateString() === reference.toDateString();
}

function normalizeExecutionRecord(record: any): ExecutionLogEvent {
  if (record?.execution_id) {
    return {
      execution_id: text(record.execution_id, "unknown"),
      timestamp: text(record.timestamp, ""),
      operator: text(record.operator, "ross"),
      action_type: text(record.action_type, "unknown"),
      customer: text(record.customer, "unknown"),
      product: text(record.product, "unknown"),
      stage: text(record.stage, "unknown"),
      outcome: text(record.outcome, "unknown"),
      revenue_impact: text(record.revenue_impact, "unknown"),
      notes: text(record.notes, "No notes recorded."),
    };
  }

  const actionLabel = text(record?.action_label).toLowerCase();
  const legacyActionType =
    actionLabel.includes("follow up") ? "follow_up_sent" :
    actionLabel.includes("offer") && actionLabel.includes("send") ? "offer_sent" :
    text(record?.action_type, "unknown");

  return {
    execution_id: text(record?.event_id || record?.execution_id || `execution_${Date.now()}`),
    timestamp: text(record?.created_at || record?.timestamp, ""),
    operator: text(record?.owner, "ross"),
    action_type: legacyActionType,
    customer: text(record?.customer || record?.domain_id || record?.product_id, "unknown"),
    product: text(record?.product_id || record?.domain_id, "unknown"),
    stage: text(record?.status || record?.next_step || record?.action_type, "unknown"),
    outcome: text(record?.result?.note || record?.status || "unknown", "unknown"),
    revenue_impact: text(
      actionLabel.includes("follow up")
        ? "$950 pending"
        : actionLabel.includes("offer")
          ? "$950 offer open"
          : "unknown"
    ),
    notes: text(record?.result?.note || record?.next_step || record?.status, "No notes recorded."),
  };
}

function normalizeOutcomeRecord(record: any): OutcomeEvent {
  if (record?.event_id && record?.previous_state && record?.new_state) {
    return {
      event_id: text(record.event_id, "unknown"),
      timestamp: text(record.timestamp, ""),
      customer: text(record.customer, "unknown"),
      previous_state: text(record.previous_state, "unknown"),
      new_state: text(record.new_state, "unknown"),
      trigger: text(record.trigger, "unknown"),
      confidence: Number.isFinite(Number(record.confidence)) ? Number(record.confidence) : 0,
    };
  }

  return {
    event_id: text(record?.event_id || record?.execution_id || `outcome_${Date.now()}`),
    timestamp: text(record?.created_at || record?.timestamp, ""),
    customer: text(record?.customer || record?.domain_id || record?.product_id, "unknown"),
    previous_state: text(record?.previous_state || "unknown"),
    new_state: text(record?.new_state || record?.status || "unknown"),
    trigger: text(record?.event_type || record?.action_type || "unknown"),
    confidence: Number.isFinite(Number(record?.confidence)) ? Number(record.confidence) : 0,
  };
}

function sortByTimestampDesc<T extends { timestamp?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.timestamp || 0).getTime();
    const bTime = new Date(b.timestamp || 0).getTime();
    return bTime - aTime;
  });
}

export function loadExecutionLog() {
  const repoRoot = resolveRepoRoot();

  const executionTruth = readJson<any>(
    path.join(repoRoot, "staffordos/execution/execution_log_v1.json"),
    { schema: "staffordos.execution_log.v1", generated_at: "", events: [] }
  );
  const outcomeTruth = readJson<any>(
    path.join(repoRoot, "staffordos/execution/outcome_events_v1.json"),
    { schema: "staffordos.outcome_events.v1", generated_at: "", events: [] }
  );

  const legacyOperatorActions = readJson<any>(
    path.join(repoRoot, "staffordos/events/operator_action_events_v1.json"),
    { schema: "staffordos.operator_action_events.v1", events: [] }
  );
  const legacyOutcomeLog = readJson<any>(
    path.join(repoRoot, "staffordos/events/outcome_event_log_v1.json"),
    { schema: "staffordos.outcome_event_log.v1", events: [] }
  );

  const executionEvents = sortByTimestampDesc(
    (Array.isArray(executionTruth.events) && executionTruth.events.length ? executionTruth.events : legacyOperatorActions.events || []).map(
      normalizeExecutionRecord
    ) as ExecutionLogEvent[]
  );
  const outcomeEvents = sortByTimestampDesc(
    (Array.isArray(outcomeTruth.events) && outcomeTruth.events.length ? outcomeTruth.events : legacyOutcomeLog.events || []).map(
      normalizeOutcomeRecord
    ) as OutcomeEvent[]
  );

  const lastExecution = executionEvents[0] || null;
  const lastOutcomeEvent = outcomeEvents[0] || null;
  const outcomeStateChangesToday = outcomeEvents.filter((event) => sameDay(event.timestamp)).length;

  const operatorActions = {
    schema: executionTruth.schema || "staffordos.execution_log.v1",
    generated_at: executionTruth.generated_at || "",
    events: executionEvents.map((event: ExecutionLogEvent) => ({
      event_id: event.execution_id,
      action_label: event.action_type,
      action_type: event.action_type,
      status: event.outcome,
      execution_mode: event.outcome,
      created_at: event.timestamp,
      next_step: event.notes,
      owner: event.operator,
      customer: event.customer,
      product: event.product,
      stage: event.stage,
      revenue_impact: event.revenue_impact,
    })),
  };

  const outcomeLog = {
    schema: outcomeTruth.schema || "staffordos.outcome_events.v1",
    generated_at: outcomeTruth.generated_at || "",
    events: outcomeEvents.map((event: OutcomeEvent) => ({
      event_id: event.event_id,
      event_type: event.trigger,
      action_label: `${event.previous_state} -> ${event.new_state}`,
      next_step: event.trigger,
      created_at: event.timestamp,
      customer: event.customer,
      previous_state: event.previous_state,
      new_state: event.new_state,
      confidence: event.confidence,
    })),
  };

  const agentPerformance = readJson(path.join(repoRoot, "staffordos/agents/agent_performance_v1.json"), {
    summary: {},
    agents: [],
  });
  const ruleSuggestions = readJson(path.join(repoRoot, "staffordos/rules/rule_suggestions_v1.json"), {
    suggestions: [],
  });
  const loopDReport = readJson(path.join(repoRoot, "staffordos/loop_d/output/loop_d_feedback_report_v1.json"), {});

  const rawOutcomeScores = readJson<any>(path.join(repoRoot, "staffordos/events/outcome_scores_v1.json"), []);
  const outcomeScores = Array.isArray(rawOutcomeScores)
    ? rawOutcomeScores
    : Array.isArray(rawOutcomeScores?.scores)
      ? rawOutcomeScores.scores
      : rawOutcomeScores
        ? [rawOutcomeScores]
        : [];

  return {
    executionTruth,
    outcomeTruth,
    operatorActions,
    outcomeLog,
    executionEvents,
    outcomeEvents,
    lastExecution,
    lastOutcomeEvent,
    outcomeStateChangesToday,
    executionSummary: {
      lastExecution,
      lastOutcomeEvent,
      outcomeStateChangesToday,
      didCreateRevenue: lastExecution ? lastExecution.revenue_impact : "Unknown",
      didImproveCustomerRelationship: lastOutcomeEvent
        ? `Moved the customer to ${lastOutcomeEvent.new_state}`
        : "Unknown",
      shouldRecommendAgain:
        lastOutcomeEvent?.new_state === "At Risk"
          ? "No"
          : lastExecution
            ? `Yes — use ${lastExecution.action_type} again when the same situation appears`
            : "Unknown",
    },
    outcomeScores,
    agentPerformance,
    ruleSuggestions,
    loopDReport,
  };
}
