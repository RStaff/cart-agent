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

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function detectHomepageSignalProfile(html) {
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
  const cartContextDetected = hasAny(html, [
    "cart",
    "checkout",
    "add to cart",
    "shopping bag",
    "shop pay",
    "apple pay",
  ]);
  const cartRecoveryDetected = hasAny(html, [
    "save cart",
    "recover cart",
    "cart reminder",
    "remind me later",
    "resume checkout",
    "return to cart",
  ]);
  const primaryCtaDetected = hasAny(html, [
    "add to cart",
    "shop now",
    "buy now",
    "view product",
    "checkout",
  ]);
  const trustDetected = hasAny(html, [
    "reviews",
    "returns",
    "guarantee",
    "secure checkout",
    "customer service",
    "support",
  ]);
  const shippingDetected = hasAny(html, [
    "shipping",
    "delivery",
    "returns",
    "free shipping",
    "calculated at checkout",
  ]);
  const navLinkCount = countMatches(html, /<a\b/g);
  const buttonCount = countMatches(html, /<button\b/g) + countMatches(html, /role="button"/g);
  const promoCount = countMatches(html, /sale|discount|limited|bundle|offer|free shipping/g);

  return {
    emailCaptureDetected,
    exitIntentDetected,
    cartContextDetected,
    cartRecoveryDetected,
    primaryCtaDetected,
    trustDetected,
    shippingDetected,
    navLinkCount,
    buttonCount,
    promoCount,
    excessCompetingActions: buttonCount >= 80 || promoCount >= 500,
    attentionOverload: navLinkCount >= 95 || buttonCount >= 28 || promoCount >= 180,
    navigationClutter: navLinkCount >= 220,
  };
}

function hasBenchmarkShippingEvidence(benchmark) {
  return (
    String(benchmark?.top_friction || "").toLowerCase().includes("shipping") ||
    String(benchmark?.recommended_fix || "").toLowerCase().includes("shipping") ||
    String(benchmark?.recommendation?.title || "").toLowerCase().includes("shipping")
  );
}

function buildRecommendedAction({ issues, benchmark, profile }) {
  const primary = issues[0]?.id || "";

  switch (primary) {
    case "mobile_cta_visibility":
      return "Review Mobile CTA Visibility";
    case "visual_hierarchy_competition":
      return "Clarify Primary Purchase Priority";
    case "navigation_clutter":
      return "Reduce Navigation Choice Load";
    case "excess_competing_actions":
      return "Clarify Primary Action Priority";
    case "trust_friction":
      return "Strengthen Purchase Reassurance";
    case "shipping_uncertainty":
      return "Clarify Shipping and Delivery Expectations";
    case "cart_uncertainty":
      return "Review Cart Continuity";
    case "no_email_capture":
      return "Confirm Capture Path Before Changing the Storefront";
    case "purchase_momentum_interruption":
      return "Review First Purchase-Path Interruption";
    case "low_signal_ambiguity":
      return "Review Storefront Signals Before Selecting a Fix";
    default:
      if (hasBenchmarkShippingEvidence(benchmark) && profile.shippingDetected) {
        return "Clarify Shipping and Delivery Expectations";
      }
      return "Review Storefront Friction Signals";
  }
}

