import PublicHeader from "@/components/brand/PublicHeader";
import InstallClient from "@/components/install/InstallClient";
import CenteredContainer from "@/components/layout/CenteredContainer";
import { isDemoScorecardStore } from "@/lib/scorecards";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InstallShopifyPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const shop = Array.isArray(params.shop) ? params.shop[0] : params.shop || "";
  const plan = Array.isArray(params.plan) ? params.plan[0] : params.plan || "";
  const error = Array.isArray(params.error) ? params.error[0] : params.error || "";
  const source = Array.isArray(params.source) ? params.source[0] : params.source || "";
  const connectedParam = Array.isArray(params.connected) ? params.connected[0] : params.connected || "";
  const demoScorecardShop = shop ? isDemoScorecardStore(shop) : false;
  const isConnected = connectedParam === "1" || connectedParam === "true";
  const hasShopContext = Boolean(shop);

  return (
    <CenteredContainer>
      <PublicHeader />

      <section className="space-y-4 text-center">
        {isConnected ? (
          <>
            <h1 className="text-4xl font-semibold tracking-tight text-white">Store connected</h1>
            <p className="text-base leading-7 text-slate-300">
              Abando is now listening for checkout activity
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-semibold tracking-tight text-white">Connect your store</h1>
            <p className="text-base leading-7 text-slate-300">
              Abando monitors checkout activity and creates recovery actions when customers drop off.
            </p>
          </>
        )}
      </section>

      {!isConnected && !hasShopContext ? (
        <section className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Start from Shopify</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Abando needs your Shopify store context to begin the real install flow. Open Abando from your Shopify admin or the Shopify App Store install path to continue.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Once Shopify hands off your store, Abando can connect the app and open your merchant dashboard cleanly.
          </p>
        </section>
      ) : null}

      {error === "connection_not_completed" ? (
        <section className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-5">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Connection not completed yet</h2>
          <p className="mt-3 text-sm leading-7 text-amber-50">
            Shopify approval did not complete, so Abando has not opened a dashboard for this store. Enter your real Shopify domain below to restart the connection safely.
          </p>
          {shop ? (
            <p className="mt-3 text-sm leading-7 text-amber-50/90">
              Last attempted store: <span className="font-medium text-white">{shop}</span>
            </p>
          ) : null}
        </section>
      ) : null}

      {demoScorecardShop ? (
        <section className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-5">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Demo scorecard detected</h2>
          <p className="mt-3 text-sm leading-7 text-amber-50">
            This public scorecard is a sample path for demonstration. To connect a real store, enter your actual Shopify domain below before continuing to approval.
          </p>
        </section>
      ) : null}

      <section className="rounded-xl bg-[#0f172a] p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-white">What happens next</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
          <div>1. Store connected after Shopify approval</div>
          <div>2. Checkout signals detected after live store activity begins</div>
          <div>3. Recovery trigger ready in your merchant dashboard</div>
          <div>4. Create recovery action after your first signal</div>
        </div>
        <div className="mt-5 space-y-2 text-sm text-slate-400">
          <p>Running the audit does not connect the store by itself.</p>
          <p>No changes are made without your approval.</p>
          <p>Billing is not collected on this page.</p>
          <p>Real tracking appears only after connection is complete and live activity starts arriving.</p>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-white">What Abando records</h2>
        <div className="mt-4 space-y-2 text-sm leading-7 text-slate-300">
          <p>Connection status for your Shopify store</p>
          <p>Checkout event timestamps after live activity begins</p>
          <p>Recovery action status and customer return events</p>
        </div>
        <div className="mt-5 space-y-2 text-sm text-slate-400">
          <p>Abando does not show fake recovery counts or fake recovered revenue.</p>
          <p>If Shopify approval does not finish, reopen Abando from Shopify Admin Apps and retry the connection.</p>
        </div>
      </section>

      <InstallClient
        initialShop={shop}
        initialPlan={plan}
        isDemoScorecardShop={demoScorecardShop}
        source={source}
        initialConnected={isConnected}
      />
    </CenteredContainer>
  );
}
