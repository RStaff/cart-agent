export type RevenueRiskWidget = {
  revenueAtRiskToday: number;
  deltaVsYesterdayPercent: number;
  deltaLabel: string;
  topDriverIssue: string;
  confidence: string;
  lastCheckedAt: string;
  monthlyEquivalent: number;
  hasData: boolean;
};

type ScanLike = {
  scan_status?: "completed" | "not_completed";
  top_issue?: string | null;
  estimated_revenue_leak_yearly?: number | null;
  confidence?: string | null;
  generated_at?: string | null;
};

export function buildRevenueRiskWidget(scan: ScanLike | null): RevenueRiskWidget {
  const yearlyLeak =
    scan?.scan_status === "completed" && typeof scan?.estimated_revenue_leak_yearly === "number"
      ? scan.estimated_revenue_leak_yearly
      : 0;

  return {
    revenueAtRiskToday: Number((yearlyLeak / 365).toFixed(2)),
    deltaVsYesterdayPercent: 0,
    deltaLabel: "No prior baseline",
    topDriverIssue: scan?.top_issue || "No major revenue leak detected today",
    confidence: scan?.confidence || "Not available yet",
    lastCheckedAt: scan?.generated_at || "Not available yet",
    monthlyEquivalent: Number((yearlyLeak / 30).toFixed(2)),
    hasData: yearlyLeak > 0,
  };
}
