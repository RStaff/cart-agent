import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import Link from "next/link";

type StoreBenchmarkReport = {
  storeId: string;
  store_domain: string;
  segment: string;
  issue_detected: string;
  revenue_leak_estimate: number;
  confidence: string;
  segment_average_revenue_leak: number;
  segment_top_issue: string;
  percentile_label: string;
  generated_at: string;
};

function findCanonicalRoot() {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "../.."),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "segments", "store_benchmark_reports.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

async function readBenchmarks(): Promise<StoreBenchmarkReport[]> {
  const rootDir = findCanonicalRoot();
  const reportsPath = join(rootDir, "staffordos", "segments", "store_benchmark_reports.json");

  try {
    const raw = await readFile(reportsPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default async function BenchmarkPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const benchmarks = await readBenchmarks();
  const report = benchmarks.find((entry) => entry?.storeId === storeId);

  if (!report) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-slate-900">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">Benchmark not found</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            The benchmark report you requested is not available.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/embedded"
              className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Run your own benchmark
            </Link>
            <Link
              href="/embedded"
              className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900"
            >
              Install Abando
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16 text-slate-900">
      <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Store Benchmark Report
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          {report.store_domain}
        </h1>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Segment</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{report.segment}</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Issue Detected</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{report.issue_detected}</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Revenue Leak Estimate</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatCurrency(report.revenue_leak_estimate)} / year
            </p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Confidence</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{report.confidence}</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Segment Average Revenue Leak</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatCurrency(report.segment_average_revenue_leak)} / year
            </p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Segment Top Issue</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{report.segment_top_issue}</p>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-800">Percentile Comparison</p>
          <p className="mt-2 text-lg font-semibold text-emerald-950">{report.percentile_label}</p>
        </section>

        <section className="mt-6">
          <p className="text-sm font-medium text-slate-500">Generated</p>
          <p className="mt-2 text-base text-slate-900">{report.generated_at}</p>
        </section>

        <footer className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/embedded"
            className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Run your own benchmark
          </Link>
          <Link
            href="/embedded"
            className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900"
          >
            Install Abando
          </Link>
        </footer>
      </article>
    </main>
  );
}
