import { getScorecardBySlugOrDomain } from "../../../staffordos/scorecards/askAbandoEngine.js";
import { generateCheckoutBenchmark } from "../../../checkout_benchmark_intelligence/index.js";

function normalizeStoreUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) {
    return { input: "", domain: "", origin: "", homepageUrl: "" };
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    const domain = String(url.hostname || "")
      .trim()
      .toLowerCase()
      .replace(/^www\./, "");

    return {
      input: raw,
      domain,
      origin: `${url.protocol}//${domain}`,
      homepageUrl: `${url.protocol}//${domain}/`,
    };
  } catch {
    const domain = raw
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .split("?")[0]
      .split("#")[0];

    return {
      input: raw,
      domain,
      origin: domain ? `https://${domain}` : "",
      homepageUrl: domain ? `https://${domain}/` : "",
    };
  }
}

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function buildLossRange(baseCents, issueCount) {
  const cents = Number(baseCents || 0);
  if (Number.isFinite(cents) && cents > 0) {
    const low = Math.round(cents * 0.45) / 100;
    const high = Math.round(cents * 0.95) / 100;
    return {
      low,
      high,
      display: `${currency(low)}–${currency(high)}`,
    };
  }

  const fallbackLow = Math.max(750, issueCount * 850);
  const fallbackHigh = Math.max(2250, issueCount * 2100);
  return {
    low: fallbackLow,
    high: fallbackHigh,
    display: `${currency(fallbackLow)}–${currency(fallbackHigh)}`,
  };
}

function buildIssue(id, title, detail, severity = "medium") {
  return { id, title, detail, severity };
}

function issueWeight(severity) {
  switch (severity) {
    case "high":
      return 26;
    case "medium":
      return 19;
    default:
      return 12;
  }
}

function opportunityScoreForIssues(issues) {
  const score = issues.reduce((sum, issue) => sum + issueWeight(issue.severity), 0);
  return Math.max(18, Math.min(92, score));
}

async function fetchHomepageSignals(homepageUrl) {
  if (!homepageUrl) {
    return {
      ok: false,
      fetchStatus: "missing_url",
      durationMs: null,
      html: "",
    };
  }

  const startedAt = Date.now();
  try {
    const response = await fetch(homepageUrl, {
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
      headers: {
        "user-agent": "abando-fix-audit/1.0",
      },
    });

    const html = await response.text();
    return {
      ok: response.ok,
      fetchStatus: `http_${response.status}`,
      durationMs: Date.now() - startedAt,
      html: String(html || "").toLowerCase(),
    };
  } catch (error) {
    return {
      ok: false,
      fetchStatus: error?.name === "TimeoutError" ? "timeout" : "fetch_failed",
      durationMs: Date.now() - startedAt,
      html: "",
    };
  }
}

function hasAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function deriveHeuristicIssues({ homepage, benchmark, scorecard }) {
  const issues = [];
  const html = homepage.html || "";
  const benchmarkFriction = String(benchmark?.top_friction || "").toLowerCase();
  const topFindings = Array.isArray(scorecard?.topFindings)
    ? scorecard.topFindings.map((item) => String(item || "").toLowerCase())
    : [];

  const emailCaptureDetected = hasAny(html, [
    'type="email"',
    "newsletter",
    "subscribe",
    "email signup",
    "join our list",
    "klaviyo",
    "omnisend",
    "privy",
    "sms signup",
  ]);

  if (!emailCaptureDetected) {
    issues.push(
      buildIssue(
        "no_email_capture",
        "No email capture detected",
        "We could not find a clear email capture or signup path on the storefront entry page.",
        "medium",
      ),
    );
  }

  const exitIntentDetected = hasAny(html, [
    "exit-intent",
    "exit intent",
    "klaviyo-form",
    "privy",
    "justuno",
    "wisepops",
    "spin to win",
    "spin-to-win",
    "popup",
  ]);

  if (!exitIntentDetected) {
    issues.push(
      buildIssue(
        "no_exit_intent",
        "No exit-intent capture detected",
        "We could not find a visible exit-intent or popup capture pattern on the storefront entry page.",
        "low",
      ),
    );
  }

  const cartRecoveryDetected =
    hasAny(html, [
      "save cart",
      "recover cart",
      "cart reminder",
      "remind me later",
      "resume checkout",
      "return to cart",
    ]) ||
    String(benchmark?.recommendation?.title || "").toLowerCase().includes("recovery");

  if (!cartRecoveryDetected) {
    issues.push(
      buildIssue(
        "missing_cart_recovery",
        "Missing cart recovery path",
        "We did not detect a visible cart recovery or cart-save path from the storefront entry point.",
        "high",
      ),
    );
  }

  const slowCheckoutDetected =
    benchmarkFriction.includes("shipping") ||
    topFindings.some((item) => item.includes("slow") || item.includes("handoff") || item.includes("shipping")) ||
    Number(homepage.durationMs || 0) >= 1800;

  if (slowCheckoutDetected) {
    const detail = Number(homepage.durationMs || 0) >= 1800
      ? `The storefront took about ${homepage.durationMs}ms to respond, which is enough to introduce checkout hesitation.`
      : "Existing checkout benchmark signals point to slower or higher-friction checkout handoff behavior.";

    issues.push(
      buildIssue(
        "slow_checkout_signals",
        "Slow checkout signals",
        detail,
        "high",
      ),
    );
  }

  return issues;
}

function dedupeIssues(issues) {
  const seen = new Set();
  return issues.filter((issue) => {
    if (!issue || !issue.id || seen.has(issue.id)) {
      return false;
    }
    seen.add(issue.id);
    return true;
  });
}

export async function analyzeStore(storeUrl) {
  const normalized = normalizeStoreUrl(storeUrl);
  if (!normalized.domain) {
    throw new Error("invalid_store_url");
  }

  const [scorecard, benchmark, homepage] = await Promise.all([
    Promise.resolve(getScorecardBySlugOrDomain(normalized.domain)),
    generateCheckoutBenchmark(normalized.domain).catch(() => null),
    fetchHomepageSignals(normalized.homepageUrl),
  ]);

  const issues = dedupeIssues(deriveHeuristicIssues({ homepage, benchmark, scorecard })).slice(0, 5);
  const issueCount = issues.length;
  const scorecardCents = Number(scorecard?.revenueOpportunityCents || 0);
  const benchmarkOpportunity = Number(
    benchmark?.estimated_revenue_opportunity ??
    benchmark?.estimated_monthly_revenue_opportunity ??
    0,
  );

  const baseLossCents = Math.max(
    Number.isFinite(scorecardCents) ? scorecardCents : 0,
    Number.isFinite(benchmarkOpportunity) ? benchmarkOpportunity * 100 : 0,
  );

  const estimatedLoss = buildLossRange(baseLossCents, issueCount);

  return {
    storeUrl: normalized.domain,
    issues,
    opportunityScore: opportunityScoreForIssues(issues),
    estimatedLoss,
    benchmark: benchmark
      ? {
          topFriction: benchmark.top_friction || null,
          recommendation: benchmark.recommendation?.title || null,
          fetchStatus: benchmark.fetch_status || null,
        }
      : null,
    scorecard: scorecard
      ? {
          publicUrl: scorecard.publicUrl || null,
          topFinding: scorecard.topFindings?.[0] || null,
          revenueOpportunityDisplay: scorecard.revenueOpportunityDisplay || null,
        }
      : null,
    analyzerMeta: {
      homepageFetchStatus: homepage.fetchStatus,
      homepageDurationMs: homepage.durationMs,
      source: scorecard ? "scorecard_plus_heuristic" : "heuristic_plus_benchmark",
    },
  };
}
