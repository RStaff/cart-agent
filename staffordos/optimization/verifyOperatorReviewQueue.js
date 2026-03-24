#!/usr/bin/env node

import { processOpportunity } from "./processOpportunity.js";
import {
  REVIEW_DECISIONS,
  assignShortlistedOperator,
  getReviewPacket,
  listReviewQueue,
  updateReviewDecision,
} from "./operatorReviewQueue.js";

const tieredOperators = [
  {
    operatorId: "op_t3",
    name: "Alex",
    skills: ["email", "shopify", "copy"],
    completionRate: 0.98,
    speedScore: 4.2,
    qualityScore: 4.8,
  },
  {
    operatorId: "op_t2",
    name: "Taylor",
    skills: ["email", "shopify", "lifecycle"],
    completionRate: 0.95,
    speedScore: 3.9,
    qualityScore: 4.9,
  },
  {
    operatorId: "op_t1",
    name: "Morgan",
    skills: ["email", "shopify"],
    completionRate: 0.65,
    speedScore: 2.8,
    qualityScore: 3.0,
  },
];

function buildOpportunity(idSuffix, operators = tieredOperators) {
  return {
    id: `opp_review_${idSuffix}_${Date.now()}`,
    shopDomain: "review-queue.myshopify.com",
    revenuePotential: 2600,
    currentRecoveryRate: 2.4,
    trafficVolume: 12000,
    confidenceScore: 5,
    paymentModel: "FIXED_FEE",
    estimatedClientValue: 3200,
    agreed: true,
    operators,
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const approvedResult = processOpportunity(buildOpportunity("approved"));
  assert(approvedResult.action === "CREATE_REVENUE_TASK", "expected packet creation for approved flow");

  const queue = listReviewQueue();
  const queueHit = queue.find((packet) => packet.packetId === approvedResult.packet.packetId);
  assert(queueHit, "created packet did not appear in review queue");

  const detail = getReviewPacket(approvedResult.packet.packetId);
  assert(detail?.packetId === approvedResult.packet.packetId, "packet detail lookup failed");

  const reviewApproved = updateReviewDecision(
    approvedResult.packet.packetId,
    REVIEW_DECISIONS.APPROVE_FOR_ASSIGNMENT,
    "Looks good for controlled assignment.",
    "codex_reviewer",
  );
  assert(reviewApproved.ok === true, "review approval failed");
  assert(reviewApproved.packet.status === "READY_FOR_ASSIGNMENT", "packet did not move to READY_FOR_ASSIGNMENT");

  const assignmentApproved = assignShortlistedOperator(approvedResult.packet.packetId, "op_t3");
  assert(assignmentApproved.ok === true, "tier-3 assignment failed");
  assert(assignmentApproved.packet.status === "ASSIGNED", "packet did not move to ASSIGNED");

  const tierOneResult = processOpportunity(buildOpportunity("tier1-only", [tieredOperators[2]]));
  assert(tierOneResult.action === "CREATE_REVENUE_TASK", "expected high-value packet for tier-1 rejection case");
  const tierOneReject = assignShortlistedOperator(tierOneResult.packet.packetId, "op_t1");
  assert(tierOneReject.ok === false, "tier-1 assignment should fail");
  assert(
    tierOneReject.error === "HIGH_VALUE_PACKET_REQUIRES_TIER_2_OR_TIER_3",
    "tier-1 rejection reason mismatch",
  );

  const rejectedResult = processOpportunity(buildOpportunity("rejected"));
  assert(rejectedResult.action === "CREATE_REVENUE_TASK", "expected packet creation for rejection flow");
  const reviewRejected = updateReviewDecision(
    rejectedResult.packet.packetId,
    REVIEW_DECISIONS.REJECT_PACKET,
    "Decision packet is not strong enough to advance.",
    "codex_reviewer",
  );
  assert(reviewRejected.ok === true, "review rejection failed");
  assert(reviewRejected.packet.status === "REJECTED", "packet did not move to REJECTED");

  console.log(JSON.stringify({
    ok: true,
    queueCase: {
      packetId: approvedResult.packet.packetId,
      inQueue: true,
    },
    detailCase: {
      packetId: detail.packetId,
      shortlistCount: detail.operatorShortlist.length,
    },
    reviewApproved: {
      packetId: reviewApproved.packet.packetId,
      status: reviewApproved.packet.status,
      lastReviewDecision: reviewApproved.packet.lastReviewDecision,
      reviewNotes: reviewApproved.packet.reviewNotes,
    },
    assignmentApproved: {
      packetId: assignmentApproved.packet.packetId,
      status: assignmentApproved.packet.status,
      assignedOperatorId: assignmentApproved.packet.assignedOperatorId,
    },
    tierOneReject,
    reviewRejected: {
      packetId: reviewRejected.packet.packetId,
      status: reviewRejected.packet.status,
      lastReviewDecision: reviewRejected.packet.lastReviewDecision,
    },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
}
