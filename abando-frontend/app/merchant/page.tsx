import { headers } from "next/headers";

type MerchantSummary = {
  status?: string;
  recoveryStatus?: string;
  eventCount?: number;
  lastEventAt?: string | null;
  lastRecoveryActionAt?: string | null;
  lastCustomerReturnAt?: string | null;
  value?: {
    recoveredRevenueCents?: number;
    recoveredRevenueLabel?: string | null;
  };
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toSingle(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] || "" : "";
}

function formatTimeAgo(value?: string | null): string | null {
  if (!value) return null;

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return null;

  const diffMs = Date.now() - timestamp.getTime();
  if (diffMs <= 0) return "just now";

  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function moneyValue(summary: MerchantSummary): string | null {
  const cents = Number(summary?.value?.recoveredRevenueCents || 0);
  if (cents > 0) {
    return summary?.value?.recoveredRevenueLabel || `$${(cents / 100).toFixed(2)}`;
  }
  return null;
}

function buildActivity(summary: MerchantSummary, recoveredLabel: string | null) {
  const items: string[] = [];

  if (summary?.lastCustomerReturnAt) {
    items.push(
      recoveredLabel
        ? `💸 You just recovered ${recoveredLabel} — ${formatTimeAgo(summary.lastCustomerReturnAt) || "just now"}`
        : `A shopper just came back — ${formatTimeAgo(summary.lastCustomerReturnAt) || "just now"}`,
    );
  }

  if (summary?.lastRecoveryActionAt) {
    items.push(`Recovery message sent — ${formatTimeAgo(summary.lastRecoveryActionAt) || "just now"}`);
  }

  if (summary?.lastEventAt) {
    items.push(`Checkout abandoned — detected ${formatTimeAgo(summary.lastEventAt) || "just now"}`);
  } else if (Number(summary?.eventCount || 0) > 0) {
    items.push("Checkout abandoned — detected");
  }

  return items.length > 0 ? items : ["No recovery activity yet"];
}

async function getSummary(shop: string): Promise<MerchantSummary> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") || incoming.get("host") || "app.abando.ai";
  const proto = incoming.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;

  const response = await fetch(
    `${origin}/api/abando/merchant-summary?shop=${encodeURIComponent(shop)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return {};
  }

  return (await response.json()) as MerchantSummary;
}

export default async function MerchantPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const shop = toSingle(params.shop) || "cart-agent-dev.myshopify.com";
  const summary = await getSummary(shop);

  const recoveredLabel = moneyValue(summary);
  const hasRecovery = Boolean(recoveredLabel || summary?.lastCustomerReturnAt);
  const lastReturnMoment = formatTimeAgo(summary?.lastCustomerReturnAt || summary?.lastRecoveryActionAt);
  const activity = buildActivity(summary, recoveredLabel);

  const primaryAction = hasRecovery
    ? {
        label: "View recovered shoppers",
        href: "#recent-activity",
      }
    : {
        label: "Send test recovery to myself",
        href: `/embedded/dashboard?shop=${encodeURIComponent(shop)}`,
      };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_34%),linear-gradient(180deg,#111827_0%,#020617_100%)] px-4 py-6 text-slate-50">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-50">Abando</div>

        <section className="rounded-[32px] border border-white/10 bg-slate-900/90 p-6 shadow-[0_28px_80px_rgba(2,6,23,0.45)]">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-amber-400">Show Me The Money</div>
          <h1 className="mt-2 max-w-[12ch] text-[clamp(40px,7vw,64px)] font-bold leading-[0.95] tracking-[-0.06em] text-slate-50">
            You are losing revenue at checkout.
          </h1>
          <p className="mt-4 max-w-[28ch] text-[clamp(19px,3.2vw,26px)] leading-[1.3] text-slate-300">
            Abando brings shoppers back automatically.
          </p>

          <section className="mt-6 rounded-[26px] border border-amber-300/20 bg-[linear-gradient(180deg,rgba(251,191,36,0.12)_0%,rgba(15,23,42,0.58)_100%)] p-5">
            <div className="text-[clamp(42px,8vw,72px)] font-bold leading-[0.95] tracking-[-0.05em] text-slate-50">
              {hasRecovery ? `${recoveredLabel || "Recovery active"}` : "No recovery yet"}
            </div>
            <div className="mt-2 text-[clamp(18px,3vw,24px)] leading-[1.3] text-amber-200">
              {hasRecovery
                ? `Last shopper returned ${lastReturnMoment || "just now"}`
                : "Turn this on to recover lost shoppers"}
            </div>
          </section>

          <section id="recent-activity" className="mt-5 rounded-[22px] border border-slate-400/10 bg-slate-950/45 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-amber-400">Recent Activity</div>
            <ul className="mt-3 grid gap-2">
              {activity.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-slate-400/10 bg-slate-900/70 px-4 py-3 text-base leading-6 text-slate-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-5 rounded-[22px] border border-slate-400/10 bg-slate-950/45 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-amber-400">How It Works</div>
            <div className="mt-3 text-lg leading-8 text-slate-200">
              Every day, shoppers leave before buying.
              <br />
              <br />
              Abando automatically brings them back using recovery messages.
              <br />
              <br />
              You only pay when it works.
            </div>
          </section>

          <section className="mt-5 rounded-[22px] border border-slate-400/10 bg-slate-950/45 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-amber-400">Take Action</div>
            <a
              href={primaryAction.href}
              className="mt-3 inline-flex w-full items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#fbbf24_0%,#f59e0b_100%)] px-5 py-4 text-lg font-extrabold tracking-[-0.02em] text-slate-950"
            >
              {primaryAction.label}
            </a>
          </section>

          <div className="mt-3 text-sm leading-6 text-slate-400">
            Works automatically once installed. No setup required.
          </div>
        </section>
      </div>
    </main>
  );
}
