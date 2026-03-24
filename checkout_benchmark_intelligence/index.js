import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { listSignals, listSignalsByMerchant } from "../signals/signal_registry/index.js";
import { listInterpretedSignals } from "../signal_interpreter/index.js";
import { extractCheckoutSignals } from "../checkout_signal_extractor.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");
const DEMO_MERCHANT_ID = "demo-merchant";
const COMPETITOR_REFERENCE = {
  name: "Top Shopify Brand",
  domain: "gymshark.com",
  checkout_score: 86,
};

const HEURISTIC_PEER_BASELINES = {
  apparel: { checkout_abandonment_rate: 0.28, mobile_checkout_completion_rate: 0.66 },
  beauty: { checkout_abandonment_rate: 0.24, mobile_checkout_completion_rate: 0.7 },
  home_goods: { checkout_abandonment_rate: 0.32, mobile_checkout_completion_rate: 0.61 },
  supplements: { checkout_abandonment_rate: 0.26, mobile_checkout_completion_rate: 0.68 },
  default: { checkout_abandonment_rate: 0.27, mobile_checkout_completion_rate: 0.65 },
};

const DEMO_MERCHANT_SIGNALS = [
  {
    id: "demo_sig_checkout_shipping_dropoff",
    signal_type: "checkout_shipping_dropoff",
    merchant_id: DEMO_MERCHANT_ID,
    value: 0.31,
    sample_size: 124,
    context: {
      merchant_category: "apparel",
      traffic_source: "instagram",
      device_type: "mobile",
      window: "last_30_days",
    },
    timestamp: "2026-03-12T00:00:00.000Z",
  },
  {
    id: "demo_sig_mobile_checkout_abandonment",
    signal_type: "mobile_checkout_abandonment",
    merchant_id: DEMO_MERCHANT_ID,
    value: 0.37,
    sample_size: 103,
    context: {
      merchant_category: "apparel",
      traffic_source: "instagram",
      device_type: "mobile",
      window: "last_30_days",
    },
    timestamp: "2026-03-12T00:00:00.000Z",
  },
  {
    id: "demo_sig_payment_failure_rate",
    signal_type: "payment_failure_rate",
    merchant_id: DEMO_MERCHANT_ID,
    value: 0.12,
    sample_size: 76,
    context: {
      merchant_category: "apparel",
      payment_provider: "shopify_payments",
      window: "last_30_days",
    },
    timestamp: "2026-03-12T00:00:00.000Z",
  },
];

const DEMO_INTERPRETED_SIGNALS = [
  {
    id: "interpreted__demo_sig_checkout_shipping_dropoff",
    source_signal_ids: ["demo_sig_checkout_shipping_dropoff"],
    confidence: "medium",
    impact_hint: "medium",
    frequency_hint: "high",
    created_at: "2026-03-12T23:15:07.753Z",
    interpretation_type: "checkout_friction",
    pattern_summary: "Shipping-stage checkout friction is elevated at 31.0% for merchant demo-merchant.",
    suggested_problem: "shipping_cost_transparency",
  },
  {
    id: "interpreted__demo_sig_mobile_checkout_abandonment",
    source_signal_ids: ["demo_sig_mobile_checkout_abandonment"],
    confidence: "medium",
    impact_hint: "high",
    frequency_hint: "high",
    created_at: "2026-03-12T23:15:07.757Z",
    interpretation_type: "mobile_checkout_friction",
    pattern_summary: "Mobile checkout abandonment is elevated at 37.0% for merchant demo-merchant.",
    suggested_problem: "mobile_checkout_simplification",
  },
];

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(reports) {
  await writeFile(REGISTRY_PATH, JSON.stringify(reports, null, 2) + "\n", "utf8");
}

function normalizeStoreDomain(store) {
  return String(store || "").trim().toLowerCase();
}

