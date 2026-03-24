import { extractCheckoutSignals } from "./signal-extractor.js";

const COMPETITOR_REFERENCE = {
  name: "Top Shopify Brand",
  domain: "gymshark.com",
  checkout_score: 86,
};

function normalizeStoreDomain(store) {
  return String(store || "").trim().toLowerCase();
}

function deriveBenchmarkFlagsFromSignals(signals) {
  return {
    shipping_cost_surprise:
      signals.free_shipping_threshold_visible === false ||
      signals.shipping_cost_hidden === true ||
      signals.shipping_price_shown_before_checkout === false,
    missing_express_checkout: signals.guest_checkout_required === true,
    discount_timing_friction: false,
  };
}

function buildSignalEvidence(signals) {
  const signalLabels = [
    {
      active: Boolean(signals.free_shipping_threshold_visible),
      label: "Free shipping threshold visible",
    },
    {
      active: Boolean(signals.guest_checkout_allowed),
      label: "Guest checkout allowed",
    },
    {
      active: Boolean(signals.shipping_price_shown_before_checkout),
      label: "Shipping price shown before checkout",
    },
  ];

  return {
    detected_signals: signalLabels.filter((signal) => signal.active).map((signal) => signal.label),
    missing_signals: signalLabels.filter((signal) => !signal.active).map((signal) => signal.label),
  };
}

function buildScoreBreakdown(signals, flags) {
  const penalties = [];
  const baseScore = 100;

  if (signals.free_shipping_threshold_visible === false) {
    penalties.push({
      signal: "free_shipping_threshold_visible",
      applied: -10,
      reason: "Free shipping threshold is not visible early enough.",
    });
  }

  if (signals.shipping_cost_hidden === true) {
    penalties.push({
      signal: "shipping_cost_hidden",
      applied: -15,
      reason: "Shipping cost appears to be hidden before checkout.",
    });
  }

  if (signals.shipping_price_shown_before_checkout === false) {
    penalties.push({
      signal: "shipping_price_shown_before_checkout",
      applied: -15,
      reason: "Shipping price is not shown before checkout.",
    });
  }

  if (signals.guest_checkout_required === true) {
    penalties.push({
      signal: "guest_checkout_required",
      applied: -10,
      reason: "Guest checkout appears to be restricted.",
    });
  }

  if (flags.discount_timing_friction) {
    penalties.push({
      signal: "discount_timing_friction",
      applied: -8,
      reason: "Discount timing friction was detected.",
    });
  }

  const totalPenalty = penalties.reduce((sum, penalty) => sum + penalty.applied, 0);
  return {
    base_score: baseScore,
    penalties,
    final_score: Math.max(0, Math.min(100, baseScore + totalPenalty)),
  };
}

function benchmarkRankForScore(score) {
  const numericScore = Number(score) || 0;
  if (numericScore >= 90) return { percentile: 95, tier: "Elite Checkout" };
  if (numericScore >= 80) return { percentile: 80, tier: "Advanced Checkout" };
  if (numericScore >= 70) return { percentile: 60, tier: "Above Average" };
  if (numericScore >= 60) return { percentile: 40, tier: "Needs Optimization" };
  return { percentile: 20, tier: "High Friction" };
}

function benchmarkBadgeForPercentile(percentile) {
  const numericPercentile = Number(percentile) || 0;
  if (numericPercentile >= 90) return "Top 10% Shopify Checkout";
  if (numericPercentile >= 80) return "Top 20% Shopify Checkout";
  if (numericPercentile >= 60) return "Above Average Shopify Checkout";
  return "Shopify Checkout Needs Optimization";
}

function estimateMonthlyRevenueOpportunity(checkoutScore) {
  const numericScore = Math.max(0, Math.min(100, Number(checkoutScore) || 0));
  const checkoutImprovementPerScorePoint = 0.0005;
  const conversionGain = Math.max(0, (80 - numericScore) * checkoutImprovementPerScorePoint);
  const estimatedRevenue = conversionGain * 10000 * 75;
  return Math.max(0, Math.round(estimatedRevenue));
}

