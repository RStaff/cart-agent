import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";


function appendJsonEvent(path, event) {
  let existing = [];
  if (existsSync(path)) {
    try {
      const raw = JSON.parse(readFileSync(path, "utf8"));
      existing = Array.isArray(raw) ? raw : [raw];
    } catch {
      existing = [];
    }
  }
  existing.push(event);
  writeFileSync(path, JSON.stringify(existing, null, 2) + "\n");
}

const now = new Date().toISOString();

mkdirSync("staffordos/events", { recursive: true });
mkdirSync("staffordos/agents", { recursive: true });
mkdirSync("staffordos/rules", { recursive: true });
mkdirSync("staffordos/loop_d/output", { recursive: true });

function readJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

const primary = readJson("staffordos/snapshots/primary_action_snapshot_v1.json", {});
const qa = readJson("staffordos/qa/output/command_center_primary_action_qa_v1.json", {});
const preflight = readJson("staffordos/preflight/output/preflight_report_v1.json", {});
const inventory = readJson("staffordos/system_inventory/output/agent_inventory_v1.json", { agents: [] });
const validatorMap = readJson("staffordos/qa/validator_map_v1.json", { validators: [] });

const action = primary.primary_action || {};
const qaPass = String(qa.verdict || "").toLowerCase() === "pass";
const preflightGo = String(preflight.status || "").toUpperCase() === "GO";
const confidence = typeof action.confidence === "number" ? action.confidence : 0;
const priority = typeof action.priority_score === "number" ? action.priority_score : 0;

const outcomeScore = Math.round(
  (qaPass ? 30 : 0) +
  (preflightGo ? 25 : 0) +
  Math.min(25, confidence * 25) +
  Math.min(20, priority / 5)
);

const outcomeScores = {
  schema: "staffordos.outcome_scores.v1",
  generated_at: now,
  scores: [
    {
      outcome_id: `outcome_${Date.now()}`,
      source_action_id: action.action_id || "unknown",
      action_label: action.action_label || "unknown",
      score: outcomeScore,
      status: outcomeScore >= 80 ? "strong" : outcomeScore >= 60 ? "acceptable" : "needs_review",
      dimensions: {
        qa_passed: qaPass,
        preflight_go: preflightGo,
        confidence,
        priority
      },
      notes: [
        qaPass ? "QA gate passed." : "QA gate did not pass.",
        preflightGo ? "Preflight gate passed." : "Preflight gate blocked or missing.",
        `Confidence recorded at ${Math.round(confidence * 100)}%.`,
        `Priority recorded at ${priority}.`
      ]
    }
  ]
};

const agentPaths = Array.isArray(inventory.agents) ? inventory.agents.map(a => a.path || "") : [];
const validators = Array.isArray(validatorMap.validators) ? validatorMap.validators : [];

const importantAgents = [
  "staffordos/decision/resolve_primary_action_v1.mjs",
  "staffordos/preflight/run_preflight_check_v1.mjs",
  "staffordos/system_inventory/build_agent_inventory_v1.mjs",
  "staffordos/qa/build_validator_map_v1.mjs",
  "staffordos/qa/validate_command_center_primary_action_v1.mjs"
];

const agentPerformance = {
  schema: "staffordos.agent_performance.v1",
  generated_at: now,
  summary: {
    total_agents_detected: agentPaths.length,
    validators_detected: validators.length,
    active_agents_in_this_loop: importantAgents.length,
    utilization_percent_this_loop: agentPaths.length
      ? Math.round((importantAgents.filter(p => agentPaths.includes(p) || existsSync(p)).length / agentPaths.length) * 100)
      : 0
  },
  agents: importantAgents.map((path) => ({
    agent_id: path.replace(/\//g, "_"),
    path,
    role:
      path.includes("resolve_primary_action") ? "decision_resolver" :
      path.includes("preflight") ? "execution_gate" :
      path.includes("inventory") ? "resource_inventory" :
      path.includes("validator_map") ? "validator_router" :
      path.includes("validate_command_center") ? "qa_validator" :
      "support",
    used_in_current_loop: true,
    output_quality:
      qaPass && preflightGo ? "effective" :
      preflightGo ? "partial" :
      "blocked",
    contribution_score:
      path.includes("resolve_primary_action") ? 30 :
      path.includes("preflight") ? 25 :
      path.includes("validate_command_center") ? 25 :
      10
  })),
  note: "Utilization should not target 100% of all agents. It should target 100% of required agents for the active task."
};

const ruleSuggestions = {
  schema: "staffordos.rule_suggestions.v1",
  generated_at: now,
  suggestions: [
    {
      rule_id: "rs_001",
      severity: "high",
      suggestion: "Before UI work, require primary_action_snapshot_v1.json to exist and pass QA.",
      reason: "Command Center UX degraded when UI was built before the decision layer was resolved.",
      status: qaPass ? "satisfied_currently" : "recommended"
    },
    {
      rule_id: "rs_002",
      severity: "medium",
      suggestion: "Keep full diagnostic context collapsed by default on Operator Home.",
      reason: "Operator UX should show only one action first; evidence and internals should be available but secondary.",
      status: "active_design_rule"
    },
    {
      rule_id: "rs_003",
      severity: "medium",
      suggestion: "Track required-agent utilization per task, not total-agent utilization.",
      reason: "Using all agents all the time would create noise and slow execution.",
      status: "active_operating_rule"
    }
  ]
};

writeFileSync("staffordos/events/outcome_scores_v1.json", JSON.stringify(outcomeScores, null, 2) + "\n");
writeFileSync("staffordos/agents/agent_performance_v1.json", JSON.stringify(agentPerformance, null, 2) + "\n");
writeFileSync("staffordos/rules/rule_suggestions_v1.json", JSON.stringify(ruleSuggestions, null, 2) + "\n");

const report = {
  schema: "staffordos.loop_d_feedback_report.v1",
  generated_at: now,
  outcome_score: outcomeScore,
  agent_utilization_percent_this_loop: agentPerformance.summary.utilization_percent_this_loop,
  qa_verdict: qa.verdict || "unknown",
  preflight_status: preflight.status || "unknown",
  outputs: [
    "staffordos/events/outcome_scores_v1.json",
    "staffordos/agents/agent_performance_v1.json",
    "staffordos/rules/rule_suggestions_v1.json"
  ]
};

writeFileSync("staffordos/loop_d/output/loop_d_feedback_report_v1.json", JSON.stringify(report, null, 2) + "\n");

console.log(JSON.stringify(report, null, 2));
