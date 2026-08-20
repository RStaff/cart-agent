import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
export const CUSTOMER_SEMANTIC_AUTHORITY = Object.freeze(require("./customerSemanticAuthority.json"));

export function customerEvidenceFitPresentation(evidenceFit = {}) {
  const authority = CUSTOMER_SEMANTIC_AUTHORITY.EVIDENCE_COVERAGE_PERCENTAGE;
  const validCurrentValue = evidenceFit.semanticKey === authority.semanticKey && evidenceFit.status === "CURRENT" && Number.isInteger(evidenceFit.percentage) && evidenceFit.percentage >= 0 && evidenceFit.percentage <= 100;
  return {
    semanticKey: authority.semanticKey,
    label: authority.allowedLabels[0],
    value: validCurrentValue ? `${evidenceFit.percentage}%` : "—%",
    status: evidenceFit.status || "INSUFFICIENT",
    customerFacingAllowed: authority.customerFacingAllowed,
  };
}

export function matchScoreCustomerPresentation() {
  const authority = CUSTOMER_SEMANTIC_AUTHORITY.MATCH_SCORE;
  return { semanticKey: authority.semanticKey, customerFacingAllowed: authority.customerFacingAllowed, value: null };
}
