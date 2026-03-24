import DashboardHeader from "@/components/dashboard/DashboardHeader";
import HeroStatusStrip from "@/components/dashboard/HeroStatusStrip";
import KPIGrid from "@/components/dashboard/KPIGrid";
import PredictedVsConfirmedCard from "@/components/dashboard/PredictedVsConfirmedCard";
import CheckoutFlow from "@/components/dashboard/CheckoutFlow";
import RecommendationCard from "@/components/dashboard/RecommendationCard";
import AdvisorPanel from "@/components/dashboard/AdvisorPanel";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import InstallComparison from "@/components/dashboard/InstallComparison";
import TrustFooter from "@/components/dashboard/TrustFooter";
import DevEventPoster from "@/components/dashboard/DevEventPoster";
import type { DashboardData } from "@/components/dashboard/types";

export default function DashboardWorkspace({
  data,
  connectionLabel,
  trackingLabel,
  kpiTrackingLabel,
  openShopifyHref,
  embedded = false,
  showHeader = true,
}: {
  data: DashboardData;
  connectionLabel: string;
  trackingLabel: string;
  kpiTrackingLabel: string;
  openShopifyHref: string;
  embedded?: boolean;
  showHeader?: boolean;
}) {
  const showProofBlock = process.env.NODE_ENV !== "production" && data.proof;
  const dashboardHref = data.shop
    ? `/dashboard?shop=${encodeURIComponent(data.shop)}&connected=${data.connectionStatus === "connected" ? "1" : "0"}`
    : "/dashboard";

  return (
    <div className={`flex flex-col gap-6 ${embedded ? "text-slate-950" : ""}`}>
      {embedded || !showHeader ? null : <DashboardHeader shop={data.shop} openShopifyHref={openShopifyHref} />}

      <HeroStatusStrip
        shop={data.shop}
        evidence={data.evidence}
        embedded={embedded}
      />

      <KPIGrid
        issueTitle={data.primaryIssue.title}
        estimatedAtRisk={data.revenue.estimatedAtRisk}
        trackingLabel={kpiTrackingLabel}
        evidenceConfidence={data.evidence.confidenceLabel}
        sampleWindowLabel={data.evidence.measurementWindowLabel}
        embedded={embedded}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <PredictedVsConfirmedCard evidence={data.evidence} embedded={embedded} />
          <CheckoutFlow evidence={data.evidence} embedded={embedded} />
          <RecommendationCard recommendation={data.recommendation} embedded={embedded} />
        </div>

        <div className="space-y-6">
          <AdvisorPanel issue={data.primaryIssue} recommendation={data.recommendation} embedded={embedded} />
          <ActivityFeed activity={data.activity} embedded={embedded} />
          {showProofBlock ? (
            <section
              className={`rounded-2xl p-5 ${
                embedded ? "border border-emerald-200 bg-emerald-50" : "border border-emerald-400/20 bg-emerald-400/10"
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-emerald-700" : "text-emerald-200"}`}>
                Dev proof state
              </p>
              <div className={`mt-3 space-y-2 text-sm ${embedded ? "text-slate-700" : "text-slate-200"}`}>
                <p>Latest event source: <span className="font-semibold">{data.proof?.latestEventSource || "none yet"}</span></p>
                <p>Latest event type: <span className="font-semibold">{data.proof?.latestEventType || "none yet"}</span></p>
                <p>Latest event timestamp: <span className="font-semibold">{data.proof?.latestEventTimestamp || "none yet"}</span></p>
                <p>Persisted event count: <span className="font-semibold">{data.proof?.persistedEventCount ?? 0}</span></p>
                <p>Confirmation sample size: <span className="font-semibold">{data.proof?.sampleSize ?? 0}</span></p>
              </div>
            </section>
          ) : null}
          <DevEventPoster shop={data.shop} embedded={embedded} />
          <InstallComparison embedded={embedded} />
        </div>
      </div>

      <section className="flex flex-wrap items-center gap-3">
        <a
          href={data.scorecardPath || "/run-audit"}
          className={`inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${
            embedded
              ? "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
              : "border-white/10 bg-slate-900 text-slate-100 hover:border-cyan-300 hover:text-cyan-200"
          }`}
        >
          {data.scorecardPath ? "Back to scorecard" : "Run another audit"}
        </a>
        <a
          href={dashboardHref}
          className={`inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${
            embedded
              ? "border-cyan-200 bg-cyan-50 text-cyan-800 hover:border-cyan-300"
              : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:border-cyan-300"
          }`}
        >
          View connection status
        </a>
      </section>

      <TrustFooter embedded={embedded} />
    </div>
  );
}
