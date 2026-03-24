import type { PublicScorecard } from "@/lib/scorecardTypes";

export function extractBenchmarkPositionPercent(scorecard: PublicScorecard) {
  const summary = String(scorecard.benchmarkSummary || "");
  const matched = summary.match(/roughly\s+(\d+)%/i);
  if (matched) {
    const percent = Number.parseInt(matched[1], 10);
    if (Number.isFinite(percent)) {
      return {
        percent: Math.max(0, Math.min(100, percent)),
        source: "benchmark_summary" as const,
      };
    }
  }

  if (typeof scorecard.checkoutScore === "number" && Number.isFinite(scorecard.checkoutScore)) {
    return {
      percent: Math.max(0, Math.min(100, Math.round(scorecard.checkoutScore))),
      source: "checkout_score_context" as const,
    };
  }

  return {
    percent: 0,
    source: "unavailable" as const,
  };
}

export function topScorecardIssue(scorecard: PublicScorecard) {
  return scorecard.topFindings?.[0] || "checkout slowdown";
}

export function merchantIssueFraming(scorecard: PublicScorecard) {
  const issue = topScorecardIssue(scorecard);
  const normalized = issue.toLowerCase();

  if (normalized.includes("slow mobile checkout handoff")) {
    return "Mobile shoppers may be slowing down between cart and checkout.";
  }

  if (normalized.includes("checkout friction")) {
    return "Customers may be pausing before checkout.";
  }

  if (normalized.includes("trust")) {
    return "Customers may not be seeing enough trust cues to feel comfortable finishing checkout.";
  }

  if (normalized.includes("faq")) {
    return "Customers may be leaving checkout because key questions are not answered clearly enough.";
  }

  if (normalized.includes("urgency")) {
    return "Customers may be delaying purchase because checkout urgency is too weak.";
  }

  if (normalized.includes("payment")) {
    return "Customers may be dropping off close to payment because checkout feels uncertain or too hard to finish.";
  }

  return "Customers may be pausing before they complete checkout.";
}

export function merchantIssueWhyItMatters(scorecard: PublicScorecard) {
  const issue = topScorecardIssue(scorecard).toLowerCase();

  if (issue.includes("slow mobile checkout handoff")) {
    return "If fewer mobile shoppers reach checkout, fewer of them make it far enough to finish payment.";
  }

  if (issue.includes("payment")) {
    return "If shoppers drop off close to payment, completed purchases fall quickly because they are already near the end.";
  }

  return "If fewer shoppers move cleanly into checkout, fewer purchases get completed.";
}

export function merchantIssueCheckFirst(scorecard: PublicScorecard) {
  const issue = topScorecardIssue(scorecard).toLowerCase();

  if (issue.includes("slow mobile checkout handoff")) {
    return "Checkout button visibility, mobile page speed, and whether shipping costs appear too late.";
  }

  if (issue.includes("payment")) {
    return "Payment clarity, extra form fields, and whether trust or cost surprises appear too late.";
  }

  if (issue.includes("trust")) {
    return "Trust badges, return-policy clarity, and whether key reassurance appears before payment.";
  }

  return "Checkout button clarity, the path into checkout, and anything that may be blocking shoppers before payment.";
}

export function revenueRiskTieIn(scorecard: PublicScorecard) {
  return `${scorecard.revenueOpportunityDisplay} may be at risk at this checkout step. This is still a pre-install estimate, not tracked revenue yet.`;
}
