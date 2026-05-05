import fs from "node:fs";
import path from "node:path";

function readJson(relativePath: string, fallback: any) {
  const repoRoot = path.join(process.cwd(), "..", "..", "..", "..");
const filePath = path.join(repoRoot, "staffordos", relativePath);

  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export function loadExecutionLog() {
  const operatorActions = readJson("events/operator_action_events_v1.json", {
    schema: "staffordos.operator_action_events.v1",
    events: []
  });

  const outcomeLog = readJson("events/outcome_event_log_v1.json", {
    schema: "staffordos.outcome_event_log.v1",
    events: []
  });

  const outcomeScores = readJson("events/outcome_scores_v1.json", []);
  const agentPerformance = readJson("agents/agent_performance_v1.json", {
    summary: {},
    agents: []
  });

  const ruleSuggestions = readJson("rules/rule_suggestions_v1.json", {
    suggestions: []
  });

  const loopDReport = readJson("loop_d/output/loop_d_feedback_report_v1.json", {});

  return {
    operatorActions,
    outcomeLog,
    outcomeScores: Array.isArray(outcomeScores) ? outcomeScores : [outcomeScores],
    agentPerformance,
    ruleSuggestions,
    loopDReport
  };
}