function topFrictionFromFlags(flags) {
  if (flags.shipping_cost_surprise) return "shipping_cost_surprise";
  if (flags.missing_express_checkout) return "missing_express_checkout";
  if (flags.discount_timing_friction) return "discount_timing_friction";
  return "none_detected";
}

function recommendedFixFromTopFriction(topFriction) {
  switch (topFriction) {
    case "shipping_cost_surprise":
      return "Display free shipping threshold earlier on product and cart pages.";
    case "missing_express_checkout":
      return "Enable Shop Pay or Apple Pay accelerated checkout.";
    case "discount_timing_friction":
      return "Surface discount incentives earlier in the cart.";
    default:
      return "Review the checkout flow and remove the highest-friction step first.";
  }
}

function recommendationFromTopFriction(topFriction) {
  if (topFriction.includes("shipping")) {
    return {
      title: "Add Shipping Cost Preview",
      description: "Show shipping cost before checkout to reduce abandonment.",
      estimated_conversion_lift: "+3–5%",
    };
  }

  if (topFriction.includes("slow")) {
    return {
      title: "Optimize Checkout Speed",
      description: "Reduce checkout load time and remove blocking scripts.",
      estimated_conversion_lift: "+2–4%",
    };
  }

  if (topFriction.includes("missing_express_checkout")) {
    return {
      title: "Enable Accelerated Checkout",
      description: "Offer Shop Pay or Apple Pay earlier so fewer buyers drop during payment.",
      estimated_conversion_lift: "+2–4%",
    };
  }

  return {
    title: "Surface the First Checkout Fix",
    description: "Address the top friction signal before making broader checkout changes.",
    estimated_conversion_lift: "+1–3%",
  };
}

export async function generateCheckoutBenchmark(store) {
  const normalizedStore = normalizeStoreDomain(store);
  const signals = await extractCheckoutSignals(normalizedStore);
  console.log("Signals detected:", signals);

  const flags = deriveBenchmarkFlagsFromSignals(signals);
  const signalEvidence = buildSignalEvidence(signals);
  const scoreBreakdown = buildScoreBreakdown(signals, flags);
  console.log("score_breakdown:", scoreBreakdown);

  const checkoutScore = scoreBreakdown.final_score;
  const benchmarkRank = benchmarkRankForScore(checkoutScore);
  const estimatedRevenueOpportunity = estimateMonthlyRevenueOpportunity(checkoutScore);
  const topFriction = topFrictionFromFlags(flags);
  const recommendation = recommendationFromTopFriction(topFriction);

  return {
    store: normalizedStore,
    fetch_status: signals.fetch_status || "unknown",
    score: checkoutScore,
    peer_average: 74,
    percentile: benchmarkRank.percentile,
    tier: benchmarkRank.tier,
    benchmark_badge: benchmarkBadgeForPercentile(benchmarkRank.percentile),
    detected_signals: signalEvidence.detected_signals,
    missing_signals: signalEvidence.missing_signals,
    top_friction: topFriction,
    recommended_fix: recommendedFixFromTopFriction(topFriction),
    estimated_conversion_lift: recommendation.estimated_conversion_lift,
    recommendation,
    estimated_monthly_revenue_opportunity: estimatedRevenueOpportunity,
    estimated_revenue_opportunity: estimatedRevenueOpportunity,
    competitor_comparison: {
      competitor_name: COMPETITOR_REFERENCE.name,
      competitor_domain: COMPETITOR_REFERENCE.domain,
      competitor_score: COMPETITOR_REFERENCE.checkout_score,
      score_gap: Math.max(0, COMPETITOR_REFERENCE.checkout_score - checkoutScore),
    },
    checkout_score: checkoutScore,
    estimated_lift: recommendation.estimated_conversion_lift,
  };
}
