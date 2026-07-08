import fs from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { loadCommandCenterQaReport } from "../../lib/operator/loadCommandCenterQaReport";
import { loadExecutionLog } from "../../lib/operator/loadExecutionLog";
import { loadPreflightReport } from "../../lib/operator/loadPreflightReport";
import { OperatorShell } from "../../components/operator/OperatorShell";

type CampaignAttributionReport = {
  total_leads?: number;
  attributed_leads?: number;
};

const VALIDATION_PATHS = {
  preflight: "preflight/output/preflight_report_v1.json",
  qa: "qa/output/command_center_primary_action_qa_v1.json",
} as const;

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "staffordos/campaigns/campaign_registry_v1.json"))) return cwd;

  const fromFrontend = path.resolve(cwd, "../../..");
  if (fs.existsSync(path.join(fromFrontend, "staffordos/campaigns/campaign_registry_v1.json"))) {
    return fromFrontend;
  }

  return fromFrontend;
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function statusValue(value: unknown, fallback = "Not Yet Implemented") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

export default function OperatorLayout({ children }: { children: ReactNode }) {
  const repoRoot = resolveRepoRoot();
  const preflightReport = loadPreflightReport();
  const qaReport = loadCommandCenterQaReport();
  const executionLog = loadExecutionLog();
  const campaignRegistry = readJson<{ items?: unknown[] }>(
    path.join(repoRoot, "staffordos/campaigns/campaign_registry_v1.json"),
    {}
  );
  const campaignAttributionReport = readJson<CampaignAttributionReport>(
    path.join(repoRoot, "staffordos/qa/output/campaign_attribution_report_v1.json"),
    {}
  );

  const campaignRegistryCount = Array.isArray(campaignRegistry.items) ? campaignRegistry.items.length : 0;
  const totalLeads = Number(campaignAttributionReport.total_leads ?? 0);
  const attributedLeads = Number(campaignAttributionReport.attributed_leads ?? 0);
  const campaignRegistryStatus = campaignRegistryCount > 0
    ? `Implemented · ${campaignRegistryCount} records`
    : "Not Yet Implemented";
  const campaignAttributionStatus = totalLeads > 0
    ? `Implemented · ${attributedLeads}/${totalLeads} attributed`
    : "Not Yet Implemented";
  const preflightPath = path.join(repoRoot, VALIDATION_PATHS.preflight);
  const qaPath = path.join(repoRoot, VALIDATION_PATHS.qa);
  const validationStatusParts = [
    fs.existsSync(preflightPath)
      ? `preflight: ${statusValue(preflightReport?.status, "Not Yet Implemented")}`
      : `Missing: ${VALIDATION_PATHS.preflight}`,
    fs.existsSync(qaPath)
      ? `qa: ${statusValue(qaReport?.verdict, "Not Yet Implemented")}`
      : `Missing: ${VALIDATION_PATHS.qa}`,
  ];
  const validationStatus = validationStatusParts.join(" / ");
  const systemHealthStatus = Array.isArray(executionLog.executionEvents) && executionLog.executionEvents.length
    ? `Live · ${executionLog.executionEvents.length} events`
    : "Not Yet Implemented";

  return (
    <OperatorShell
      status={{
        architectureVersion: "Version 1",
        validationStatus,
        campaignRegistryStatus,
        campaignAttributionStatus,
        systemHealthStatus,
      }}
    >
      {children}
    </OperatorShell>
  );
}