function deriveBenchmarkFlagsFromSignals(signals) {
  return {
    shipping_cost_surprise:
      signals.free_shipping_threshold_visible === false ||
      signals.shipping_cost_hidden === true ||
      signals.shipping_price_shown_before_checkout === false,
    missing_express_checkout:
      signals.guest_checkout_required === true,
    discount_timing_friction: false,
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
  const finalScore = Math.max(0, Math.min(100, baseScore + totalPenalty));

  return {
    base_score: baseScore,
    penalties,
    final_score: finalScore,
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
    detected_signals: signalLabels
      .filter((signal) => signal.active)
      .map((signal) => signal.label),
    missing_signals: signalLabels
      .filter((signal) => !signal.active)
      .map((signal) => signal.label),
  };
}

function benchmarkRankForScore(score) {
  const numericScore = Number(score) || 0;
  if (numericScore >= 90) {
    return { percentile: 95, tier: "Elite Checkout" };
  }
  if (numericScore >= 80) {
    return { percentile: 80, tier: "Advanced Checkout" };
  }
  if (numericScore >= 70) {
    return { percentile: 60, tier: "Above Average" };
  }
  if (numericScore >= 60) {
    return { percentile: 40, tier: "Needs Optimization" };
  }
  return { percentile: 20, tier: "High Friction" };
}

function benchmarkBadgeForPercentile(percentile) {
  const numericPercentile = Number(percentile) || 0;
  if (numericPercentile >= 90) {
    return "Top 10% Shopify Checkout";
  }
  if (numericPercentile >= 80) {
    return "Top 20% Shopify Checkout";
  }
  if (numericPercentile >= 60) {
    return "Above Average Shopify Checkout";
  }
  return "Shopify Checkout Needs Optimization";
}

function estimateMonthlyRevenueOpportunity(checkoutScore) {
  const numericScore = Math.max(0, Math.min(100, Number(checkoutScore) || 0));
  const baselineConversionRate = 0.025;
  const checkoutImprovementPerScorePoint = 0.0005;
  const conversionGain = Math.max(0, (80 - numericScore) * checkoutImprovementPerScorePoint);
  const estimatedRevenue = conversionGain * 10000 * 75;

  return {
    baseline_conversion_rate: baselineConversionRate,
    checkout_improvement_per_score_point: checkoutImprovementPerScorePoint,
    conversion_gain: Number(conversionGain.toFixed(4)),
    estimated_monthly_revenue_opportunity: Math.max(0, Math.round(estimatedRevenue)),
  };
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
      return "No clear checkout friction was detected from the current demo signals.";
  }
}

function estimatedLiftFromTopFriction(topFriction) {
  switch (topFriction) {
    case "shipping_cost_surprise":
      return "medium";
    case "missing_express_checkout":
      return "low_to_medium";
    case "discount_timing_friction":
      return "low";
    default:
      return "unknown";
  }
}

