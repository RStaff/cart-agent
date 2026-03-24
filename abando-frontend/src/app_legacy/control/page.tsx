import { getCommandCenterData } from "@/lib/commandCenter";

export const metadata = {
  title: "Abando Command Center",
  description: "Operator dashboard for business, pipeline health, reliability, and market intelligence.",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusPill({ status }: { status: "GREEN" | "YELLOW" | "RED" }) {
  const styles =
    status === "GREEN"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "YELLOW"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${styles}`}>
      {status}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

export default async function ControlPage() {
  const data = await getCommandCenterData();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Abando Command Center
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Single-screen operator view
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Business performance, pipeline health, reliability, and market intelligence in one place.
              </p>
            </div>
            <StatusPill status={data.operator_status} />
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Business Overview</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Current MRR" value={formatCurrency(data.business.current_mrr)} />
            <MetricCard label="Projected 30 day MRR" value={formatCurrency(data.business.projected_30_day_mrr)} />
            <MetricCard label="Installs today" value={data.business.installs_today} />
            <MetricCard label="Revenue at risk today" value={formatCurrency(data.business.revenue_at_risk_today)} />
            <MetricCard label="Revenue saved 30d" value={formatCurrency(data.business.revenue_saved_30d)} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Pipeline Health</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <MetricCard label="Discovered store pool" value={data.pipeline.discovered_store_pool_size} />
              <MetricCard label="Verified Shopify count" value={data.pipeline.verified_shopify_count} />
              <MetricCard label="Scan queue depth" value={data.pipeline.scan_queue_depth} />
              <MetricCard label="Scans completed today" value={data.pipeline.scans_completed_today} />
              <MetricCard label="Reports generated" value={data.pipeline.reports_generated} />
              <MetricCard label="Outreach packets ready" value={data.pipeline.outreach_packets_ready} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Reliability / Ops</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <MetricCard label="Failed scans" value={data.reliability.failed_scans} />
              <MetricCard label="Retry backlog" value={data.reliability.retry_backlog} />
              <MetricCard label="Billing failures" value={data.reliability.billing_failures} />
              <MetricCard label="Embedded app status" value={data.reliability.embedded_app_status} />
              <MetricCard label="Queue status" value={data.reliability.queue_status} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Market Intelligence</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <MetricCard label="Top checkout issue" value={data.market.top_checkout_issue || "Unavailable"} />
              <MetricCard
                label="Average revenue leak yearly"
                value={formatCurrency(data.market.average_revenue_leak_yearly)}
              />
              <MetricCard label="Total scanned stores" value={data.market.total_scanned_stores} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Action Panel</h2>
            <div className="mt-4 space-y-3">
              {data.actions.map((action) => (
                <div key={action} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  {action}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Data Sources</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {data.generated_from.map((source) => (
              <li key={source}>- {source}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
