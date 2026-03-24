#!/usr/bin/env node

import { processOpportunity } from "./processOpportunity.js";
import { validateExecution } from "./qcValidator.js";
import { recordExecutionFeedback } from "./feedbackRecorder.js";

const sampleOperators = [
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
  {
    operatorId: "op_4",
    name: "Morgan",
    skills: ["design"],
    completionRate: 0.88,
    speedScore: 4.4,
    qualityScore: 4.0,
  },
];

const paid = {
  paymentModel: "FIXED_FEE",
  estimatedClientValue: 3200,
  agreed: true,
};

const cases = [
  {
    name: "blocked (no payment)",
    opportunity: {
      id: "opp_blocked",
      shopDomain: "blocked.myshopify.com",
      revenuePotential: 2600,
      currentRecoveryRate: 2.4,
      trafficVolume: 12000,
      confidenceScore: 5,
      effortRequired: "high",
      actionType: "email_send",
      agreed: false,
      paymentModel: "FIXED_FEE",
      estimatedClientValue: 3000,
      operators: sampleOperators,
    },
    expectedDecision: "ESCALATE",
    expectedExecutionMode: "HUMAN_REQUIRED",
    expectedAction: "BLOCKED_NO_PAYMENT",
  },
  {
    name: "automation only",
    opportunity: {
      id: "opp_low",
      shopDomain: "low-score.myshopify.com",
      revenuePotential: 1200,
      currentRecoveryRate: 6.2,
      trafficVolume: 2500,
      confidenceScore: 2,
      actionType: "sms_recovery",
      operators: sampleOperators,
      ...paid,
    },
    expectedDecision: "AUTOMATE",
    expectedExecutionMode: "AUTO",
    expectedAction: "RUN_AUTOMATION",
  },
  {
    name: "ignore",
    opportunity: {
      id: "opp_mid",
      shopDomain: "review-score.myshopify.com",
      revenuePotential: 200,
      currentRecoveryRate: 9,
      trafficVolume: 500,
      confidenceScore: 2,
      actionType: "email_send",
      operators: sampleOperators,
      ...paid,
    },
    expectedDecision: "IGNORE",
    expectedExecutionMode: "AUTO",
    expectedAction: "IGNORE",
  },
  {
    name: "revenue task creation",
    opportunity: {
      id: "opp_high",
      shopDomain: "revenue-task.myshopify.com",
      revenuePotential: 2600,
      currentRecoveryRate: 2.4,
      trafficVolume: 12000,
      confidenceScore: 5,
      effortRequired: "high",
      actionType: "email_send",
      operators: sampleOperators,
      notes: "Large upside with weak current recovery performance.",
      ...paid,
    },
    expectedDecision: "ESCALATE",
    expectedExecutionMode: "HUMAN_REQUIRED",
    expectedAction: "CREATE_EXECUTION_PACKET",
  },
];

function assertCase(result, testCase) {
  if (result.decision !== testCase.expectedDecision) {
    throw new Error(`${testCase.name}: expected decision ${testCase.expectedDecision}, received ${result.decision}`);
  }
  if (result.executionMode !== testCase.expectedExecutionMode) {
    throw new Error(`${testCase.name}: expected executionMode ${testCase.expectedExecutionMode}, received ${result.executionMode}`);
  }
  if (result.action !== testCase.expectedAction) {
    throw new Error(`${testCase.name}: expected action ${testCase.expectedAction}, received ${result.action}`);
  }

  if (testCase.expectedAction === "CREATE_EXECUTION_PACKET") {
    if (!result.packet?.packetId) {
      throw new Error(`${testCase.name}: expected execution packet`);
    }
    if (result.packet.packetType !== "CHECKOUT_DECISION_OPTIMIZATION_V1") {
      throw new Error(`${testCase.name}: expected standardized packet type`);
    }
    if (!Array.isArray(result.operatorShortlist) || result.operatorShortlist.length !== 3) {
      throw new Error(`${testCase.name}: expected top-3 operator shortlist`);
    }
    if (result.operatorShortlist.some((operator) => operator.tier === "TIER_1")) {
      throw new Error(`${testCase.name}: high-value packets cannot shortlist tier-1 operators`);
    }
    return;
  }

  if (result.packet !== null || result.operatorShortlist.length !== 0) {
    throw new Error(`${testCase.name}: non-task decisions must not generate packet or shortlist`);
  }
}

try {
  const outputs = cases.map((testCase) => {
    const result = processOpportunity(testCase.opportunity);
    assertCase(result, testCase);
    return {
      case: testCase.name,
      score: result.score,
      decision: result.decision,
      executionMode: result.executionMode,
      action: result.action,
      reasons: result.reasons,
      paymentGate: result.paymentGate,
      packetId: result.packet?.packetId || null,
      operatorShortlist: result.operatorShortlist,
    };
  });

  const revenueTask = processOpportunity(cases[3].opportunity);
  const qcStatus = validateExecution(revenueTask.packet, {
    approvedByHuman: false,
    proof: {
      screenshots: ["flow.png"],
      liveLinks: ["https://store.example/recovery-flow"],
      testVerifications: ["test-email-sent"],
    },
  });
  if (qcStatus !== "REVISION_REQUIRED") {
    throw new Error(`qc validation: expected REVISION_REQUIRED, received ${qcStatus}`);
  }

  const feedback = recordExecutionFeedback({
    beforeRecoveryRate: 2.4,
    afterRecoveryRate: 4.9,
    revenueImpact: 1800,
    taskSuccess: true,
  });
  if (feedback.taskSuccess !== true || feedback.revenueImpact !== 1800) {
    throw new Error("feedback recorder: failed to normalize execution feedback");
  }

  console.log(JSON.stringify({ ok: true, outputs, qcStatus, feedback }, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
