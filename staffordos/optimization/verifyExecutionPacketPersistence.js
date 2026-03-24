#!/usr/bin/env node

import { processOpportunity } from "./processOpportunity.js";
import { recordExecutionFeedback } from "./feedbackRecorder.js";
import {
  EXECUTION_PACKET_QC_STATUS,
  EXECUTION_PACKET_STATUS,
  getExecutionPacketByPacketId,
  updateExecutionPacketQc,
  updateExecutionPacketStatus,
  recordExecutionPacketFeedback,
} from "./executionPacketRepository.js";

const operators = [
  {
    operatorId: "op_1",
    name: "Alex",
    skills: ["email", "shopify", "copy"],
    completionRate: 0.98,
    speedScore: 4.2,
    qualityScore: 4.8,
  },
  {
    operatorId: "op_2",
    name: "Jordan",
    skills: ["shopify", "analytics"],
    completionRate: 0.91,
    speedScore: 4.7,
    qualityScore: 4.1,
  },
  {
    operatorId: "op_3",
    name: "Taylor",
    skills: ["email", "shopify", "lifecycle"],
    completionRate: 0.95,
    speedScore: 3.9,
    qualityScore: 4.9,
  },
];

function buildOpportunity() {
  const suffix = Date.now();
  return {
    id: `opp_persist_${suffix}`,
    shopDomain: "packet-persistence.myshopify.com",
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

try {
  const result = processOpportunity(buildOpportunity());
  if (result.action !== "CREATE_REVENUE_TASK") {
    throw new Error(`expected CREATE_REVENUE_TASK, received ${result.action}`);
  }

  const created = getExecutionPacketByPacketId(result.packet.packetId);
  if (!created) {
    throw new Error("packet was not persisted");
  }

  const statusUpdated = updateExecutionPacketStatus(created.packetId, EXECUTION_PACKET_STATUS.REVIEW_PENDING);
  if (statusUpdated?.status !== EXECUTION_PACKET_STATUS.REVIEW_PENDING) {
    throw new Error("status update failed");
  }

  const submissionData = {
    screenshots: ["flow.png"],
    liveLinks: ["https://store.example/decision-flow"],
    testVerifications: ["conversion-check-ok"],
  };
  const qcUpdated = updateExecutionPacketQc(
    created.packetId,
    EXECUTION_PACKET_QC_STATUS.REVISION_REQUIRED,
    submissionData,
  );
  if (qcUpdated?.qcStatus !== EXECUTION_PACKET_QC_STATUS.REVISION_REQUIRED) {
    throw new Error("qc update failed");
  }

  const feedback = recordExecutionFeedback({
    beforeRecoveryRate: 2.4,
    afterRecoveryRate: 4.9,
    revenueImpact: 1800,
    taskSuccess: true,
  });
  const feedbackUpdated = recordExecutionPacketFeedback(created.packetId, feedback);
  if (feedbackUpdated?.feedbackMetrics?.revenueImpact !== 1800) {
    throw new Error("feedback update failed");
  }

  console.log(JSON.stringify({
    ok: true,
    created: {
      packetId: created.packetId,
      packetType: created.packetType,
      status: created.status,
      qcStatus: created.qcStatus,
    },
    statusUpdated: {
      packetId: statusUpdated.packetId,
      status: statusUpdated.status,
    },
    qcUpdated: {
      packetId: qcUpdated.packetId,
      qcStatus: qcUpdated.qcStatus,
      submissionData: qcUpdated.submissionData,
    },
    feedbackUpdated: {
      packetId: feedbackUpdated.packetId,
      feedbackMetrics: feedbackUpdated.feedbackMetrics,
    },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
}
