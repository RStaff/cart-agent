import type {
  CheckoutStage,
  NormalizedCheckoutEvent,
  ObservedCheckoutMetrics,
  SlowdownStep,
} from "@/lib/dashboard/confirmation/types";

const STAGE_ORDER: CheckoutStage[] = ["cart", "checkout", "payment", "purchase"];

function stageIndex(stage: CheckoutStage) {
  return STAGE_ORDER.indexOf(stage);
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "not enough data yet";
  return `${Math.round(value * 100)}%`;
}

function labelForSlowdownStep(step: SlowdownStep | null) {
  if (step === "cart_to_checkout") return "Cart → Checkout";
  if (step === "checkout_to_payment") return "Checkout → Payment";
  if (step === "payment_to_purchase") return "Payment → Purchase";
  return null;
}

function buildMeasurementWindowLabel(events: NormalizedCheckoutEvent[]) {
  if (!events.length) return "No live checkout activity yet";

  const timestamps = events
    .map((event) => Date.parse(event.timestamp))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);

  if (!timestamps.length) return "Live checkout window unavailable";

  const spanDays = Math.max(1, Math.ceil((timestamps[timestamps.length - 1] - timestamps[0]) / (24 * 60 * 60 * 1000)) + 1);
  return `Last ${spanDays} day${spanDays === 1 ? "" : "s"}`;
}

export function buildObservedCheckoutMetrics(
  shop: string,
  events: NormalizedCheckoutEvent[],
): ObservedCheckoutMetrics {
  if (!events.length) {
    return {
      shop,
      measurement_window_label: "No live checkout activity yet",
      sample_size: 0,
      event_count: 0,
      counts_by_stage: {
        cart: 0,
        checkout: 0,
        payment: 0,
        purchase: 0,
      },
      cart_to_checkout_rate: null,
      checkout_to_payment_rate: null,
      payment_to_purchase_rate: null,
      mobile_share: null,
      non_mobile_share: null,
      strongest_observed_slowdown_step: null,
      enough_data_to_evaluate: false,
      observed_step: null,
      observed_summary: "Abando has not observed enough live checkout behavior yet.",
      supporting_notes: ["No normalized checkout events have been observed for this store yet."],
      seeded: false,
    };
  }

  const sessions = new Map<
    string,
    {
      highestStage: CheckoutStage;
      deviceType: string;
    }
  >();

  let seeded = false;

  for (const event of events) {
    seeded = seeded || event.source === "seeded_dev";
    const existing = sessions.get(event.session_id);
    if (!existing) {
      sessions.set(event.session_id, {
        highestStage: event.stage,
        deviceType: event.device_type,
      });
      continue;
    }

    if (stageIndex(event.stage) > stageIndex(existing.highestStage)) {
      existing.highestStage = event.stage;
    }
  }

  const countsByStage: Record<CheckoutStage, number> = {
    cart: 0,
    checkout: 0,
    payment: 0,
    purchase: 0,
  };

  let mobileSessions = 0;
  let nonMobileSessions = 0;

  for (const session of sessions.values()) {
    for (const stage of STAGE_ORDER) {
      if (stageIndex(session.highestStage) >= stageIndex(stage)) {
        countsByStage[stage] += 1;
      }
    }

    if (session.deviceType === "mobile") mobileSessions += 1;
    else nonMobileSessions += 1;
  }

  const sampleSize = sessions.size;
  const cartToCheckoutRate =
    countsByStage.cart > 0 ? countsByStage.checkout / countsByStage.cart : null;
  const checkoutToPaymentRate =
    countsByStage.checkout > 0 ? countsByStage.payment / countsByStage.checkout : null;
  const paymentToPurchaseRate =
    countsByStage.payment > 0 ? countsByStage.purchase / countsByStage.payment : null;

  const rates: Array<{ step: SlowdownStep; rate: number | null; denominator: number }> = [
    { step: "cart_to_checkout", rate: cartToCheckoutRate, denominator: countsByStage.cart },
    { step: "checkout_to_payment", rate: checkoutToPaymentRate, denominator: countsByStage.checkout },
    { step: "payment_to_purchase", rate: paymentToPurchaseRate, denominator: countsByStage.payment },
  ];

  const usableRates = rates.filter(
    (entry): entry is { step: SlowdownStep; rate: number; denominator: number } =>
      entry.rate !== null && Number.isFinite(entry.rate) && entry.denominator >= 4,
  );

  usableRates.sort((left, right) => left.rate - right.rate);
  const strongestObservedSlowdownStep = usableRates[0]?.step || null;
  const strongestObservedLabel = labelForSlowdownStep(strongestObservedSlowdownStep);
  const enoughDataToEvaluate = sampleSize >= 12 && countsByStage.checkout >= 6;

  const observedSummary =
    !sampleSize
      ? "Abando has not observed enough live checkout behavior yet."
      : !enoughDataToEvaluate
        ? `Abando is still collecting live checkout behavior. So far, ${countsByStage.checkout} of ${countsByStage.cart} tracked shoppers have reached checkout.`
        : strongestObservedLabel
          ? `Abando is currently seeing the largest slowdown between ${strongestObservedLabel}, with ${formatPercent(usableRates[0]?.rate ?? null)} of shoppers moving through that step.`
          : "Abando has live checkout behavior, but there is not enough stage coverage to identify a clear slowdown yet.";

  const supportingNotes = [
    `${countsByStage.cart} tracked shopper session${countsByStage.cart === 1 ? "" : "s"} entered cart in this measurement window.`,
    `${countsByStage.checkout} reached checkout and ${countsByStage.payment} reached payment.`,
    mobileSessions + nonMobileSessions > 0
      ? `${Math.round((mobileSessions / (mobileSessions + nonMobileSessions)) * 100)}% of tracked sessions were on mobile.`
      : "Device mix is not available yet.",
  ];

  return {
    shop,
    measurement_window_label: buildMeasurementWindowLabel(events),
    sample_size: sampleSize,
    event_count: events.length,
    counts_by_stage: countsByStage,
    cart_to_checkout_rate: cartToCheckoutRate,
    checkout_to_payment_rate: checkoutToPaymentRate,
    payment_to_purchase_rate: paymentToPurchaseRate,
    mobile_share: sampleSize ? mobileSessions / sampleSize : null,
    non_mobile_share: sampleSize ? nonMobileSessions / sampleSize : null,
    strongest_observed_slowdown_step: strongestObservedSlowdownStep,
    enough_data_to_evaluate: enoughDataToEvaluate,
    observed_step: strongestObservedLabel,
    observed_summary: observedSummary,
    supporting_notes: supportingNotes,
    seeded,
  };
}
