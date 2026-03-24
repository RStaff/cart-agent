import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
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
  const snapshot = readSnapshot(join(rootDir, "staffordos", "audit", "audit_result_surface.json"));
  return <AuditResultPage snapshot={snapshot} />;
}
