import { PACKET_TEMPLATES } from "./packetTemplates.js";

function isoTimestamp() {
  return new Date().toISOString();
}

function packetTypeForOpportunity(opportunity = {}) {
  return opportunity?.packetType || "CHECKOUT_DECISION_OPTIMIZATION_V1";
}

function basePayoutForScore(defaultPayout, score) {
  if (score >= 18) return Math.max(defaultPayout, defaultPayout + 40);
  if (score >= 16) return Math.max(defaultPayout, defaultPayout);
  return defaultPayout;
}

export function generateExecutionPacket(opportunity = {}, score = 0) {
  const template = PACKET_TEMPLATES[packetTypeForOpportunity(opportunity)] || PACKET_TEMPLATES.CHECKOUT_DECISION_OPTIMIZATION_V1;
  const packetId = template.stablePacketId(opportunity, template.packetType);

  return {
    packetId,
    packetType: template.packetType,
    taskTitle: opportunity?.taskTitle || template.taskTitle,
    estimatedTime: template.estimatedTime,
    basePayout: basePayoutForScore(template.basePayout, score),
    bonusStructure: template.bonusStructure,
    instructions: Array.isArray(opportunity?.instructions) && opportunity.instructions.length > 0
      ? opportunity.instructions
      : template.instructions,
    assets: Array.isArray(opportunity?.assets) && opportunity.assets.length > 0
      ? opportunity.assets
      : template.assets,
    qcRequirements: Array.isArray(opportunity?.qcRequirements) && opportunity.qcRequirements.length > 0
      ? opportunity.qcRequirements
      : template.qcRequirements,
    operatorRequirements: Array.isArray(opportunity?.operatorRequirements) && opportunity.operatorRequirements.length > 0
      ? opportunity.operatorRequirements
      : template.operatorRequirements,
    decisionScore: score,
    paymentModel: String(opportunity?.paymentModel || ""),
    estimatedRevenueImpact: Number(
      opportunity?.estimatedRevenueImpact
        ?? opportunity?.estimatedClientValue
        ?? opportunity?.estimatedRevenueUpside
        ?? opportunity?.revenuePotential
        ?? 0,
    ) || 0,
    createdAt: isoTimestamp(),
    opportunityContext: {
      id: opportunity?.id || null,
      shopDomain: opportunity?.shopDomain || null,
      cartToken: opportunity?.cartToken || null,
      estimatedRevenueImpact: Number(
        opportunity?.estimatedRevenueImpact
          ?? opportunity?.estimatedClientValue
          ?? opportunity?.estimatedRevenueUpside
          ?? opportunity?.revenuePotential
          ?? 0,
      ) || 0,
      revenuePotential: opportunity?.revenuePotential ?? opportunity?.estimatedRevenueUpside ?? null,
      currentRecoveryRate: opportunity?.currentRecoveryRate ?? null,
      trafficVolume: opportunity?.trafficVolume ?? opportunity?.monthlyCheckoutSessions ?? null,
      confidenceScore: opportunity?.confidenceScore ?? null,
      validationMode: Boolean(opportunity?.validationMode),
      notes: opportunity?.notes || null,
    },
  };
}
