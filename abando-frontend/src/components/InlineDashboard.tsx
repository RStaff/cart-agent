type Stat = { label: string; value: string; sub?: string; positive?: boolean };
const stats: Stat[] = [
  { label: "Recovered revenue", value: "$12,480", sub: "+18% MoM", positive: true },
  { label: "Replies handled", value: "326", sub: "avg 4m first response", positive: true },
  { label: "Orders won", value: "189", sub: "from 1,034 contacts" },
];

const bars = [
  { label: "Email", v: 65 },
  { label: "SMS", v: 48 },
  { label: "Chat", v: 34 },
];

export default function InlineDashboard() {
  return (
    <div className="rounded-2xl border bg-white/80 p-6 shadow-sm ring-1 ring-black/5 md:p-8">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg border bg-white p-4">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold">{s.value}</div>
            {s.sub && (
              <div className={`mt-1 text-xs ${s.positive ? "text-emerald-600" : "text-slate-500"}`}>{s.sub}</div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-slate-500">Channel performance</div>
          <div className="mt-3 space-y-3">
            {bars.map(b => (
              <div key={b.label}>
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span>{b.label}</span><span>{b.v}%</span>
                </div>
                <div className="h-2 w-full rounded bg-slate-100">
                  <div className="h-2 rounded bg-brand-500" style={{ width: `${b.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-slate-500">Recent recoveries</div>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              "#10294 • $189.00 • re-engaged via email",
              "#10277 • $76.20 • recovered by SMS",
              "#10261 • $244.90 • live chat close",
            ].map((t,i)=>(
              <li key={i} className="rounded border p-2">{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
