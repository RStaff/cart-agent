import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "executionPacketRegistry.json");

export const EXECUTION_PACKET_STATUS = {
  CREATED: "CREATED",
  REVIEW_PENDING: "REVIEW_PENDING",
  READY_FOR_ASSIGNMENT: "READY_FOR_ASSIGNMENT",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
};

export const EXECUTION_PACKET_QC_STATUS = {
  NOT_REVIEWED: "NOT_REVIEWED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REVISION_REQUIRED: "REVISION_REQUIRED",
};

function ensureRegistry() {
  if (!existsSync(REGISTRY_PATH)) {
    writeFileSync(REGISTRY_PATH, "[]\n", "utf8");
  }
}

function readRegistry() {
  ensureRegistry();
  try {
    return JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  } catch {
    return [];
  }
}

function writeRegistry(records) {
  writeFileSync(REGISTRY_PATH, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

function now() {
  return new Date().toISOString();
}

function normalizeRecord(packetData = {}) {
  const timestamp = now();
  return {
    id: packetData.id || `execution_packet__${packetData.packetId}`,
    packetId: packetData.packetId,
    packetType: packetData.packetType,
    taskTitle: packetData.taskTitle,
    estimatedTime: packetData.estimatedTime,
    basePayout: Number(packetData.basePayout) || 0,
    bonusStructure: packetData.bonusStructure || "",
    instructions: Array.isArray(packetData.instructions) ? packetData.instructions : [],
    assets: Array.isArray(packetData.assets) ? packetData.assets : [],
    qcRequirements: Array.isArray(packetData.qcRequirements) ? packetData.qcRequirements : [],
    operatorRequirements: Array.isArray(packetData.operatorRequirements) ? packetData.operatorRequirements : [],
    decisionScore: Number(packetData.decisionScore) || 0,
    paymentModel: packetData.paymentModel || "",
    estimatedRevenueImpact: Number(packetData.estimatedRevenueImpact) || 0,
    opportunityContext: packetData.opportunityContext || {},
    status: packetData.status || EXECUTION_PACKET_STATUS.CREATED,
    operatorShortlist: Array.isArray(packetData.operatorShortlist) ? packetData.operatorShortlist : [],
    rankedOperators: Array.isArray(packetData.rankedOperators) ? packetData.rankedOperators : [],
    assignedOperatorId: packetData.assignedOperatorId || null,
    qcStatus: packetData.qcStatus || EXECUTION_PACKET_QC_STATUS.NOT_REVIEWED,
    submissionData: packetData.submissionData || null,
    feedbackMetrics: packetData.feedbackMetrics || null,
    lastReviewDecision: packetData.lastReviewDecision || null,
    reviewNotes: packetData.reviewNotes || null,
    reviewedAt: packetData.reviewedAt || null,
    reviewedBy: packetData.reviewedBy || null,
    createdAt: packetData.createdAt || timestamp,
    updatedAt: timestamp,
    completedAt: packetData.completedAt || null,
  };
}

export function createExecutionPacket(packetData = {}) {
  if (!packetData?.packetId) {
    throw new Error("createExecutionPacket requires packetId");
  }

  const records = readRegistry();
  const existing = records.find((record) => record.packetId === packetData.packetId);
  if (existing) {
    return existing;
  }

  const record = normalizeRecord(packetData);
  records.push(record);
  writeRegistry(records);
  return record;
}

export function getExecutionPacketByPacketId(packetId) {
  return readRegistry().find((record) => record.packetId === packetId) || null;
}

export function listExecutionPackets(filters = {}) {
  return readRegistry().filter((record) => {
    if (filters.status && record.status !== filters.status) return false;
    if (filters.qcStatus && record.qcStatus !== filters.qcStatus) return false;
    if (filters.packetType && record.packetType !== filters.packetType) return false;
    return true;
  });
}

export function updateExecutionPacketStatus(packetId, status) {
  const records = readRegistry();
  const index = records.findIndex((record) => record.packetId === packetId);
  if (index < 0) return null;

  const next = {
    ...records[index],
    status,
    updatedAt: now(),
    completedAt: status === EXECUTION_PACKET_STATUS.COMPLETED ? now() : records[index].completedAt,
  };
  records[index] = next;
  writeRegistry(records);
  return next;
}

export function updateExecutionPacketQc(packetId, qcStatus, submissionData = null) {
  const records = readRegistry();
  const index = records.findIndex((record) => record.packetId === packetId);
  if (index < 0) return null;

  const next = {
    ...records[index],
    qcStatus,
    submissionData,
    updatedAt: now(),
  };
  records[index] = next;
  writeRegistry(records);
  return next;
}

export function recordExecutionPacketFeedback(packetId, feedbackMetrics) {
  const records = readRegistry();
  const index = records.findIndex((record) => record.packetId === packetId);
  if (index < 0) return null;

  const next = {
    ...records[index],
    feedbackMetrics,
    updatedAt: now(),
  };
  records[index] = next;
  writeRegistry(records);
  return next;
}

export function updateExecutionPacketReview(packetId, reviewData = {}) {
  const records = readRegistry();
  const index = records.findIndex((record) => record.packetId === packetId);
  if (index < 0) return null;

  const next = {
    ...records[index],
    lastReviewDecision: reviewData.lastReviewDecision ?? records[index].lastReviewDecision,
    reviewNotes: reviewData.reviewNotes ?? records[index].reviewNotes,
    reviewedAt: reviewData.reviewedAt ?? now(),
    reviewedBy: reviewData.reviewedBy ?? records[index].reviewedBy ?? "internal_operator",
    updatedAt: now(),
  };
  records[index] = next;
  writeRegistry(records);
  return next;
}

export function updateExecutionPacketAssignment(packetId, assignedOperatorId, status = EXECUTION_PACKET_STATUS.ASSIGNED) {
  const records = readRegistry();
  const index = records.findIndex((record) => record.packetId === packetId);
  if (index < 0) return null;

  const next = {
    ...records[index],
    assignedOperatorId: assignedOperatorId || null,
    status,
    updatedAt: now(),
  };
  records[index] = next;
  writeRegistry(records);
  return next;
}
