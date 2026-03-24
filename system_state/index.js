import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { listSignals } from "../signals/signal_registry/index.js";
import { listCandidateOpportunities } from "../candidate_opportunities/index.js";
import { listSlices } from "../slices/index.js";
import { listBuildQueue, getNextBuildQueueItem } from "../build_queue/index.js";
import { getNextExecutionPacket, listExecutionPackets } from "../execution_packets/index.js";
import { listFeedback } from "../feedback_registry/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");
const SYSTEM_SNAPSHOT_SCHEMA_VERSION = "v1";

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(snapshots) {
  await writeFile(REGISTRY_PATH, JSON.stringify(snapshots, null, 2) + "\n", "utf8");
}

function snapshotStatus(health) {
  return health === "blocked" ? "blocked" : "generated";
}

function normalizeSystemSnapshot(snapshot) {
  const createdAt = snapshot?.created_at || snapshot?.generated_at || new Date().toISOString();
  return {
    ...snapshot,
    schema_version: snapshot?.schema_version || SYSTEM_SNAPSHOT_SCHEMA_VERSION,
    status: snapshot?.status || snapshotStatus(snapshot?.system_health),
    created_at: createdAt,
    generated_at: snapshot?.generated_at || createdAt,
  };
}

function recentSuccessRate(feedback) {
  if (feedback.length < 3) return null;
  const recent = feedback.slice(0, 5);
  const score = recent.reduce((total, record) => {
    if (record.outcome === "success") return total + 1;
    if (record.outcome === "partial") return total + 0.5;
    return total;
  }, 0);
  return Number((score / recent.length).toFixed(2));
}

function deriveSystemHealth({ buildQueueCount, queueHead, latestExecutionPacket, latestFeedback, successRate }) {
  if (buildQueueCount === 0 || !queueHead) return "blocked";
  if (latestFeedback?.outcome === "failed") return "blocked";
  if (latestExecutionPacket?.status === "generated") return "partial";
  if (successRate !== null && successRate < 0.6) return "partial";
  if (latestFeedback?.outcome === "partial") return "partial";
  return "healthy";
}

function buildRecommendedNextAction({ queueHead, latestExecutionPacket, latestFeedback, health }) {
  if (!queueHead) return "Run the build queue so the system has a selected next slice.";
  if (!latestExecutionPacket) return "Generate an execution packet from the selected build-queue slice.";
  if (latestExecutionPacket.status === "generated") return "Submit the generated execution packet through the packet executor.";
  if (!latestFeedback) return "Record feedback for the current execution packet once implementation results are known.";
  if (health === "blocked") return "Resolve the blocking issue before selecting or executing another slice.";
  if (health === "partial") return "Use the latest feedback to refine the current slice before expanding scope.";
  return "Continue with the selected execution path and record feedback after implementation.";
}

function buildReasoningSummary({ signalsCount, candidateCount, slicesCount, buildQueueCount, packetsCount, feedbackCount, health, successRate }) {
  const successText = successRate === null ? "Recent success rate is not yet available." : `Recent success rate is ${successRate}.`;
  return [
    `System has ${signalsCount} signals, ${candidateCount} candidate opportunities, ${slicesCount} slices, ${buildQueueCount} queued slices, ${packetsCount} execution packets, and ${feedbackCount} feedback records.`,
    `${successText}`,
    `Overall system health is ${health}.`,
  ].join(" ");
}

function buildSnapshotId() {
  return `snapshot__${Date.now()}`;
}

export async function buildSystemSnapshot() {
  const [
    signals,
    candidates,
    slices,
    buildQueue,
    queueHead,
    packets,
    latestExecutionPacket,
    feedback,
  ] = await Promise.all([
    listSignals(),
    listCandidateOpportunities(),
    listSlices(),
    listBuildQueue(),
    getNextBuildQueueItem(),
    listExecutionPackets(),
    getNextExecutionPacket(),
    listFeedback(),
  ]);

  const latestFeedback = feedback[0] || null;
  const successRate = recentSuccessRate(feedback);
  const health = deriveSystemHealth({
    buildQueueCount: buildQueue.length,
    queueHead,
    latestExecutionPacket,
    latestFeedback,
    successRate,
  });

  const snapshot = {
    id: buildSnapshotId(),
    schema_version: SYSTEM_SNAPSHOT_SCHEMA_VERSION,
    status: snapshotStatus(health),
    created_at: new Date().toISOString(),
    generated_at: new Date().toISOString(),
    signals_count: signals.length,
    candidate_opportunities_count: candidates.length,
    slices_count: slices.length,
    build_queue_count: buildQueue.length,
    build_queue_head: queueHead,
    execution_packets_count: packets.length,
    latest_execution_packet: latestExecutionPacket,
    feedback_count: feedback.length,
    latest_feedback: latestFeedback,
    recent_success_rate: successRate,
    system_health: health,
    recommended_next_action: buildRecommendedNextAction({
      queueHead,
      latestExecutionPacket,
      latestFeedback,
      health,
    }),
    reasoning_summary: buildReasoningSummary({
      signalsCount: signals.length,
      candidateCount: candidates.length,
      slicesCount: slices.length,
      buildQueueCount: buildQueue.length,
      packetsCount: packets.length,
      feedbackCount: feedback.length,
      health,
      successRate,
    }),
  };

  const existing = (await readRegistry()).map(normalizeSystemSnapshot);
  existing.push(normalizeSystemSnapshot(snapshot));
  await writeRegistry(existing);
  return normalizeSystemSnapshot(snapshot);
}

export async function getLatestSystemSnapshot() {
  const snapshots = await readRegistry();
  return snapshots.map(normalizeSystemSnapshot).sort((a, b) => {
    const timeA = Date.parse(a.generated_at || "") || 0;
    const timeB = Date.parse(b.generated_at || "") || 0;
    return timeB - timeA;
  })[0] || null;
}
