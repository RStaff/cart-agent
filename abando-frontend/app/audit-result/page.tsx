import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { notFound } from "next/navigation";
import AuditResultPage from "@/components/audit/AuditResultPage";

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

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "shopifixer", "proof_registry.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function cleanStoreDomain(value: string) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export default async function AuditResultRoute({
  searchParams,
}: {
  searchParams?: Promise<{ store?: string }>;
}) {
  const params = (await searchParams) || {};
  const requestedStore = cleanStoreDomain(params.store || "");

  if (!requestedStore) {
    notFound();
  }

  const rootDir = findCanonicalRoot();
  const registryPath = join(rootDir, "staffordos", "shopifixer", "proof_registry.json");

  if (!existsSync(registryPath)) {
    notFound();
  }

  const registry = readJsonFile<Record<string, AuditResultSnapshot>>(registryPath);
  const snapshot = registry[requestedStore];

  if (!snapshot) {
    notFound();
  }

  return <AuditResultPage snapshot={snapshot} />;
}
