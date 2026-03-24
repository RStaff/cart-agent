#!/usr/bin/env node

import { processOpportunity } from "../optimization/processOpportunity.js";

const operators = [
  {
    operatorId: "op_t3",
    name: "Alex",
    skills: ["email", "shopify"],
    completionRate: 0.98,
    speedScore: 4.2,
    qualityScore: 4.8,
  },
  {
    operatorId: "op_t2",
    name: "Taylor",
    skills: ["email", "shopify"],
    completionRate: 0.95,
    speedScore: 3.9,
    qualityScore: 4.9,
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cases = [
  {
    name: "CASE 1",
    opportunity: {
      id: "opp_ignore",
      revenuePotential: 100,
      currentRecoveryRate: 9,
      trafficVolume: 500,
      confidenceScore: 2,
      actionType: "email_send",
      operators,
    },
    expectedDecision: "IGNORE",
    expectedMode: "AUTO",
    expectedAction: "IGNORE",
  },
  {
    name: "CASE 2",
    opportunity: {
      id: "opp_auto",
      revenuePotential: 1200,
      currentRecoveryRate: 6,
      trafficVolume: 2500,
      confidenceScore: 2,
      actionType: "sms_recovery",
      operators,
    },
    expectedDecision: "AUTOMATE",
    expectedMode: "AUTO",
    expectedAction: "RUN_AUTOMATION",
  },
  {
    name: "CASE 3",
    opportunity: {
      id: "opp_hybrid",
      revenuePotential: 2600,
      currentRecoveryRate: 2.4,
      trafficVolume: 12000,
      confidenceScore: 5,
      effortRequired: "low",
      actionType: "timing_optimization",
      operators,
    },
    expectedDecision: "AUTOMATE",
    expectedMode: "HYBRID",
    expectedAction: "RUN_AUTOMATION_OPTIONAL_ESCALATION",
  },
  {
    name: "CASE 4",
    opportunity: {
      id: "opp_human_packet",
      shopDomain: "exec-control.myshopify.com",
      revenuePotential: 2600,
      currentRecoveryRate: 2.4,
      trafficVolume: 12000,
      confidenceScore: 5,
      effortRequired: "high",
      actionType: "email_send",
      paymentModel: "FIXED_FEE",
      estimatedClientValue: 3200,
      agreed: true,
      operators,
    },
    expectedDecision: "ESCALATE",
    expectedMode: "HUMAN_REQUIRED",
    expectedAction: "CREATE_EXECUTION_PACKET",
  },
  {
    name: "CASE 5",
    opportunity: {
      id: "opp_pricing_force_human",
      shopDomain: "pricing.myshopify.com",
      revenuePotential: 2600,
      currentRecoveryRate: 2.4,
      trafficVolume: 12000,
      confidenceScore: 5,
      effortRequired: "low",
      actionType: "pricing_change",
      paymentModel: "FIXED_FEE",
      estimatedClientValue: 3200,
      agreed: true,
      operators,
    },
    expectedDecision: "ESCALATE",
    expectedMode: "HUMAN_REQUIRED",
    expectedAction: "CREATE_EXECUTION_PACKET",
  },
  {
    name: "CASE 6",
    opportunity: {
      id: "opp_blocked_payment",
      shopDomain: "blocked.myshopify.com",
      revenuePotential: 2600,
      currentRecoveryRate: 2.4,
      trafficVolume: 12000,
      confidenceScore: 5,
      effortRequired: "high",
      actionType: "email_send",
      paymentModel: null,
      agreed: false,
      operators,
    },
    expectedDecision: "ESCALATE",
    expectedMode: "HUMAN_REQUIRED",
    expectedAction: "BLOCKED_NO_PAYMENT",
  },
];

try {
  const outputs = cases.map((testCase) => {
    const result = processOpportunity(testCase.opportunity);
    assert(result.decision === testCase.expectedDecision, `${testCase.name}: expected decision ${testCase.expectedDecision}, received ${result.decision}`);
    assert(result.executionMode === testCase.expectedMode, `${testCase.name}: expected executionMode ${testCase.expectedMode}, received ${result.executionMode}`);
    assert(result.action === testCase.expectedAction, `${testCase.name}: expected action ${testCase.expectedAction}, received ${result.action}`);

    if (testCase.expectedAction === "CREATE_EXECUTION_PACKET") {
      assert(result.packet?.packetId, `${testCase.name}: expected persisted packet`);
    } else {
      assert(result.packet === null, `${testCase.name}: packet should be null`);
    }

    if (testCase.name === "CASE 5") {
      assert(result.reasons.some((reason) => reason.includes("restricted to human-required execution")), "CASE 5: expected pricing override reason");
    }
    if (testCase.name === "CASE 6") {
      assert(result.revenue_gate?.status === "BLOCKED_NO_PAYMENT_MODEL", "CASE 6: expected blocked revenue gate");
    }

    return {
      case: testCase.name,
      score: result.score,
      decision: result.decision,
      executionMode: result.executionMode,
      action: result.action,
      reasons: result.reasons,
      packetId: result.packet?.packetId || null,
      revenue_gate: result.revenue_gate || null,
    };
  });

  console.log(JSON.stringify({ ok: true, outputs }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
}
