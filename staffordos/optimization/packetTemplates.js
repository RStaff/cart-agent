function stablePacketId(opportunity = {}, packetType) {
  const parts = [
    packetType,
    opportunity?.id || "unknown",
    opportunity?.shopDomain || "unknown-shop",
    opportunity?.paymentModel || "unknown-payment",
  ];

  return parts
    .join("__")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const PACKET_TEMPLATES = {
  CHECKOUT_DECISION_OPTIMIZATION_V1: {
    packetType: "CHECKOUT_DECISION_OPTIMIZATION_V1",
    taskTitle: "Improve checkout decision conversion",
    estimatedTime: "2-3 hours",
    basePayout: 120,
    bonusStructure: "Performance bonus released only after manual QC and verified revenue lift.",
    instructions: [
      "Review checkout decision email flow",
      "Replace subject lines using template set",
      "Update email body copy",
      "Verify triggers",
      "Send test email",
    ],
    assets: [
      "Current checkout decision email flow export",
      "Approved subject line template set",
      "Merchant checkout context summary",
    ],
    qcRequirements: [
      "Screenshot proof of updated flow",
      "Live link confirmation for the active flow",
      "Test verification showing the recovery email was triggered",
    ],
    operatorRequirements: ["email", "shopify"],
    stablePacketId,
  },
  EMAIL_FLOW_UPGRADE_V1: {
    packetType: "EMAIL_FLOW_UPGRADE_V1",
    taskTitle: "Upgrade checkout decision email flow",
    estimatedTime: "1-2 hours",
    basePayout: 90,
    bonusStructure: "Bonus requires manual review and measured improvement.",
    instructions: [],
    assets: [],
    qcRequirements: [
      "Screenshot proof of updated flow",
      "Test verification",
    ],
    operatorRequirements: ["email"],
    stablePacketId,
  },
  CHECKOUT_FIX_V1: {
    packetType: "CHECKOUT_FIX_V1",
    taskTitle: "Improve checkout decision conversion path",
    estimatedTime: "2-4 hours",
    basePayout: 140,
    bonusStructure: "Bonus requires manual review and verified outcome.",
    instructions: [],
    assets: [],
    qcRequirements: [
      "Screenshot proof",
      "Live link confirmation",
      "Test verification",
    ],
    operatorRequirements: ["shopify"],
    stablePacketId,
  },
};
