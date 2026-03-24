import { validateRevenueGate } from "../revenue/revenue_gate.js";

export function checkPaymentGate(opportunity = {}) {
  const revenueGate = validateRevenueGate(opportunity);

  return {
    valid: revenueGate.approved,
    paymentModel: revenueGate.paymentModel,
    estimatedClientValue: revenueGate.estimatedRevenueImpact,
    agreed: revenueGate.agreed,
    reason: revenueGate.approved ? "PAYMENT_CONFIRMED" : "BLOCKED_NO_PAYMENT",
    revenueGate,
  };
}
