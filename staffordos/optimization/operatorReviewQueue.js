import {
  EXECUTION_PACKET_STATUS,
  getExecutionPacketByPacketId,
  listExecutionPackets,
  updateExecutionPacketAssignment,
  updateExecutionPacketReview,
  updateExecutionPacketStatus,
} from "./executionPacketRepository.js";

const REVIEW_DECISIONS = {
  APPROVE_FOR_ASSIGNMENT: "APPROVE_FOR_ASSIGNMENT",
  HOLD_FOR_REVIEW: "HOLD_FOR_REVIEW",
  REJECT_PACKET: "REJECT_PACKET",
  REQUEST_REVISION: "REQUEST_REVISION",
};

function isHighValuePacket(packet) {
  return Number(packet?.decisionScore) >= 16;
}

function shortlistedOperator(packet, operatorId) {
  return (packet?.operatorShortlist || []).find((operator) => operator.operatorId === operatorId) || null;
}

function rankedOperator(packet, operatorId) {
  return (packet?.rankedOperators || []).find((operator) => operator.operatorId === operatorId) || null;
}

export function listReviewQueue(filters = {}) {
  const allowedStatuses = new Set(
    Array.isArray(filters.statuses) && filters.statuses.length > 0
      ? filters.statuses
      : [EXECUTION_PACKET_STATUS.CREATED, EXECUTION_PACKET_STATUS.REVIEW_PENDING],
  );

  return listExecutionPackets(filters).filter((packet) => allowedStatuses.has(packet.status));
}

export function getReviewPacket(packetId) {
  return getExecutionPacketByPacketId(packetId);
}

export function movePacketToReadyForAssignment(packetId) {
  return updateExecutionPacketStatus(packetId, EXECUTION_PACKET_STATUS.READY_FOR_ASSIGNMENT);
}

export function movePacketToAssigned(packetId, operatorId) {
  return updateExecutionPacketAssignment(packetId, operatorId, EXECUTION_PACKET_STATUS.ASSIGNED);
}

export function updateReviewDecision(packetId, decision, notes = "", reviewedBy = "internal_operator") {
  const packet = getReviewPacket(packetId);
  if (!packet) {
    return { ok: false, error: "PACKET_NOT_FOUND" };
  }

  if (!REVIEW_DECISIONS[decision]) {
    return { ok: false, error: "INVALID_REVIEW_DECISION" };
  }

  let status = packet.status;
  if (decision === REVIEW_DECISIONS.APPROVE_FOR_ASSIGNMENT) {
    status = EXECUTION_PACKET_STATUS.READY_FOR_ASSIGNMENT;
  } else if (decision === REVIEW_DECISIONS.HOLD_FOR_REVIEW || decision === REVIEW_DECISIONS.REQUEST_REVISION) {
    status = EXECUTION_PACKET_STATUS.REVIEW_PENDING;
  } else if (decision === REVIEW_DECISIONS.REJECT_PACKET) {
    status = EXECUTION_PACKET_STATUS.REJECTED;
  }

  const reviewed = updateExecutionPacketReview(packetId, {
    lastReviewDecision: decision,
    reviewNotes: notes || null,
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  });
  const updated = updateExecutionPacketStatus(packetId, status);

  return {
    ok: true,
    packet: {
      ...updated,
      lastReviewDecision: reviewed?.lastReviewDecision ?? decision,
      reviewNotes: reviewed?.reviewNotes ?? notes,
      reviewedAt: reviewed?.reviewedAt ?? null,
      reviewedBy: reviewed?.reviewedBy ?? reviewedBy,
    },
  };
}

export function assignShortlistedOperator(packetId, operatorId) {
  const packet = getReviewPacket(packetId);
  if (!packet) {
    return { ok: false, error: "PACKET_NOT_FOUND" };
  }

  const ranked = rankedOperator(packet, operatorId);
  if (isHighValuePacket(packet) && ranked?.tier === "TIER_1") {
    return {
      ok: false,
      error: "HIGH_VALUE_PACKET_REQUIRES_TIER_2_OR_TIER_3",
      packetId,
      operatorId,
    };
  }

  const operator = shortlistedOperator(packet, operatorId);
  if (!operator) {
    return { ok: false, error: "OPERATOR_NOT_IN_SHORTLIST" };
  }

  const updated = movePacketToAssigned(packetId, operatorId);
  return { ok: true, packet: updated };
}

export { REVIEW_DECISIONS };