function recommendationFromTopFriction(topFriction) {
  if (String(topFriction).includes("shipping")) {
    return {
      title: "Add Shipping Cost Preview",
      description: "Show shipping cost before checkout to reduce abandonment.",
      estimated_conversion_lift: "+3–5%",
    };
  }

  if (String(topFriction).includes("slow")) {
    return {
      title: "Optimize Checkout Speed",
      description: "Reduce checkout load time and remove blocking scripts.",
      estimated_conversion_lift: "+2–4%",
    };
  }

  if (String(topFriction).includes("express") || String(topFriction).includes("checkout")) {
    return {
      title: "Enable Accelerated Checkout",
      description: "Reduce friction with faster express checkout options for returning buyers.",
      estimated_conversion_lift: "+2–3%",
    };
  }

  if (String(topFriction).includes("discount")) {
    return {
      title: "Move Discount Messaging Earlier",
      description: "Surface discount incentives earlier so shoppers do not hesitate late in checkout.",
      estimated_conversion_lift: "+1–3%",
    };
  }

  return {
    title: "Review Checkout Friction Signals",
    description: "Inspect the current benchmark signals and test the smallest checkout fix first.",
    estimated_conversion_lift: "Unknown",
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

  const topFriction = topFrictionFromFlags(flags);
  const benchmarkRank = benchmarkRankForScore(checkoutScore);
  const benchmarkBadge = benchmarkBadgeForPercentile(benchmarkRank.percentile);
  const revenueOpportunity = estimateMonthlyRevenueOpportunity(checkoutScore);
  const recommendation = recommendationFromTopFriction(topFriction);
  const competitorComparison = {
    competitor_name: COMPETITOR_REFERENCE.name,
    competitor_domain: COMPETITOR_REFERENCE.domain,
    competitor_score: COMPETITOR_REFERENCE.checkout_score,
    score_gap: COMPETITOR_REFERENCE.checkout_score - checkoutScore,
  };

  return {
    store: normalizedStore,
    fetch_status: signals.fetch_status || "unknown",
    score: checkoutScore,
    peer_average: 74,
    percentile: benchmarkRank.percentile,
    tier: benchmarkRank.tier,
    benchmark_badge: benchmarkBadge,
    detected_signals: signalEvidence.detected_signals,
    missing_signals: signalEvidence.missing_signals,
    top_friction: topFriction,
    recommended_fix: recommendedFixFromTopFriction(topFriction),
    estimated_conversion_lift: estimatedLiftFromTopFriction(topFriction),
    recommendation,
    estimated_monthly_revenue_opportunity: revenueOpportunity.estimated_monthly_revenue_opportunity,
    estimated_revenue_opportunity: revenueOpportunity.estimated_monthly_revenue_opportunity,
    competitor_comparison: competitorComparison,
    checkout_score: checkoutScore,
    estimated_lift: estimatedLiftFromTopFriction(topFriction),
  };
}

export function formatCheckoutBenchmark(report) {
  return [
    "Abando Checkout Benchmark",
    "",
    `Store: ${report.store}`,
    "",
    `Checkout Score: ${report.score ?? report.checkout_score} / 100`,
    `Peer Average: ${report.peer_average}`,
    "",
    "Top Friction Detected:",
    `${report.top_friction}`,
    "",
    "Recommended Fix:",
    `${report.recommended_fix}`,
    "",
    "Estimated Conversion Lift:",
    `${report.estimated_conversion_lift ?? report.estimated_lift}`,
  ].join("\n");
}

function average(values) {
  if (values.length === 0) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function normalizeRate(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Math.max(0, Math.min(1, Number(value)));
}

function merchantCategoryFromSignals(signals) {
  for (const signal of signals) {
    const category = signal?.context?.merchant_category;
    if (category) return String(category).trim().toLowerCase();
  }
  return "default";
}

function merchantSignalMetrics(signals) {
  const shippingDropoff = normalizeRate(
    signals.find((signal) => signal.signal_type === "checkout_shipping_dropoff")?.value,
  );
  const mobileAbandonment = normalizeRate(
    signals.find((signal) => signal.signal_type === "mobile_checkout_abandonment")?.value,
  );
  const paymentFailure = normalizeRate(
    signals.find((signal) => signal.signal_type === "payment_failure_rate")?.value,
  );

  const abandonmentInputs = [shippingDropoff, mobileAbandonment, paymentFailure].filter((value) => value !== null);
  return {
    checkout_abandonment_rate: average(abandonmentInputs),
    mobile_checkout_completion_rate:
      mobileAbandonment === null ? null : Number((1 - mobileAbandonment).toFixed(3)),
  };
}

function peerMetricsFromRealSignals(allSignals, merchantId, category) {
  const peerSignals = allSignals.filter((signal) => {
    const signalCategory = String(signal?.context?.merchant_category || "default").trim().toLowerCase();
    return signal.merchant_id !== merchantId && signalCategory === category;
  });

  if (peerSignals.length === 0) return null;

  const byMerchant = new Map();
  for (const signal of peerSignals) {
    const bucket = byMerchant.get(signal.merchant_id) || [];
    bucket.push(signal);
    byMerchant.set(signal.merchant_id, bucket);
  }

  const merchantMetrics = Array.from(byMerchant.values()).map(merchantSignalMetrics);
  const peerCheckout = average(
    merchantMetrics
      .map((metrics) => metrics.checkout_abandonment_rate)
      .filter((value) => value !== null),
  );
  const peerMobileCompletion = average(
    merchantMetrics
      .map((metrics) => metrics.mobile_checkout_completion_rate)
      .filter((value) => value !== null),
  );

  if (peerCheckout === null && peerMobileCompletion === null) return null;

  return {
    checkout_abandonment_rate: peerCheckout,
    mobile_checkout_completion_rate: peerMobileCompletion,
  };
}

function heuristicPeerMetrics(category) {
  return HEURISTIC_PEER_BASELINES[category] || HEURISTIC_PEER_BASELINES.default;
}

function merchantInterpretedSignals(interpretedSignals, merchantSignals) {
  const merchantSignalIds = new Set(merchantSignals.map((signal) => signal.id));
  return interpretedSignals.filter((signal) =>
    Array.isArray(signal.source_signal_ids) &&
    signal.source_signal_ids.some((sourceId) => merchantSignalIds.has(sourceId)),
  );
}

function rankValue(label) {
  switch (label) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function selectTopFriction(interpretedSignals) {
  if (interpretedSignals.length === 0) {
    return {
      top_likely_friction: "insufficient_signal_clarity",
      recommended_first_fix: "Capture more checkout signals before making a benchmark recommendation.",
      confidence: "low",
    };
  }

  const ranked = [...interpretedSignals].sort((a, b) => {
    const impactDiff = rankValue(b.impact_hint) - rankValue(a.impact_hint);
    if (impactDiff !== 0) return impactDiff;
    const frequencyDiff = rankValue(b.frequency_hint) - rankValue(a.frequency_hint);
    if (frequencyDiff !== 0) return frequencyDiff;
    return rankValue(b.confidence) - rankValue(a.confidence);
  });

  const top = ranked[0];
  switch (top.suggested_problem) {
    case "shipping_cost_transparency":
      return {
        top_likely_friction: "shipping_cost_transparency",
        recommended_first_fix: "Show shipping cost or threshold guidance earlier in the checkout journey.",
        confidence: top.confidence,
      };
    case "mobile_checkout_simplification":
      return {
        top_likely_friction: "mobile_checkout_friction",
        recommended_first_fix: "Simplify mobile checkout steps and reduce mobile form friction first.",
        confidence: top.confidence,
      };
    case "payment_option_optimization":
      return {
        top_likely_friction: "payment_friction",
        recommended_first_fix: "Audit payment option coverage and fallback messaging before changing broader checkout flows.",
        confidence: top.confidence,
      };
    case "sms_first_recovery_workflow":
      return {
        top_likely_friction: "recovery_channel_effectiveness",
        recommended_first_fix: "Test SMS-first recovery guidance before expanding discounting or automation.",
        confidence: top.confidence,
      };
    case "non_discount_recovery_messaging":
      return {
        top_likely_friction: "discount_dependency",
        recommended_first_fix: "Test reassurance and urgency messaging before using discounts as the default recovery lever.",
        confidence: top.confidence,
      };
    default:
      return {
        top_likely_friction: "unclassified_checkout_friction",
        recommended_first_fix: "Review the latest checkout friction signals before selecting a benchmark-based fix.",
        confidence: "low",
      };
  }
}

function buildReasoningSummary(merchantMetrics, peerMetricsSource, category, topFriction) {
  const merchantRate = merchantMetrics.checkout_abandonment_rate === null
    ? "unavailable"
    : `${(merchantMetrics.checkout_abandonment_rate * 100).toFixed(1)}%`;
  const mobileRate = merchantMetrics.mobile_checkout_completion_rate === null
    ? "unavailable"
    : `${(merchantMetrics.mobile_checkout_completion_rate * 100).toFixed(1)}%`;

  return [
    `Merchant checkout abandonment proxy is ${merchantRate} and mobile checkout completion is ${mobileRate}.`,
    `Peer comparison is based on ${peerMetricsSource} for merchant category ${category}.`,
    `Top likely friction is ${topFriction.top_likely_friction}, so the first recommended fix is ${topFriction.recommended_first_fix}`,
  ].join(" ");
}

function buildWhyThisRecommendation({
  merchantMetrics,
  peerMetrics,
  topFriction,
  peerCheckoutSource,
}) {
  const reasons = [];

  if (
    merchantMetrics.checkout_abandonment_rate !== null &&
    peerMetrics.checkout_abandonment_rate !== null &&
    merchantMetrics.checkout_abandonment_rate > peerMetrics.checkout_abandonment_rate
  ) {
    reasons.push("checkout abandonment is above the current peer baseline");
  } else if (merchantMetrics.checkout_abandonment_rate !== null) {
    reasons.push("checkout abandonment remains material enough to justify a focused checkout fix");
  }

  switch (topFriction.top_likely_friction) {
    case "shipping_cost_transparency":
      reasons.push("interpreted signals rank shipping friction highest");
      reasons.push("similar stores tend to convert better when shipping expectations are clear earlier");
      break;
    case "mobile_checkout_friction":
      reasons.push("interpreted signals rank mobile friction highest");
      reasons.push("mobile completion is lagging enough to justify a mobile-first fix");
      break;
    case "payment_friction":
      reasons.push("interpreted signals rank payment friction highest");
      reasons.push("checkout performance suggests payment options or fallback messaging need attention");
      break;
    case "recovery_channel_effectiveness":
      reasons.push("interpreted signals show one recovery channel outperforming alternatives");
      break;
    case "discount_dependency":
      reasons.push("interpreted signals show discount dependency is too high");
      break;
    default:
      reasons.push("current signals point to one clear friction theme worth testing first");
      break;
  }

  if (peerCheckoutSource === "heuristic_peer_baseline") {
    reasons.push("peer comparison is still partly heuristic in v1");
  }

  return reasons;
}

function buildRecommendedNextAction(topFriction) {
  switch (topFriction.top_likely_friction) {
    case "shipping_cost_transparency":
      return "Show the free-shipping threshold earlier on product and cart pages.";
    case "mobile_checkout_friction":
      return "Simplify the mobile checkout flow before testing broader checkout changes.";
    case "payment_friction":
      return "Add or highlight the most relevant payment options before changing other checkout steps.";
    case "recovery_channel_effectiveness":
      return "Test the strongest recovery channel first for similar checkout contexts.";
    case "discount_dependency":
      return "Test a non-discount recovery message before offering another discount.";
    default:
      return "Review the latest checkout signals and test the smallest checkout fix first.";
  }
}

async function buildCheckoutBenchmarkReport(merchantId) {
  const isDemoMerchant = merchantId === DEMO_MERCHANT_ID;
  const [merchantSignalsFromRegistry, allSignalsFromRegistry, interpretedSignalsFromRegistry] = await Promise.all([
    listSignalsByMerchant(merchantId),
    listSignals(),
    listInterpretedSignals(),
  ]);

  const merchantSignals = isDemoMerchant ? DEMO_MERCHANT_SIGNALS : merchantSignalsFromRegistry;
  const allSignals = isDemoMerchant
    ? [...allSignalsFromRegistry, ...DEMO_MERCHANT_SIGNALS]
    : allSignalsFromRegistry;
  const interpretedSignals = isDemoMerchant
    ? [...interpretedSignalsFromRegistry, ...DEMO_INTERPRETED_SIGNALS]
    : interpretedSignalsFromRegistry;

  const category = merchantCategoryFromSignals(merchantSignals);
  const merchantMetrics = merchantSignalMetrics(merchantSignals);
  const realPeerMetrics = peerMetricsFromRealSignals(allSignals, merchantId, category);
  const heuristicPeer = heuristicPeerMetrics(category);
  const peerMetrics = {
    checkout_abandonment_rate:
      realPeerMetrics?.checkout_abandonment_rate ?? heuristicPeer.checkout_abandonment_rate,
    mobile_checkout_completion_rate:
      realPeerMetrics?.mobile_checkout_completion_rate ?? heuristicPeer.mobile_checkout_completion_rate,
  };
  const peerCheckoutSource =
    realPeerMetrics?.checkout_abandonment_rate !== null && realPeerMetrics?.checkout_abandonment_rate !== undefined
      ? "real_peer_signal_average"
      : "heuristic_peer_baseline";
  const peerMobileSource =
    realPeerMetrics?.mobile_checkout_completion_rate !== null &&
    realPeerMetrics?.mobile_checkout_completion_rate !== undefined
      ? "real_peer_signal_average"
      : "heuristic_peer_baseline";
  const topFriction = selectTopFriction(merchantInterpretedSignals(interpretedSignals, merchantSignals));
  const whyThisRecommendation = buildWhyThisRecommendation({
    merchantMetrics,
    peerMetrics,
    topFriction,
    peerCheckoutSource,
  });
  const recommendedNextAction = buildRecommendedNextAction(topFriction);

  return {
    id: `checkout_benchmark_report__${merchantId}`,
    merchant_id: merchantId,
    generated_at: new Date().toISOString(),
    checkout_abandonment_rate: merchantMetrics.checkout_abandonment_rate,
    peer_checkout_abandonment_rate: peerMetrics.checkout_abandonment_rate,
    mobile_checkout_completion_rate: merchantMetrics.mobile_checkout_completion_rate,
    peer_mobile_checkout_completion_rate: peerMetrics.mobile_checkout_completion_rate,
    top_likely_friction: topFriction.top_likely_friction,
    recommended_first_fix: topFriction.recommended_first_fix,
    why_this_recommendation: whyThisRecommendation,
    recommended_next_action: recommendedNextAction,
    confidence: topFriction.confidence,
    field_sources: {
      checkout_abandonment_rate: isDemoMerchant ? "demo_seeded_signal_proxy" : "merchant_signal_derived_proxy",
      peer_checkout_abandonment_rate: peerCheckoutSource,
      mobile_checkout_completion_rate: merchantMetrics.mobile_checkout_completion_rate === null
        ? "unavailable"
        : isDemoMerchant
          ? "demo_seeded_signal_derived"
          : "merchant_signal_derived",
      peer_mobile_checkout_completion_rate: peerMobileSource,
      top_likely_friction: isDemoMerchant ? "demo_seeded_interpreted_signal" : "merchant_interpreted_signal",
      recommended_first_fix: isDemoMerchant ? "demo_seeded_interpreted_signal_mapping" : "merchant_interpreted_signal_mapping",
    },
    reasoning_summary: buildReasoningSummary(
      merchantMetrics,
      peerCheckoutSource === peerMobileSource ? peerCheckoutSource : `${peerCheckoutSource} / ${peerMobileSource}`,
      category,
      topFriction,
    ),
  };
}

export async function generateCheckoutBenchmarkReport(merchantId) {
  const report = await buildCheckoutBenchmarkReport(merchantId);
  const registry = await readRegistry();
  const filtered = registry.filter((entry) => entry.id !== report.id);
  filtered.push(report);
  await writeRegistry(filtered);
  return report;
}

export async function getLatestCheckoutBenchmarkReport(merchantId) {
  const registry = await readRegistry();
  const reports = registry
    .filter((entry) => entry.merchant_id === merchantId)
    .sort((a, b) => {
      const timeA = Date.parse(a.generated_at || "") || 0;
      const timeB = Date.parse(b.generated_at || "") || 0;
      return timeB - timeA;
    });
  return reports[0] || null;
}
