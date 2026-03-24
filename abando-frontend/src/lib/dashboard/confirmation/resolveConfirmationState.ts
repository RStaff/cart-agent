import type {
  ConfirmationStatus,
  ObservedCheckoutMetrics,
  PredictedCheckoutContext,
  ResolvedConfirmationState,
} from "@/lib/dashboard/confirmation/types";

function labelForStatus(status: ConfirmationStatus) {
  if (status === "not_started") return "Not started";
  if (status === "collecting") return "Collecting live checkout signals";
  if (status === "partially_confirmed") return "Early evidence in the predicted direction";
  if (status === "confirmed") return "Confirmed by live checkout behavior";
  return "A different pattern is showing up";
}

function confidenceLabel(sampleSize: number, status: ConfirmationStatus) {
  if (status === "not_started") return "Prediction only";
  if (sampleSize < 12) return "Early read";
  if (sampleSize < 24) return "Building confidence";
  return status === "confirmed" || status === "disproven" ? "High confidence" : "Measured read";
}

export function resolveConfirmationState({
  predicted,
  observed,
  shop,
}: {
  predicted: PredictedCheckoutContext | null;
  observed: ObservedCheckoutMetrics;
  shop?: string;
}): ResolvedConfirmationState {
  const predictedStep = predicted?.predicted_step || null;

  // Resolver rules:
  // 1. No live events means the engine has not started.
  // 2. Live events with too small a sample stay in collecting.
  // 3. Enough data plus the same weakest step means partial/confirmed depending on sample depth.
  // 4. Enough data plus a different weakest step means disproven.
  // 5. No linked prediction stays in collecting even if events exist, because there is nothing truthful to compare yet.
  let status: ConfirmationStatus;

  if (observed.sample_size === 0) {
    status = "not_started";
  } else if (!predictedStep) {
    status = "collecting";
  } else if (!observed.enough_data_to_evaluate) {
    status = "collecting";
  } else if (observed.strongest_observed_slowdown_step === predictedStep) {
    status = observed.sample_size >= 24 ? "confirmed" : "partially_confirmed";
  } else {
    status = "disproven";
  }

  const confirmationSummary =
    status === "not_started"
      ? "Abando has not observed enough live checkout behavior to evaluate the original prediction yet."
      : status === "collecting"
        ? predictedStep
          ? "Abando is collecting live checkout behavior. There is not enough checkout activity yet to confirm the original prediction."
          : "Abando is collecting live checkout behavior, but there is no linked pre-install scorecard prediction to compare yet."
        : status === "partially_confirmed"
          ? "Early checkout activity suggests the original slowdown may be real. Abando is still measuring before calling this confirmed."
          : status === "confirmed"
            ? "Live checkout behavior is confirming the same slowdown the scorecard predicted. Abando now has enough evidence to treat this as a real checkout issue."
            : "Live checkout behavior is not confirming the original prediction. Abando is seeing a different checkout pattern than the scorecard predicted.";

  const recommendedNextAction =
    status === "not_started"
      ? "Let checkout activity start arriving so Abando can begin comparing the original prediction with live behavior."
      : status === "collecting"
        ? predictedStep
          ? "Allow more checkout activity so Abando can confirm whether the predicted slowdown keeps repeating."
          : "Link this connected store back to a scorecard prediction so Abando can compare the estimate with live checkout behavior."
        : status === "partially_confirmed"
          ? "Review the predicted step first, but wait for more checkout activity before treating the pattern as confirmed."
          : status === "confirmed"
            ? "Prioritize fixes at the predicted step, because live checkout behavior is now confirming that slowdown."
            : "Review the newly observed slowdown first, because live checkout behavior is pointing somewhere different from the original scorecard.";

  const supportingNotes = [
    predicted?.predicted_summary || "No linked scorecard prediction is attached yet.",
    observed.observed_summary,
    ...observed.supporting_notes,
    shop ? `Shop context: ${shop}` : "Shop context missing.",
  ];

  return {
    predicted_step: predictedStep,
    observed_step: observed.observed_step,
    predicted_summary:
      predicted?.predicted_summary ||
      "No linked scorecard prediction is attached to this dashboard state yet.",
    observed_summary: observed.observed_summary,
    confirmation_status: status,
    evidence_confidence: confidenceLabel(observed.sample_size, status),
    measurement_window_label: observed.measurement_window_label,
    sample_size: observed.sample_size,
    confirmed_revenue_impact: null,
    recommended_next_action: recommendedNextAction,
    supporting_notes: supportingNotes,
    confirmation_status_label: labelForStatus(status),
    confirmation_summary: confirmationSummary,
  };
}
