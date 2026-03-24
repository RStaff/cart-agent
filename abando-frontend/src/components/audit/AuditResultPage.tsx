import Link from "next/link";

type AuditResultSnapshot = {
  store_domain: string;
  audit_score: number;
  estimated_revenue_leak: string;
  confidence: string;
  top_issue: string;
  benchmark_summary: string;
  recommended_action: string;
  updated_at: string;
};

export default function AuditResultPage({ snapshot }: { snapshot: AuditResultSnapshot }) {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.94))] p-8 shadow-2xl shadow-black/30">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">Audit Result</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Your Checkout Audit Results</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            Abando found a likely revenue leak pattern in your store and identified the most important next fix.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MetaCard label="Store Domain" value={snapshot.store_domain} />
            <MetaCard label="Audit Score" value={String(snapshot.audit_score)} />
            <MetaCard label="Updated" value={snapshot.updated_at} />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <ResultCard
            label="Revenue At Risk"
            value={snapshot.estimated_revenue_leak}
            helper="Estimated checkout revenue currently at risk based on observed patterns."
          />
          <ResultCard
            label="Top Detected Issue"
            value={snapshot.top_issue}
            helper="Highest-confidence blocker detected from the audit result."
          />
          <ResultCard
            label="Benchmark Comparison"
            value={snapshot.benchmark_summary}
            helper="How your store compares to similar Shopify stores."
          />
          <ResultCard
            label="Confidence"
            value={snapshot.confidence}
            helper="Confidence level for the current audit conclusion."
          />
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Recommended Next Move</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{snapshot.recommended_action}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Abando can help monitor, validate, and improve this issue over time.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Why this matters</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Bullet text="Checkout friction compounds fast, especially on mobile and low-intent sessions." />
            <Bullet text="Small conversion losses can create meaningful revenue leakage over a month." />
            <Bullet text="Benchmark context helps you prioritize the issue with the highest likely upside." />
            <Bullet text="Acting on the top issue first is usually the highest-leverage move." />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-[linear-gradient(180deg,rgba(8,47,73,0.55),rgba(15,23,42,0.95))] p-8 shadow-2xl shadow-black/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Next Step</p>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link href="/dashboard" className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              View Dashboard
            </Link>
            <Link href="/shopify/install" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200">
              Install Abando
            </Link>
            <Link href="/pricing" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200">
              See Pricing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

function ResultCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-4 text-xl font-semibold leading-tight text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{helper}</p>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-7 text-slate-300">
      {text}
    </div>
  );
}
