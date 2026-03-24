import { getScorecardBySlugOrDomain } from "./askAbandoEngine.js";

function topIssue(scorecard) {
  return (
    scorecard?.topFindings?.[0] ||
    scorecard?.top_leak ||
    "checkout friction"
  );
}

function supportingFixes(scorecard) {
  const findings = Array.isArray(scorecard?.topFindings) ? scorecard.topFindings : [];
  const issue = String(topIssue(scorecard)).toLowerCase();

  if (issue.includes("mobile")) {
    return [
      "Test the checkout path on mobile from cart through payment.",
      "Reduce unnecessary redirects or handoff friction before checkout completion.",
      "Make sure the cart-to-checkout transition stays simple and fast.",
    ];
  }

  if (issue.includes("shipping")) {
    return [
      "Simplify the shipping step and remove avoidable choice overload.",
      "Check whether shipping information appears too late in the flow.",
      "Reduce friction between cart review and shipping selection.",
    ];
  }

  if (issue.includes("trust")) {
    return [
      "Strengthen reassurance near the purchase decision.",
      "Add clear proof points where hesitation is most likely.",
      "Make return, support, and trust information easier to see before purchase.",
    ];
  }

  if (issue.includes("pricing") || issue.includes("faq")) {
    return [
      "Clarify pricing and value before the final checkout decision.",
      "Answer the main hesitation questions before purchase.",
      "Reduce confusion between cart review and payment commitment.",
    ];
  }

  if (findings.length > 1) {
    return findings.slice(1, 4);
  }

  return [
    "Review the highest-friction step before payment.",
    "Remove unnecessary decision points between cart and checkout completion.",
    "Retest the path after one focused improvement instead of changing everything at once.",
  ];
}

function benchmarkCue(scorecard) {
  if (scorecard?.benchmarkSummary) {
    return String(scorecard.benchmarkSummary)
      .replace("This store is performing below roughly", "This store may be underperforming relative to")
      .replace("similar Shopify stores on checkout completion and recovery readiness.", "similar Shopify stores on checkout completion and recovery readiness.");
  }

  return "This scorecard suggests the store may be underperforming relative to similar Shopify stores.";
}

export function buildGuidedAudit(scorecard) {
  const slug = String(scorecard.slug || "");
  const domain = String(scorecard.domain || scorecard.store || slug);
  const issue = topIssue(scorecard);
  const opportunity = scorecard?.revenueOpportunityDisplay || "an estimated revenue opportunity";
  const fixes = supportingFixes(scorecard);
  const installPath = scorecard?.installPath || `/install/shopify?shop=${encodeURIComponent(domain)}`;

  return {
    slug,
    steps: [
      {
        id: "what_we_found",
        title: "What we found",
        body: `For ${domain}, Abando found ${opportunity} in benchmark-based checkout leakage. The strongest issue on this scorecard is ${issue}.`,
        supportingPoints: [
          benchmarkCue(scorecard),
          "This public scorecard is generated from audit and benchmark inputs, not live installed-store telemetry.",
        ],
      },
      {
        id: "why_it_matters",
        title: "Why it matters",
        body: `This matters because ${issue.toLowerCase()} can reduce checkout completion before a shopper ever finishes payment. When that happens repeatedly, the revenue gap compounds.`,
        supportingPoints: [
          "Benchmark underperformance suggests the checkout path may be leaking intent before conversion.",
          "This is still an estimate, not tracked recovered revenue.",
        ],
      },
      {
        id: "what_to_fix_first",
        title: "What to fix first",
        body: `Start with ${issue}. Based on this scorecard, that is the most likely place to reduce checkout leakage first.`,
        supportingPoints: fixes.slice(0, 4),
      },
      {
        id: "after_install",
        title: "What happens after install",
        body: "Today this page shows a generated estimate based on scorecard and benchmark logic. After Shopify is connected, Abando can begin tracking checkout decision activity and storefront recovery signals in your merchant workspace.",
        supportingPoints: [
          "Install moves the store from public estimate into real storefront tracking.",
          "That is when Abando can start reporting tracked checkout decision activity instead of only benchmark-based guidance.",
        ],
      },
    ],
    cta: {
      installLabel: "Install Abando on your Shopify store",
      installPath,
      secondaryLabel: "Ask another question",
    },
  };
}

export function buildGuidedAuditBySlugOrDomain(matchValue) {
  const scorecard = getScorecardBySlugOrDomain(matchValue);
  if (!scorecard) {
    return {
      ok: false,
      error: "scorecard_not_found",
    };
  }

  return {
    ok: true,
    guidedAudit: buildGuidedAudit(scorecard),
  };
}
