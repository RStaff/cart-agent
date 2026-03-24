import type { PublicScorecard } from "@/lib/scorecardTypes";
import { extractBenchmarkPositionPercent, merchantIssueFraming, topScorecardIssue } from "@/lib/scorecardPresentation";

export default function generateAdvisorResponse(scorecard: PublicScorecard, question: string) {
  const normalized = String(question || "").trim().toLowerCase();
  const issue = topScorecardIssue(scorecard);
  const issueFraming = merchantIssueFraming(scorecard);
  const benchmark = extractBenchmarkPositionPercent(scorecard);
  const benchmarkText =
    benchmark.percent > 0
      ? `Stores like this one are being compared against a benchmark gap, and this scorecard places the current checkout position at roughly ${benchmark.percent}%.`
      : "This scorecard is using a benchmark gap rather than installed-store telemetry.";

  if (
    normalized.includes("why this estimate") ||
    normalized.includes("is this revenue estimate real") ||
    normalized.includes("am i actually losing this money") ||
    normalized.includes("is this real revenue") ||
    normalized.includes("how do you know") ||
    normalized.includes("how accurate") ||
    normalized.includes("is this a guess")
  ) {
    return `${benchmarkText} The estimate is not trying to pretend Abando already knows your exact checkout losses. It comes from that gap plus the clearest place shoppers may be slowing down on the page: ${issue}. In plain English, ${issueFraming.toLowerCase()} Install is what turns that direction into confirmation.`;
  }

  if (normalized.includes("real revenue")) {
    return "Not yet. This page shows an estimated revenue opportunity based on benchmark patterns and the strongest issue on the scorecard. Real tracked revenue only starts after install, when Abando can observe checkout behavior on your actual store.";
  }

  if (normalized.includes("what should i fix") || normalized.includes("fix first")) {
    return `Start with ${issue}. In business terms, ${issueFraming.toLowerCase()} If that same slowdown is present in your real checkout, it is the clearest place to validate first before making broader changes.`;
  }

  if (normalized.includes("what happens if i install") || normalized.includes("what happens after install") || normalized.includes("install")) {
    return "After install, Shopify asks for approval, Abando starts the real connection flow, and dashboard setup becomes available after successful connection. Real drop-off and recovery data only begin to appear after installation is complete and your store has live activity.";
  }

  return `The main takeaway is simple: ${issueFraming} ${benchmarkText} Even if the estimate changes after install, this is still the clearest issue on the page and the best place to investigate first.`;
}
