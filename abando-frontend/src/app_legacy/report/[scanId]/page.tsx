import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import Link from "next/link";

type PublicScanReport = {
  scanId: string;
  store_domain: string;
  issue_detected: string;
  revenue_leak_estimate: number;
  confidence: string;
  recommendation: string;
  scannedAt: string;
};

function findCanonicalRoot() {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "../.."),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "reports", "public_scan_reports.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

async function readReports(): Promise<PublicScanReport[]> {
  const rootDir = findCanonicalRoot();
  const reportsPath = join(rootDir, "staffordos", "reports", "public_scan_reports.json");

  try {
    const raw = await readFile(reportsPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  const reports = await readReports();
  const report = reports.find((entry) => entry?.scanId === scanId);

  if (!report) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-slate-900">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">Report not found</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            The checkout audit report you requested is not available.
          </p>
          <Link
            href="/embedded"
            className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Install Abando
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-slate-900">
      <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Checkout Audit Report
        </p>

        <div className="mt-8 space-y-6">
          <section>
            <p className="text-sm font-medium text-slate-500">Store</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{report.store_domain}</p>
          </section>

          <section>
            <p className="text-sm font-medium text-slate-500">Top Issue Detected</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{report.issue_detected}</p>
          </section>

          <section>
            <p className="text-sm font-medium text-slate-500">Estimated Revenue at Risk</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              ${Number(report.revenue_leak_estimate || 0).toLocaleString("en-US")} / year
            </p>
          </section>

          <section>
            <p className="text-sm font-medium text-slate-500">Confidence</p>
            <p className="mt-2 text-base text-slate-900">{report.confidence}</p>
          </section>

          <section>
            <p className="text-sm font-medium text-slate-500">Recommendation</p>
            <p className="mt-2 text-base leading-7 text-slate-700">{report.recommendation}</p>
          </section>

          <section>
            <p className="text-sm font-medium text-slate-500">Generated</p>
            <p className="mt-2 text-base text-slate-900">{report.scannedAt}</p>
          </section>
        </div>

        <footer className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-lg font-semibold text-slate-950">
            Run a free checkout scan for your store
          </p>
          <Link
            href="/embedded"
            className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Install Abando
          </Link>
        </footer>
      </article>
    </main>
  );
}
