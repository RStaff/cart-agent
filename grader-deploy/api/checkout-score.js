module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "method_not_allowed",
    });
  }

  const store = typeof req.query?.store === "string" ? req.query.store.trim() : "";
  if (!store) {
    return res.status(400).json({
      ok: false,
      error: "store_required",
    });
  }

  try {
    const { generateCheckoutBenchmark } = await import("../lib/benchmark.js");
    const { appendBenchmarkRecord } = await import("../lib/benchmark-log.js");
    const benchmark = await generateCheckoutBenchmark(store);
    const payload = {
      store: benchmark.store,
      checkout_score: benchmark.checkout_score,
      percentile: benchmark.percentile,
      tier: benchmark.tier,
      detected_signals: benchmark.detected_signals,
      missing_signals: benchmark.missing_signals,
      top_friction: benchmark.top_friction,
      estimated_revenue_opportunity: benchmark.estimated_revenue_opportunity,
      competitor_comparison: benchmark.competitor_comparison,
      recommendation: benchmark.recommendation,
      benchmark_badge: benchmark.benchmark_badge,
    };

    res.status(200).json(payload);
    void appendBenchmarkRecord(payload).catch((logError) => {
      console.error("[grader-deploy-checkout-score] benchmark log failed", logError);
    });
    return;
  } catch (error) {
    console.error("[grader-deploy-checkout-score] failed", error);
    return res.status(500).json({
      ok: false,
      error: "benchmark_generation_failed",
      message: String(error?.message || error),
    });
  }
};
