import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/brand/PublicHeader";

export const dynamic = "force-dynamic";

type AuditResultSnapshot = {
  store_domain: string;
  audit_score: number;
  estimated_revenue_leak: string;
  confidence: string;
  top_issue: string;
  benchmark_summary: string;
  fix_recommendation?: string;
  recommended_action?: string;
  proof_plan?: string[] | string;
  updated_at: string;
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "audit", "audit_result_surface.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function readSnapshot(filePath: string): AuditResultSnapshot {
  return JSON.parse(readFileSync(filePath, "utf8")) as AuditResultSnapshot;
}

export default function AuditResultRoute() {
  const rootDir = findCanonicalRoot();
  const snapshotPath = join(rootDir, "staffordos", "audit", "audit_result_surface.json");

  if (!existsSync(snapshotPath)) {
    notFound();
  }

  const snapshot = readSnapshot(snapshotPath);
  const fixRecommendation =
    snapshot.fix_recommendation || snapshot.recommended_action || "Fix recommendation unavailable";
  const proofPlan = Array.isArray(snapshot.proof_plan)
    ? snapshot.proof_plan
    : snapshot.proof_plan
      ? [snapshot.proof_plan]
      : [];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <PublicHeader />

        <section className="rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.94))] p-8 shadow-2xl shadow-black/30">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">ShopiFixer audit result</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Your checkout audit is ready for a fix recommendation</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            This result shows the strongest issue the audit surfaced and prepares you to compare it against the ShopiFixer Fix Sprint before deciding on the next step.
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Recommended next move</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{fixRecommendation}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            The audit result is the bridge into the ShopiFixer decision. Use it to decide whether a scoped fix sprint is the right next step for this store.
          </p>
          {proofPlan.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {proofPlan.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Next step</p>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link href="/pricing" className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              See the $950 Fix Sprint
            </Link>
            <Link href="/shopifixer" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200">
              Review the ShopiFixer offer
            </Link>
            <Link href="/install/shopify" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200">
              Explore Abando later
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
