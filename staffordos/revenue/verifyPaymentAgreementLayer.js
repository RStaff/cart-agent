#!/usr/bin/env node

import {
  getPaymentAgreementByOpportunityId,
  listPaymentAgreements,
  markAgreementAccepted,
  markAgreementNotAccepted,
  upsertPaymentAgreement,
} from "./paymentAgreementRepository.js";
import { validateRevenueGate } from "./revenue_gate.js";
import { processOpportunity } from "../optimization/processOpportunity.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const runId = Date.now();
  const blockedId = `opp_missing_agreement_${runId}`;
  const notAcceptedId = `opp_not_accepted_${runId}`;
  const acceptedId = `opp_accepted_${runId}`;
  const processId = `opp_process_unblock_${runId}`;

  const missing = validateRevenueGate({ id: blockedId, estimatedRevenueImpact: 2400 });
  assert(missing.status === "BLOCKED_NO_PAYMENT_MODEL", "CASE 1 failed");

  markAgreementNotAccepted(notAcceptedId, {
    paymentModel: "FIXED_FEE",
    estimatedClientValue: 2800,
    agreementSource: "MANUAL_INTERNAL",
    notes: "Waiting on approval.",
  });
  const blockedNotAgreed = validateRevenueGate({ id: notAcceptedId });
  assert(blockedNotAgreed.status === "BLOCKED_NOT_AGREED", "CASE 2 failed");

  markAgreementAccepted(acceptedId, {
    paymentModel: "HYBRID",
    estimatedClientValue: 3600,
    agreementSource: "MERCHANT_ACCEPTED",
    notes: "Merchant approved the optimization path.",
  });
  const approved = validateRevenueGate({ id: acceptedId });
  assert(approved.status === "APPROVED", "CASE 3 failed");

  const before = processOpportunity({
    id: processId,
    shopDomain: "agreement-layer.myshopify.com",
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
  assert(before.action === "BLOCKED_NO_PAYMENT", "CASE 4 before-state failed");

  upsertPaymentAgreement(processId, {
    paymentModel: "FIXED_FEE",
    estimatedClientValue: 4200,
    agreed: true,
    agreementSource: "DEFAULT_INTERNAL",
    notes: "Default internal agreement for controlled execution.",
  });

  const after = processOpportunity({
    id: processId,
    shopDomain: "agreement-layer.myshopify.com",
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
  assert(after.action === "CREATE_EXECUTION_PACKET", "CASE 4 after-state failed");

  console.log(JSON.stringify({
    ok: true,
    cases: {
      case1: {
        decision: missing.status,
        reason: missing.reason,
      },
      case2: {
        decision: blockedNotAgreed.status,
        reason: blockedNotAgreed.reason,
      },
      case3: {
        decision: approved.status,
        reason: approved.reason,
        agreement: getPaymentAgreementByOpportunityId(acceptedId),
      },
      case4: {
        beforeAction: before.action,
        afterAction: after.action,
        packetId: after.packet?.packetId || null,
      },
      listSummary: {
        total: listPaymentAgreements().length,
        agreedCount: listPaymentAgreements({ agreed: true }).length,
      },
    },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
}
