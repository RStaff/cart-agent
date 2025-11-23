const summaryCards = [
  {
    label: "Recovered revenue (30 days)",
    value: "$9,420",
    helper: "+27.4% vs baseline",
  },
  {
    label: "Carts monitored (24 hours)",
    value: "384",
    helper: "AI watching in real time",
  },
  {
    label: "Recovery rate",
    value: "32.8%",
    helper: "Multi-channel flows enabled",
  },
];

const segments = [
  {
    name: "High intent (checkout reached)",
    carts: "112 carts (24h)",
    rate: "41% recovery",
    flow: "Email + SMS",
  },
  {
    name: "Browse abandon (product viewed)",
    carts: "167 carts (24h)",
    rate: "19% recovery",
    flow: "Email + SMS",
  },
  {
    name: "VIP customers",
    carts: "31 carts (24h)",
    rate: "58% recovery",
    flow: "Concierge flow",
  },
];

const feed = [
  {
    id: "#A-48219",
    value: "$146.00",
    channel: "Email + SMS",
    ago: "12m ago",
    status: "Recovered",
  },
  {
    id: "#A-48203",
    value: "$89.00",
    channel: "Email",
    ago: "28m ago",
    status: "Pending",
  },
  {
    id: "#A-48177",
    value: "$312.00",
    channel: "VIP concierge",
    ago: "1h ago",
    status: "Recovered",
  },
  {
    id: "#A-48112",
    value: "$57.00",
    channel: "Email",
    ago: "2h ago",
    status: "At risk",
  },
];

export default function StatusPanel() {
  return (
    <div className="space-y-8">
      {/* Top summary row */}
      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 flex flex-col gap-1"
          >
            <p className="text-xs font-medium text-slate-400 uppercase tracking-[0.14em]">
              {card.label}
            </p>
            <p className="text-2xl font-semibold text-slate-50">
              {card.value}
            </p>
            <p className="text-xs text-emerald-400/90">{card.helper}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Segments */}
        <section className="space-y-4">
          <header className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                AI segments
              </h2>
              <p className="text-xs text-slate-400">
                How Abando groups abandoned carts for recovery.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              MODEL SNAPSHOT
            </span>
          </header>

          <div className="space-y-3">
            {segments.map((segment) => (
              <div
                key={segment.name}
                className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
              >
                <p className="text-xs font-semibold text-slate-300">
                  {segment.name}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{segment.carts}</span>
                  <span>{segment.rate}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Flow: <span className="text-slate-300">{segment.flow}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Live feed */}
        <section className="space-y-4">
          <header className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Live recovery feed
              </h2>
              <p className="text-xs text-slate-400">
                Recent carts Abando is trying to save.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-emerald-500/60 bg-emerald-500/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-300">
              LIVE MOCK DATA
            </span>
          </header>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80">
                <tr className="text-xs text-slate-400">
                  <th className="px-4 py-2 text-left font-medium">Cart</th>
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                  <th className="px-4 py-2 text-left font-medium">Channel</th>
                  <th className="px-4 py-2 text-left font-medium">Seen</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {feed.map((row) => (
                  <tr key={row.id} className="text-slate-200">
                    <td className="px-4 py-2 text-xs font-mono">
                      {row.id}
                    </td>
                    <td className="px-4 py-2 text-xs">{row.value}</td>
                    <td className="px-4 py-2 text-xs text-slate-300">
                      {row.channel}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-400">
                      {row.ago}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className={
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] " +
                          (row.status === "Recovered"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/50"
                            : row.status === "At risk"
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/50"
                            : "bg-slate-700/40 text-slate-200 border border-slate-600/60")
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-500">
            This view is currently powered by{" "}
            <span className="text-slate-300">sample data</span> to keep the
            demo fast. In production it will stream from your Shopify store via
            the cart-agent backend.
          </p>
        </section>
      </div>
    </div>
  );
}
