import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getLatestSystemSnapshot } from "../system_state/index.js";
import { getNextGeneratedExecutionPacket, getNextExecutionPacket } from "../execution_packets/index.js";
import { listPacketExecutions } from "../packet_executor/index.js";
import { listFeedback } from "../feedback_registry/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");
export const max_active_opportunities = 5;

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(decisions) {
  await writeFile(REGISTRY_PATH, JSON.stringify(decisions, null, 2) + "\n", "utf8");
}

function buildDecisionId(snapshotId) {
  return `operator_decision__${snapshotId || Date.now()}`;
}

function decisionShape(snapshot, details) {
  return {
    id: buildDecisionId(snapshot?.id),
    generated_at: new Date().toISOString(),
    system_snapshot_id: snapshot?.id || null,
    current_system_health: snapshot?.system_health || "blocked",
    detected_blocker: details.detected_blocker,
    recommended_next_action: details.recommended_next_action,
    action_type: details.action_type,
    target_module: details.target_module,
    reasoning_summary: details.reasoning_summary,
    confidence: details.confidence,
    status: "proposed",
  };
}

export async function evaluateSystemState(snapshot) {
  if (!snapshot) {
    return {
      detected_blocker: "No system snapshot exists yet.",
      recommended_next_action: "Generate a fresh system snapshot before making any further operator decisions.",
      action_type: "generate_snapshot",
      target_module: "system_state",
      reasoning_summary: "Operator Brain cannot reason safely without a current system snapshot.",
      confidence: "high",
    };
  }

  if (snapshot.system_health === "blocked") {
    return {
      detected_blocker: snapshot.recommended_next_action || "System health is blocked.",
      recommended_next_action: "Investigate the blocking condition in the current pipeline before advancing new work.",
      action_type: "investigate",
      target_module: "system_state",
      reasoning_summary: "The latest system snapshot is blocked, so the next best operator action is investigation rather than advancing more work.",
      confidence: "high",
    };
  }

  if (snapshot.candidate_opportunities_count > max_active_opportunities) {
    return {
      detected_blocker: `Active candidate opportunities exceed the v1 threshold of ${max_active_opportunities}.`,
      recommended_next_action: "Pause new opportunity promotion and work down the current opportunity set before generating more.",
      action_type: "wait",
      target_module: "candidate_opportunities",
      reasoning_summary: "Operator Brain is holding opportunity promotion because the active opportunity count is already above the configured threshold.",
      confidence: "high",
    };
  }

  if (snapshot.candidate_opportunities_count === 0 && snapshot.signals_count > 0) {
    return {
      detected_blocker: null,
      recommended_next_action: "Generate candidate opportunities from the current merchant signals.",
      action_type: "generate_candidate_opportunities",
      target_module: "candidate_opportunities",
      reasoning_summary: "Signals exist but no candidate opportunities have been generated yet, so the bridge should run next.",
      confidence: "high",
    };
  }

  if (snapshot.slices_count === 0 && snapshot.candidate_opportunities_count > 0) {
    return {
      detected_blocker: null,
      recommended_next_action: "Generate the smallest shippable slices from the current candidate opportunities.",
      action_type: "generate_slices",
      target_module: "slices",
      reasoning_summary: "Candidate opportunities exist but no slices have been prepared for execution yet.",
      confidence: "high",
    };
  }

  if (snapshot.build_queue_count === 0 && snapshot.slices_count > 0) {
    return {
      detected_blocker: null,
      recommended_next_action: "Run the build queue so one slice is selected as the next buildable unit of work.",
      action_type: "run_build_queue",
      target_module: "build_queue",
      reasoning_summary: "Slices exist but the build queue has not selected the next deterministic slice.",
      confidence: "high",
    };
  }

  const [nextGeneratedPacket, latestPacket, packetExecutions, feedback] = await Promise.all([
    getNextGeneratedExecutionPacket(),
    getNextExecutionPacket(),
    listPacketExecutions(),
    listFeedback(),
  ]);

  if (!latestPacket && snapshot.build_queue_head) {
    return {
      detected_blocker: null,
      recommended_next_action: "Generate an execution packet for the current build-queue head.",
      action_type: "generate_execution_packet",
      target_module: "execution_packets",
      reasoning_summary: "A queue head exists but no execution packet has been generated yet.",
      confidence: "high",
    };
  }

  if (nextGeneratedPacket) {
    return {
      detected_blocker: null,
      recommended_next_action: "Submit the next generated execution packet to the packet executor.",
      action_type: "submit_packet_execution",
      target_module: "packet_executor",
      reasoning_summary: "A generated execution packet is waiting and has not been submitted yet.",
      confidence: "high",
    };
  }

  if (latestPacket) {
    const matchingExecution = packetExecutions.find(
      (execution) => execution.execution_packet_id === latestPacket.id,
    );
    if (!matchingExecution) {
      return {
        detected_blocker: null,
        recommended_next_action: "Submit the latest execution packet so implementation can begin.",
        action_type: "submit_packet_execution",
        target_module: "packet_executor",
        reasoning_summary: "The latest packet exists but no execution record was found for it.",
        confidence: "medium",
      };
    }

    const matchingFeedback = feedback.find(
      (record) => record.execution_packet_id === latestPacket.id,
    );
    if (!matchingFeedback) {
      return {
        detected_blocker: null,
        recommended_next_action: "Record feedback for the latest packet execution so the system can learn from the result.",
        action_type: "record_feedback",
        target_module: "feedback_registry",
        reasoning_summary: "An execution record exists for the latest packet, but no feedback has been captured yet.",
        confidence: "medium",
      };
    }
  }

  return {
    detected_blocker: null,
    recommended_next_action: "Wait for new implementation progress or updated feedback before advancing another action.",
    action_type: "wait",
    target_module: "operator_brain",
    reasoning_summary: "The current pipeline already has a selected slice, an execution path, and recorded feedback, so the next best action is to wait for the next meaningful state change.",
    confidence: snapshot.system_health === "healthy" ? "high" : "medium",
  };
}

export async function generateOperatorDecision(snapshot) {
  const details = await evaluateSystemState(snapshot);
  const decision = decisionShape(snapshot, details);
  const decisions = await readRegistry();
  decisions.push(decision);
  await writeRegistry(decisions);
  return decision;
}

export async function listOperatorDecisions() {
  const decisions = await readRegistry();
  return decisions.sort((a, b) => {
    const timeA = Date.parse(a.generated_at || "") || 0;
    const timeB = Date.parse(b.generated_at || "") || 0;
    return timeB - timeA;
  });
}

export async function getLatestOperatorDecision() {
  const decisions = await listOperatorDecisions();
  return decisions[0] || null;
}

export async function runOperatorBrain() {
  const snapshot = await getLatestSystemSnapshot();
  const decision = await generateOperatorDecision(snapshot);
  return {
    decision,
    recommended_next_action: decision.recommended_next_action,
    reasoning_summary: decision.reasoning_summary,
  };
}
