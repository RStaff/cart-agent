import { getPaymentAgreementByOpportunityId } from "./paymentAgreementRepository.js";

const VALID_PAYMENT_MODELS = new Set([
  "FIXED_FEE",
  "PERFORMANCE_PERCENTAGE",
  "HYBRID",
]);

function resolveAgreementInput(opportunity = {}) {
  const persisted = opportunity?.id ? getPaymentAgreementByOpportunityId(opportunity.id) : null;
  return {
    paymentModel: opportunity?.paymentModel ?? persisted?.paymentModel ?? null,
    agreed: opportunity?.agreed ?? opportunity?.paymentAgreed ?? persisted?.agreed ?? false,
    estimatedRevenueImpact:
      opportunity?.estimatedRevenueImpact
      ?? opportunity?.estimatedClientValue
      ?? opportunity?.estimatedRevenueUpside
      ?? opportunity?.revenuePotential
      ?? persisted?.estimatedClientValue
      ?? 0,
    agreementSource: persisted?.agreementSource ?? null,
    agreementRecord: persisted,
  };
}

function normalizePaymentModel(value) {
  return String(value || "").trim().toUpperCase();
}

export function validateRevenueGate(opportunity = {}) {
  const resolved = resolveAgreementInput(opportunity);
  const paymentModel = normalizePaymentModel(resolved.paymentModel);
  const agreed = resolved.agreed === true;
  const estimatedRevenueImpact = Number(resolved.estimatedRevenueImpact) || 0;

  if (!VALID_PAYMENT_MODELS.has(paymentModel)) {
    return {
      status: "BLOCKED_NO_PAYMENT_MODEL",
      approved: false,
      reason: "No payment model defined",
      paymentModel,
      estimatedRevenueImpact,
      agreed,
      agreementSource: resolved.agreementSource,
      agreementRecord: resolved.agreementRecord,
    };
  }

  if (agreed !== true) {
    return {
      status: "BLOCKED_NOT_AGREED",
      approved: false,
      reason: "Payment model exists but commitment is not agreed",
      paymentModel,
      estimatedRevenueImpact,
      agreed,
      agreementSource: resolved.agreementSource,
      agreementRecord: resolved.agreementRecord,
    };
  }

  return {
    status: "APPROVED",
    approved: true,
    reason: "Revenue gate approved",
    paymentModel,
    estimatedRevenueImpact,
    agreed,
    agreementSource: resolved.agreementSource,
    agreementRecord: resolved.agreementRecord,
  };
}