function deriveHeuristicIssues({ homepage, benchmark, scorecard }) {
  const issues = [];
  const html = homepage.html || "";
  const benchmarkFriction = String(benchmark?.top_friction || "").toLowerCase();
  const profile = detectHomepageSignalProfile(html);
  const topFindings = Array.isArray(scorecard?.topFindings)
    ? scorecard.topFindings.map((item) => String(item || "").toLowerCase())
    : [];

  if (profile.shippingDetected && hasBenchmarkShippingEvidence(benchmark) && profile.navLinkCount < 180) {
    issues.push(
      buildIssue(
        "shipping_uncertainty",
        "Shipping or delivery clarity may need review",
        "Shipping or delivery language appears in the storefront context and benchmark signals point to possible late-stage hesitation.",
        "medium",
      ),
    );
  }

  if (profile.excessCompetingActions) {
    issues.push(
      buildIssue(
        "excess_competing_actions",
        "Competing action density may be high",
        "The fetched storefront markup contains enough repeated buttons or promotional cues to warrant a primary-action review.",
        "medium",
      ),
    );
  }

  if (profile.navigationClutter) {
    issues.push(
      buildIssue(
        "navigation_clutter",
        "Navigation choice load may be high",
        "The fetched storefront markup contains a high number of navigational links, which may slow the path from interest to product choice.",
        "medium",
      ),
    );
  }

  if (!profile.primaryCtaDetected && profile.navLinkCount > 20) {
    issues.push(
      buildIssue(
        "mobile_cta_visibility",
        "Primary purchase action may be hard to identify",
        "The storefront entry page does not surface a clear purchase action in the fetched markup.",
        "medium",
      ),
    );
  }

  if (profile.attentionOverload) {
    issues.push(
      buildIssue(
        "visual_hierarchy_competition",
        "Competing visual priorities detected",
        "The storefront entry page contains enough repeated links, buttons, or promotional cues to warrant a hierarchy review.",
        "medium",
      ),
    );
  }

  if (!profile.trustDetected && profile.primaryCtaDetected) {
    issues.push(
      buildIssue(
        "trust_friction",
        "Purchase reassurance may be thin near the first action",
        "The entry-page markup does not show strong review, return, support, or reassurance cues near the purchase path.",
        "medium",
      ),
    );
  }

  if (!profile.emailCaptureDetected && !profile.exitIntentDetected) {
    issues.push(
      buildIssue(
        "no_email_capture",
        "Email capture signal needs confirmation",
        "The fetched storefront entry page did not expose a clear capture path, but this can vary by device, timing, region, or scripts.",
        "low",
      ),
    );
  }

  if (
    profile.cartContextDetected &&
    !profile.cartRecoveryDetected &&
    String(benchmark?.recommendation?.title || "").toLowerCase().includes("recovery")
  ) {
    issues.push(
      buildIssue(
        "cart_uncertainty",
        "Cart continuity may need review",
        "Cart or checkout language appears in the fetched storefront context without a clear cart-save or continuity pattern.",
        "medium",
      ),
    );
  }

  if (profile.shippingDetected && hasBenchmarkShippingEvidence(benchmark)) {
    issues.push(
      buildIssue(
        "shipping_uncertainty",
        "Shipping or delivery clarity may need review",
        "Shipping or delivery language appears in the storefront context and benchmark signals point to possible late-stage hesitation.",
        "medium",
      ),
    );
  }

  const slowCheckoutDetected =
    (benchmarkFriction.includes("shipping") && profile.shippingDetected) ||
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
        Number(homepage.durationMs || 0) >= 1800 ? "high" : "medium",
      ),
    );
  }

  if (issues.length === 0 && profile.primaryCtaDetected) {
    issues.push(
      buildIssue(
        "purchase_momentum_interruption",
        "Purchase path should be reviewed manually",
        "The fetched storefront has a visible purchase path, but available signals are not strong enough to name a precise issue.",
        "low",
      ),
    );
  }

  if (issues.length === 0) {
    issues.push(
      buildIssue(
        "low_signal_ambiguity",
        "Insufficient storefront signal clarity",
        "The fetched storefront signals are too limited for a specific automated issue seed.",
        "low",
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

  const signalProfile = detectHomepageSignalProfile(homepage.html || "");
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
          recommendation: buildRecommendedAction({ issues, benchmark, profile: signalProfile }),
          benchmarkRecommendation: benchmark.recommendation?.title || null,
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
      signalProfile: {
        emailCaptureDetected: signalProfile.emailCaptureDetected,
        exitIntentDetected: signalProfile.exitIntentDetected,
        cartContextDetected: signalProfile.cartContextDetected,
        primaryCtaDetected: signalProfile.primaryCtaDetected,
        trustDetected: signalProfile.trustDetected,
        shippingDetected: signalProfile.shippingDetected,
        navLinkCount: signalProfile.navLinkCount,
        buttonCount: signalProfile.buttonCount,
        promoCount: signalProfile.promoCount,
        excessCompetingActions: signalProfile.excessCompetingActions,
      },
    },
  };
}
