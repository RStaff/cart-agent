import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getNextGeneratedExecutionPacket,
  persistExecutionPackets,
  listExecutionPackets,
} from "../execution_packets/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXECUTIONS_PATH = join(__dirname, "executions.json");

async function readExecutions() {
  const raw = await readFile(EXECUTIONS_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeExecutions(executions) {
  await writeFile(EXECUTIONS_PATH, JSON.stringify(executions, null, 2) + "\n", "utf8");
}

export async function listPacketExecutions() {
  const executions = await readExecutions();
  return executions.sort((a, b) => {
    const timeA = Date.parse(a.started_at || "") || 0;
    const timeB = Date.parse(b.started_at || "") || 0;
    return timeB - timeA;
  });
}

export async function getNextPacket() {
  return getNextGeneratedExecutionPacket();
}

export function generateCodexPrompt(packet) {
  const targetFiles = (packet.target_files || []).map((file) => `- ${file}`).join("\n");
  const endpoints = (packet.proposed_endpoints || []).map((endpoint) => `- ${endpoint}`).join("\n") || "- none";
  const contracts = (packet.data_contracts || [])
    .map((contract) => `- ${contract.contract}: ${contract.fields.join(", ")}`)
    .join("\n") || "- none";
  const acceptance = (packet.acceptance_criteria || []).map((item) => `- ${item}`).join("\n");
  const verification = (packet.verification_steps || []).map((item) => `- ${item}`).join("\n");
  const risks = (packet.risk_notes || []).map((item) => `- ${item}`).join("\n") || "- none";
  const dependencies = (packet.dependencies || []).map((item) => `- ${item}`).join("\n") || "- none";

  return [
    `Execution packet: ${packet.id}`,
    `Slice: ${packet.slice_id}`,
    "",
    "Objective:",
    packet.objective,
    "",
    "Implementation summary:",
    packet.implementation_summary,
    "",
    "Target files:",
    targetFiles || "- none",
    "",
    "Proposed endpoints:",
    endpoints,
    "",
    "Data contracts:",
    contracts,
    "",
    "Acceptance criteria:",
    acceptance,
    "",
    "Verification steps:",
    verification,
    "",
    "Dependencies:",
    dependencies,
    "",
    "Risk notes:",
    risks,
  ].join("\n");
}

async function markPacketSubmitted(packetId) {
  const packets = await listExecutionPackets();
  const updated = packets.map((packet) => {
    if (packet.id !== packetId) return packet;
    return {
      ...packet,
      status: "in_progress",
      recommended_next_action: "Track implementation progress against this submitted packet.",
      reasoning_summary: `Packet ${packet.id} has been submitted to the executor and is now ready for Codex implementation.`,
    };
  });
  await persistExecutionPackets(updated);
}

export async function submitPacketExecution() {
  const packet = await getNextPacket();
  if (!packet) {
    return {
      execution: null,
      recommended_next_action: "Generate an execution packet before running the packet executor.",
      reasoning_summary: "No execution packet with status generated is currently available.",
    };
  }

  const codexPrompt = generateCodexPrompt(packet);
  const execution = {
    id: `execution__${packet.id}`,
    execution_packet_id: packet.id,
    codex_prompt: codexPrompt,
    status: "submitted",
    started_at: new Date().toISOString(),
    completed_at: null,
    result_summary: null,
    reasoning_summary: `Execution record created from packet ${packet.id}.`,
    recommended_next_action: "Pass this Codex prompt into the next implementation step.",
  };

  const executions = await readExecutions();
  const filtered = executions.filter((item) => item.id !== execution.id);
  filtered.push(execution);
  await writeExecutions(filtered);
  await markPacketSubmitted(packet.id);

  return {
    execution,
    recommended_next_action: execution.recommended_next_action,
    reasoning_summary: "The next generated execution packet was converted into a submitted Codex-ready execution record.",
  };
}
