import { scoreOpportunity } from "../../opportunity_scoring/index.js";
import { generateExecutionPacket } from "./executionPacketGenerator.js";
import { rankOperators } from "./operatorMatcher.js";
import { checkPaymentGate } from "./paymentGate.js";
import { persistExecutionPacket } from "./persistExecutionPacket.js";
import { enforceAutomationScope } from "../execution/automationScope.js";

function filterEligibleOperators(shortlist) {
  return shortlist.filter((operator) => operator.tier === "TIER_2" || operator.tier === "TIER_3");
}

export function processOpportunity(opportunity = {}) {
  const scoreResult = scoreOpportunity(opportunity);
  const executionControl = enforceAutomationScope(opportunity, {
    decision: scoreResult.decision,
    executionMode: scoreResult.executionMode,
    reasons: scoreResult.reasons,
  });

  if (executionControl.decision === "IGNORE") {
    return {
      action: "IGNORE",
      decision: executionControl.decision,
      executionMode: executionControl.executionMode,
      score: scoreResult.score,
      breakdown: scoreResult.subscores,
      reasons: executionControl.reasons,
      packet: null,
      operatorShortlist: [],
      evaluationSummary: "Execution control ignored this opportunity because the score is below threshold.",
    };
  }

  if (executionControl.executionMode === "AUTO") {
    return {
      action: "RUN_AUTOMATION",
      decision: executionControl.decision,
      executionMode: executionControl.executionMode,
      score: scoreResult.score,
      breakdown: scoreResult.subscores,
      reasons: executionControl.reasons,
      packet: null,
      operatorShortlist: [],
      evaluationSummary: "Execution control approved direct automation.",
    };
  }

  if (executionControl.executionMode === "HYBRID") {
    return {
      action: "RUN_AUTOMATION_OPTIONAL_ESCALATION",
      decision: executionControl.decision,
      executionMode: executionControl.executionMode,
      score: scoreResult.score,
      breakdown: scoreResult.subscores,
      reasons: executionControl.reasons,
      packet: null,
      operatorShortlist: [],
      evaluationSummary: "Execution control approved hybrid automation with optional escalation.",
    };
  }

  const paymentGate = checkPaymentGate(opportunity);
  if (!paymentGate.valid) {
    return {
      action: "BLOCKED_NO_PAYMENT",
      reason: paymentGate.revenueGate?.reason || "Revenue gate blocked execution",
      decision: executionControl.decision,
      executionMode: executionControl.executionMode,
      score: scoreResult.score,
      breakdown: scoreResult.subscores,
      reasons: executionControl.reasons,
      packet: null,
      operatorShortlist: [],
      revenue_gate: paymentGate.revenueGate,
      paymentGate,
      evaluationSummary: "Execution control requires human escalation, but the revenue gate blocked packet creation.",
    };
  }

  const opportunityWithResolvedAgreement = {
    ...opportunity,
    paymentModel: paymentGate.revenueGate?.paymentModel || opportunity?.paymentModel || null,
    estimatedRevenueImpact:
      paymentGate.revenueGate?.estimatedRevenueImpact
      ?? opportunity?.estimatedRevenueImpact
      ?? opportunity?.estimatedClientValue
      ?? null,
    estimatedClientValue:
      paymentGate.revenueGate?.estimatedRevenueImpact
      ?? opportunity?.estimatedClientValue
      ?? opportunity?.estimatedRevenueImpact
      ?? null,
    agreed: paymentGate.revenueGate?.agreed ?? opportunity?.agreed ?? false,
  };

  const packet = generateExecutionPacket(opportunityWithResolvedAgreement, scoreResult.score);
  const rankedOperators = rankOperators(opportunity?.operators || [], {
    type: packet.packetType,
    requiredSkills: packet.operatorRequirements,
  });
  const operatorShortlist = filterEligibleOperators(rankedOperators);
  const persistedPacket = persistExecutionPacket(packet, operatorShortlist, rankedOperators);

  return {
    action: "CREATE_EXECUTION_PACKET",
    decision: executionControl.decision,
    executionMode: executionControl.executionMode,
    score: scoreResult.score,
    breakdown: scoreResult.subscores,
    reasons: executionControl.reasons,
    packet: persistedPacket,
    operatorShortlist,
    revenue_gate: paymentGate.revenueGate,
    paymentGate,
    evaluationSummary: "Execution control requires a human-reviewed execution packet.",
  };
}
