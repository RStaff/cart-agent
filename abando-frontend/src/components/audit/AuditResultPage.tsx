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
  evidence_summary: string;
  screenshot_url?: string;
};

function cleanStoreDomain(value: string) {
  return String(value || "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .trim();
}

export default function AuditResultPage({ snapshot }: { snapshot: AuditResultSnapshot }) {
  const storeDomain = cleanStoreDomain(snapshot.store_domain || "your-store.com");

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.94))] p-8 shadow-2xl shadow-black/30">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">ShopiFixer Audit Result</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Your Store Review</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            ShopiFixer found a likely conversion leak pattern in your store and identified the strongest next fix to test.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MetaCard label="Store Domain" value={storeDomain} />
            <MetaCard label="Audit Score" value={String(snapshot.audit_score)} />
            <MetaCard label="Updated" value={snapshot.updated_at} />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <ResultCard
            label="Revenue At Risk"
            value={snapshot.estimated_revenue_leak}
            helper="Estimated conversion opportunity currently at risk based on observed storefront and performance signals."
          />
          <ResultCard
            label="Top Detected Issue"
            value={snapshot.top_issue}
            helper="Highest-confidence friction point surfaced in this store review."
          />
          <ResultCard
            label="Benchmark Comparison"
            value={snapshot.benchmark_summary}
            helper="How this store appears to compare with similar Shopify storefronts."
          />
          <ResultCard
            label="Confidence"
            value={snapshot.confidence}
            helper="Confidence level for the current ShopiFixer conclusion."
          />
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Recommended Next Move</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{snapshot.recommended_action}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            ShopiFixer is built to surface the first high-leverage fix, so you can act on the clearest issue instead of guessing.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MetaCard label="Top Issue" value={snapshot.top_issue} />
            <MetaCard label="Estimated Upside" value={snapshot.estimated_revenue_leak} />
            <MetaCard label="Evidence" value={snapshot.evidence_summary || "No performance evidence captured yet."} />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Evidence behind this read</p>
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <p className="text-sm leading-7 text-slate-300">{snapshot.evidence_summary}</p>
          </div>

          {snapshot.screenshot_url ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
              <div className="border-b border-slate-800 px-5 py-3">
                <p className="text-sm font-medium text-slate-200">Screenshot-backed proof</p>
                <p className="mt-1 text-xs leading-6 text-slate-400">
                  Public storefront screenshot captured during the audit flow to support the read.
                </p>
              </div>
              <img
                src={snapshot.screenshot_url}
                alt={`Screenshot proof for ${storeDomain}`}
                className="block w-full"
              />
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Why this matters</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Bullet text="Checkout and storefront friction compound quickly, especially on mobile." />
            <Bullet text="Even modest conversion leakage can turn into meaningful missed revenue." />
            <Bullet text="Benchmark context helps prioritize what to fix first." />
            <Bullet text="The highest-leverage move is usually the first clear blocker, not a full redesign." />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-[linear-gradient(180deg,rgba(8,47,73,0.55),rgba(15,23,42,0.95))] p-8 shadow-2xl shadow-black/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Next Step</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Want the first fixes prioritized for your store?</h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            ShopiFixer is a service. If this read looks directionally right, the next step is a direct review and prioritized fix plan for your store.
          </p>
          <div className="mt-5 flex flex-wrap gap-4">
            <a
              href={`mailto:support@staffordmedia.ai?subject=${encodeURIComponent(`ShopiFixer review for ${storeDomain}`)}&body=${encodeURIComponent(`Store: ${storeDomain}

I reviewed the ShopiFixer audit page and want the prioritized first fixes for this store.`)}`}
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Request My First Fixes
            </a>
            <Link
              href={`/shopifixer?store=${encodeURIComponent(storeDomain)}`}
              className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200"
            >
              Re-run This Review
            </Link>
            <a
              href={`mailto:support@staffordmedia.ai?subject=${encodeURIComponent(`Question about ${storeDomain}`)}&body=${encodeURIComponent(`Store: ${storeDomain}

I have a question about the ShopiFixer audit result.`)}`}
              className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200"
            >
              Ask a Question
            </a>
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
