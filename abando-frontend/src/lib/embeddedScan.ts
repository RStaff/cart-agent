import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

type LeakReport = {
  store?: string;
  checkout_url?: string;
  detected_issue?: string;
  estimated_revenue_leak_yearly?: number;
  confidence?: string;
  recommendation?: string;
};

type EvidenceSample = {
  store?: string;
  checkout_url?: string;
  detected_issue?: string;
  confidence?: string;
};

export type EmbeddedScanResult = {
  scan_status: "completed" | "not_completed";
  store: string;
  checkout_url: string | null;
  top_issue: string | null;
  estimated_revenue_leak_yearly: number | null;
  confidence: string | null;
  recommendation: string | null;
  generated_at: string | null;
  sample_store: string | null;
};

function normalizeDomain(value: string | null | undefined) {
  const input = String(value || "").trim();
  if (!input) {
    return "";
  }

  try {
    const url = new URL(input.includes("://") ? input : `https://${input}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return input.toLowerCase().replace(/^www\./, "");
  }
}

function findCanonicalRoot() {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "../.."),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "reports", "leak_reports.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

async function readJsonFile<T>(path: string, fallbackValue: T): Promise<T> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallbackValue;
  }
}

async function readGeneratedAt(path: string) {
  try {
    const fileStat = await stat(path);
    return fileStat.mtime.toISOString();
  } catch {
    return null;
  }
}

export async function getEmbeddedScanResult(store?: string | null, sample = false): Promise<EmbeddedScanResult> {
  const rootDir = findCanonicalRoot();
  const reportsPath = join(rootDir, "staffordos", "reports", "leak_reports.json");
  const evidencePath = join(rootDir, "staffordos", "scan", "evidence_samples.json");
  const reports = await readJsonFile<LeakReport[]>(reportsPath, []);
  const evidence = await readJsonFile<EvidenceSample[]>(evidencePath, []);
  const sampleStore = normalizeDomain(reports[0]?.store);
  const normalizedStore = normalizeDomain(store);

  const targetReport = sample
    ? reports[0]
    : reports.find((report) => normalizeDomain(report?.store) === normalizedStore);
  const targetEvidence = sample
    ? evidence.find((entry) => normalizeDomain(entry?.store) === normalizeDomain(targetReport?.store))
    : evidence.find((entry) => normalizeDomain(entry?.store) === normalizedStore);

  if (!targetReport) {
    return {
      scan_status: "not_completed",
      store: normalizedStore,
      checkout_url: targetEvidence?.checkout_url || null,
      top_issue: targetEvidence?.detected_issue || null,
      estimated_revenue_leak_yearly: null,
      confidence: targetEvidence?.confidence || null,
      recommendation: null,
      generated_at: await readGeneratedAt(evidencePath),
      sample_store: sampleStore || null,
    };
  }

  return {
    scan_status: "completed",
    store: normalizeDomain(targetReport.store),
    checkout_url: targetReport.checkout_url || targetEvidence?.checkout_url || null,
    top_issue: targetReport.detected_issue || targetEvidence?.detected_issue || null,
    estimated_revenue_leak_yearly:
      typeof targetReport.estimated_revenue_leak_yearly === "number"
        ? targetReport.estimated_revenue_leak_yearly
        : null,
    confidence: targetReport.confidence || targetEvidence?.confidence || null,
    recommendation: targetReport.recommendation || null,
    generated_at: await readGeneratedAt(reportsPath),
    sample_store: sampleStore || null,
  };
}
