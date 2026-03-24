#!/usr/bin/env node

function normalizeStore(store) {
  return String(store || "").trim().toLowerCase();
}

function normalizeScore(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeRevenueLeak(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "$0/month";
  }
  return `$${Math.max(0, Math.round(numeric)).toLocaleString("en-US")}/month`;
}

function benchmarkLabel(score) {
  if (score >= 90) return "Top 5% of Shopify checkouts";
  if (score >= 80) return "Top 15% of Shopify checkouts";
  if (score >= 70) return "Top 30% of Shopify checkouts";
  if (score >= 60) return "Below average checkout performance";
  return "High-friction checkout";
}

function fixPriority(topLeak) {
  const normalizedLeak = String(topLeak || "").trim().toLowerCase();

  if (normalizedLeak.includes("shipping")) {
    return [
      "Show shipping cost or threshold earlier on product and cart pages",
      "Reduce checkout-stage price surprise",
      "Retest conversion after shipping visibility changes",
    ];
  }

  if (normalizedLeak.includes("express") || normalizedLeak.includes("checkout")) {
    return [
      "Enable accelerated checkout options like Shop Pay or Apple Pay",
      "Reduce friction before form completion",
      "Retest mobile completion rate after checkout changes",
    ];
  }

  if (normalizedLeak.includes("discount")) {
    return [
      "Show discount incentives earlier in the cart",
      "Clarify incentive timing before checkout",
      "Retest checkout abandonment after incentive copy changes",
    ];
  }

  return [
    "Fix the highest-friction checkout step first",
    "Retest the checkout after one focused improvement",
    "Compare the updated score against the benchmark again",
  ];
}

export function generateScorecard({
  store,
  checkout_score,
  estimated_revenue_leak,
  top_issue_detected,
}) {
  const normalizedStore = normalizeStore(store);
  const score = normalizeScore(checkout_score);
  const topLeak = String(top_issue_detected || "").trim() || "unknown checkout friction";

  return {
    store: normalizedStore,
    checkout_score: score,
    estimated_revenue_leak: normalizeRevenueLeak(estimated_revenue_leak),
    top_leak: topLeak,
    industry_benchmark: benchmarkLabel(score),
    fix_priority: fixPriority(topLeak),
    generated_at: new Date().toISOString(),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const scorecard = generateScorecard({
    store: process.argv[2] || "demo.myshopify.com",
    checkout_score: process.argv[3] || 72,
    estimated_revenue_leak: process.argv[4] || 18000,
    top_issue_detected: process.argv[5] || "shipping_cost_surprise",
  });

  console.log(JSON.stringify(scorecard, null, 2));
}
