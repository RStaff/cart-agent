import { buildObservedCheckoutMetrics } from "@/lib/dashboard/confirmation/buildObservedCheckoutMetrics";
import { resolveConfirmationState } from "@/lib/dashboard/confirmation/resolveConfirmationState";
import type { PredictedCheckoutContext } from "@/lib/dashboard/confirmation/types";
import {
  getCheckoutEventsForShop,
  getScorecardPrediction,
  saveConfirmationSnapshot,
} from "@/lib/dashboard/storage/repository";

function stepLabelToPredictedStep(stepLabel: string | null) {
  if (stepLabel === "Cart → Checkout") return "cart_to_checkout";
  if (stepLabel === "Checkout → Payment") return "checkout_to_payment";
  if (stepLabel === "Payment → Purchase") return "payment_to_purchase";
  return null;
}

export async function refreshConfirmationStateForShop(shopDomain: string) {
  const [prediction, checkoutEvents] = await Promise.all([
    getScorecardPrediction(shopDomain),
    getCheckoutEventsForShop(shopDomain, "all"),
  ]);

  const predictedContext: PredictedCheckoutContext | null = prediction
    ? {
        predicted_step: stepLabelToPredictedStep(prediction.predictedStepLabel),
        predicted_summary: `Before install, Abando predicted that ${prediction.predictedIssuePlainEnglish.toLowerCase()}`,
        predicted_issue_label: prediction.predictedIssueLabel,
        predicted_issue_plain_english: prediction.predictedIssuePlainEnglish,
        predicted_revenue_at_risk: prediction.predictedRevenueAtRisk,
        predicted_benchmark_position: prediction.predictedBenchmarkPosition,
      }
    : null;

  const observed = buildObservedCheckoutMetrics(shopDomain, checkoutEvents);
  const resolved = resolveConfirmationState({
    predicted: predictedContext,
    observed,
    shop: shopDomain,
  });

  return saveConfirmationSnapshot({
    shopDomain,
    confirmationStatus: resolved.confirmation_status,
    confirmationStatusLabel: resolved.confirmation_status_label,
    confirmationSummary: resolved.confirmation_summary,
    strongestObservedSlowdownStep: resolved.observed_step,
    sampleSize: resolved.sample_size,
    measurementWindowLabel: resolved.measurement_window_label,
    confidenceLabel: resolved.evidence_confidence,
    confirmedRevenueImpact: resolved.confirmed_revenue_impact,
    recommendedNextAction: resolved.recommended_next_action,
    lastCalculatedAt: new Date().toISOString(),
  });
}
