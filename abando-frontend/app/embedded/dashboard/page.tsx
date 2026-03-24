import { EmbeddedAdminTitleBar } from "@/components/EmbeddedAdminTitleBar";
import DashboardWorkspace from "@/components/dashboard/DashboardWorkspace";
import { buildDashboardData } from "@/components/dashboard/buildDashboardData";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmbeddedDashboardPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const dashboard = await buildDashboardData(params);

  return (
    <>
      <EmbeddedAdminTitleBar title="Abando Dashboard" />
      <main className="min-h-screen bg-[#f6f6f7] text-slate-950">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
          {dashboard.connected && dashboard.source === "shopify_callback" ? (
            <section className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-cyan-900">
              <p className="text-sm font-semibold">Shopify connection completed</p>
              <p className="mt-1 text-sm leading-7">
                <span className="font-medium text-slate-950">{dashboard.data.shop}</span> is connected. Tracking is awaiting live store activity.
              </p>
            </section>
          ) : null}
          <DashboardWorkspace
            data={dashboard.data}
            connectionLabel={dashboard.connectionLabel}
            trackingLabel={dashboard.trackingLabel}
            kpiTrackingLabel={dashboard.kpiTrackingLabel}
            openShopifyHref={dashboard.openShopifyHref}
            embedded
          />
        </div>
      </main>
    </>
  );
}
