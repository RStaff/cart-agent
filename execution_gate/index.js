import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getLatestSystemSnapshot } from "../system_state/index.js";
import { getLatestOperatorDecision } from "../operator_brain/index.js";
import { max_active_opportunities } from "../operator_brain/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(decisions) {
  await writeFile(REGISTRY_PATH, JSON.stringify(decisions, null, 2) + "\n", "utf8");
}

function buildGateDecisionId(operatorDecisionId) {
  return `execution_gate__${operatorDecisionId || Date.now()}`;
}

function buildDecision(operatorDecision, evaluation) {
  return {
    id: buildGateDecisionId(operatorDecision?.id),
    operator_decision_id: operatorDecision?.id || null,
    action_type: evaluation.action_type,
    target_module: evaluation.target_module,
    allowed: evaluation.allowed,
    reason: evaluation.reason,
    requires_approval: evaluation.requires_approval,
    risk_level: evaluation.risk_level,
    execution_mode: evaluation.execution_mode,
    created_at: new Date().toISOString(),
  };
}

function allowDecision(decision, overrides = {}) {
  return {
    action_type: decision?.action_type || "wait",
    target_module: decision?.target_module || "execution_gate",
    allowed: true,
    reason: overrides.reason || "This action is safe to proceed under the current v1 execution gate policy.",
    requires_approval: false,
    risk_level: overrides.risk_level || "low",
    execution_mode: overrides.execution_mode || "auto",
  };
}

function blockDecision(decision, overrides = {}) {
  return {
    action_type: decision?.action_type || "wait",
    target_module: decision?.target_module || "execution_gate",
    allowed: false,
    reason: overrides.reason || "This action is blocked by the current v1 execution gate policy.",
    requires_approval: overrides.requires_approval ?? false,
    risk_level: overrides.risk_level || "medium",
    execution_mode: overrides.execution_mode || "gated",
  };
}

export function evaluateOperatorDecision(operatorDecision, systemSnapshot) {
  if (!operatorDecision) {
    return blockDecision(
      { action_type: "generate_snapshot", target_module: "system_state" },
      {
        reason: "No operator decision exists yet, so there is nothing for the execution gate to approve.",
        risk_level: "low",
        execution_mode: "manual_only",
      },
    );
  }

  const actionType = operatorDecision.action_type;

  if (
    actionType === "generate_candidate_opportunities" &&
    Number(systemSnapshot?.candidate_opportunities_count || 0) >= max_active_opportunities
  ) {
    return blockDecision(operatorDecision, {
      reason: `Active candidate opportunities already meet or exceed the v1 limit of ${max_active_opportunities}, so new opportunity promotion is blocked.`,
      risk_level: "medium",
      execution_mode: "gated",
    });
  }

  switch (actionType) {
    case "generate_snapshot":
      return allowDecision(operatorDecision, {
        reason: "Generating a system snapshot is always allowed because it is a read-model refresh.",
        risk_level: "low",
        execution_mode: "auto",
      });
    case "generate_candidate_opportunities":
      if (Number(systemSnapshot?.signals_count || 0) <= 0) {
        return blockDecision(operatorDecision, {
          reason: "Candidate opportunity generation is blocked because there are no signals available.",
          risk_level: "low",
          execution_mode: "gated",
        });
      }
      return allowDecision(operatorDecision, {
        reason: "Signals exist, so candidate opportunity generation is allowed.",
        risk_level: "low",
        execution_mode: "auto",
      });
    case "generate_slices":
      if (Number(systemSnapshot?.candidate_opportunities_count || 0) <= 0) {
        return blockDecision(operatorDecision, {
          reason: "Slice generation is blocked because no candidate opportunities exist.",
          risk_level: "low",
          execution_mode: "gated",
        });
      }
      return allowDecision(operatorDecision, {
        reason: "Candidate opportunities exist, so slice generation is allowed.",
        risk_level: "low",
        execution_mode: "auto",
      });
    case "run_build_queue":
      if (Number(systemSnapshot?.slices_count || 0) <= 0) {
        return blockDecision(operatorDecision, {
          reason: "Build queue execution is blocked because no slices exist.",
          risk_level: "low",
          execution_mode: "gated",
        });
      }
      return allowDecision(operatorDecision, {
        reason: "Slices exist, so build queue evaluation is allowed.",
        risk_level: "low",
        execution_mode: "auto",
      });
    case "generate_execution_packet":
      if (!systemSnapshot?.build_queue_head) {
        return blockDecision(operatorDecision, {
          reason: "Execution packet generation is blocked because no build queue head exists.",
          risk_level: "medium",
          execution_mode: "gated",
        });
      }
      return allowDecision(operatorDecision, {
        reason: "A build queue head exists, so execution packet generation is allowed.",
        risk_level: "medium",
        execution_mode: "auto",
      });
    case "submit_packet_execution":
      return blockDecision(operatorDecision, {
        reason: "Packet submission is gated in v1 and requires explicit approval before execution is allowed.",
        requires_approval: true,
        risk_level: "high",
        execution_mode: "gated",
      });
    case "record_feedback":
      return allowDecision(operatorDecision, {
        reason: "Feedback recording is safe and helps the system learn from execution outcomes.",
        risk_level: "low",
        execution_mode: "manual_only",
      });
    case "investigate":
      return allowDecision(operatorDecision, {
        reason: "Investigation is allowed because it is the correct response to blocked system health.",
        risk_level: "medium",
        execution_mode: "manual_only",
      });
    case "wait":
      return allowDecision(operatorDecision, {
        reason: "Waiting is allowed because the current state does not require a new automated action.",
        risk_level: "low",
        execution_mode: "auto",
      });
    default:
      return blockDecision(operatorDecision, {
        reason: `Unknown operator action type "${actionType}" is not allowed by the v1 execution gate policy.`,
        risk_level: "medium",
        execution_mode: "manual_only",
      });
  }
}

export async function listExecutionGateDecisions() {
  const decisions = await readRegistry();
  return decisions.sort((a, b) => {
    const timeA = Date.parse(a.created_at || "") || 0;
    const timeB = Date.parse(b.created_at || "") || 0;
    return timeB - timeA;
  });
}

export async function getLatestExecutionGateDecision() {
  const decisions = await listExecutionGateDecisions();
  return decisions[0] || null;
}

export async function runExecutionGate() {
  const [systemSnapshot, operatorDecision] = await Promise.all([
    getLatestSystemSnapshot(),
    getLatestOperatorDecision(),
  ]);

  const evaluation = evaluateOperatorDecision(operatorDecision, systemSnapshot);
  const gateDecision = buildDecision(operatorDecision, evaluation);
  const decisions = await readRegistry();
  decisions.push(gateDecision);
  await writeRegistry(decisions);

  return {
    execution_gate_decision: gateDecision,
    allowed: gateDecision.allowed,
    reason: gateDecision.reason,
    requires_approval: gateDecision.requires_approval,
    risk_level: gateDecision.risk_level,
    execution_mode: gateDecision.execution_mode,
  };
}
