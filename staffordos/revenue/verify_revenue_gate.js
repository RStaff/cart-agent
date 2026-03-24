#!/usr/bin/env node

import { validateRevenueGate } from "./revenue_gate.js";
import {
  getPaymentAgreementByOpportunityId,
  markAgreementAccepted,
  markAgreementNotAccepted,
  upsertPaymentAgreement,
} from "./paymentAgreementRepository.js";
import { processOpportunity } from "../optimization/processOpportunity.js";

const cases = [
  {
    name: "CASE 1",
    opportunityId: "opp_no_payment_model",
    setup: null,
    input: {
      id: "opp_no_payment_model",
      estimatedRevenueImpact: 2400,
      paymentModel: null,
      agreed: undefined,
    },
    expectedStatus: "BLOCKED_NO_PAYMENT_MODEL",
  },
  {
    name: "CASE 2",
    opportunityId: "opp_not_agreed",
    setup() {
      return markAgreementNotAccepted("opp_not_agreed", {
        paymentModel: "FIXED_FEE",
        estimatedClientValue: 2400,
        agreementSource: "MANUAL_INTERNAL",
        notes: "Pending internal commitment.",
      });
    },
    input: {
      id: "opp_not_agreed",
    },
    expectedStatus: "BLOCKED_NOT_AGREED",
  },
  {
    name: "CASE 3",
    opportunityId: "opp_approved",
    setup() {
      return markAgreementAccepted("opp_approved", {
        paymentModel: "FIXED_FEE",
        estimatedClientValue: 2400,
        agreementSource: "MANUAL_INTERNAL",
        notes: "Approved for controlled execution.",
      });
    },
    input: {
      id: "opp_approved",
    },
    expectedStatus: "APPROVED",
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const results = cases.map((testCase) => {
    if (typeof testCase.setup === "function") {
      testCase.setup();
    }
    const result = validateRevenueGate(testCase.input);
    assert(result.status === testCase.expectedStatus, `${testCase.name}: expected ${testCase.expectedStatus}, received ${result.status}`);
    return {
      case: testCase.name,
      input: {
        id: testCase.input.id,
      },
      decision: result.status,
      reason: result.reason,
      agreementSource: result.agreementSource,
    };
  });

  const integratedBlocked = processOpportunity({
    id: "opp_high_missing_payment",
    shopDomain: "revenue-gate.myshopify.com",
    revenuePotential: 2600,
    currentRecoveryRate: 2.4,
    trafficVolume: 12000,
    confidenceScore: 5,
    paymentModel: null,
    agreed: false,
    operators: [
      {
        operatorId: "op_1",
        name: "Alex",
        skills: ["email", "shopify"],
        completionRate: 0.98,
        speedScore: 4.2,
        qualityScore: 4.8,
      },
    ],
  });

  assert(integratedBlocked.action === "BLOCKED_NO_PAYMENT", `integrated blocked flow: expected BLOCKED_NO_PAYMENT, received ${integratedBlocked.action}`);
  assert(integratedBlocked.packet === null, "integrated blocked flow: packet must be null when revenue gate blocks");

  upsertPaymentAgreement("opp_high_missing_payment", {
    paymentModel: "HYBRID",
    estimatedClientValue: 4100,
    agreed: true,
    agreementSource: "MANUAL_INTERNAL",
    notes: "Internal payment path confirmed for escalation.",
  });

  const integratedApproved = processOpportunity({
    id: "opp_high_missing_payment",
    shopDomain: "revenue-gate.myshopify.com",
    revenuePotential: 2600,
    currentRecoveryRate: 2.4,
    trafficVolume: 12000,
    confidenceScore: 5,
    effortRequired: "high",
    actionType: "email_send",
    operators: [
      {
        operatorId: "op_1",
        name: "Alex",
        skills: ["email", "shopify"],
        completionRate: 0.98,
        speedScore: 4.2,
        qualityScore: 4.8,
      },
    ],
  });

  assert(integratedApproved.action === "CREATE_EXECUTION_PACKET", `integrated approved flow: expected CREATE_EXECUTION_PACKET, received ${integratedApproved.action}`);
  assert(Boolean(integratedApproved.packet?.packetId), "integrated approved flow: expected execution packet");
  assert(
    getPaymentAgreementByOpportunityId("opp_high_missing_payment")?.agreed === true,
    "persisted agreement lookup failed",
  );

  console.log(JSON.stringify({
    ok: true,
    results,
    integratedBlocked: {
      action: integratedBlocked.action,
      decision: integratedBlocked.decision,
      reason: integratedBlocked.reason,
      score: integratedBlocked.score,
      packet: integratedBlocked.packet,
    },
    integratedApproved: {
      action: integratedApproved.action,
      decision: integratedApproved.decision,
      score: integratedApproved.score,
      packetId: integratedApproved.packet?.packetId || null,
      revenue_gate: integratedApproved.revenue_gate,
    },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
}
