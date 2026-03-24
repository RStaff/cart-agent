import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

type DailyBrief = {
  projected_30_day_mrr?: number;
  average_estimated_revenue_leak_yearly?: number;
  leak_reports_count?: number;
  outreach_packets_count?: number;
  projected_installs_today?: number;
};

type VerifiedStore = {
  verified_shopify?: boolean;
};

type ScanQueueEntry = {
  status?: string;
};

type MarketBenchmarks = {
  total_scanned_stores?: number;
  summary?: {
    top_issue?: string;
  };
  top_issues?: Array<{
    issue?: string;
    average_estimated_revenue_leak_yearly?: number;
  }>;
};

type ScanStats = {
  scansToday?: number;
  merchantsMonitored?: number;
  avgScanTimeSec?: number;
};

type MerchantRegistryEntry = {
  shop?: string;
  lastScan?: string | null;
  latestResult?: {
    issue?: string;
    revenueLeakEstimate?: number;
    confidence?: number;
    scannedAt?: string;
  } | null;
};

export type CommandCenterData = {
  business: {
    current_mrr: number;
    projected_30_day_mrr: number;
    installs_today: number;
    revenue_at_risk_today: number;
    revenue_saved_30d: number;
  };
  pipeline: {
    discovered_store_pool_size: number;
    verified_shopify_count: number;
    scan_queue_depth: number;
    scans_completed_today: number;
    reports_generated: number;
    outreach_packets_ready: number;
  };
  reliability: {
    failed_scans: number;
    retry_backlog: number;
    billing_failures: number;
    embedded_app_status: string;
    queue_status: string;
  };
  market: {
    top_checkout_issue: string;
    average_revenue_leak_yearly: number;
    total_scanned_stores: number;
  };
  operator_status: "GREEN" | "YELLOW" | "RED";
  actions: string[];
  generated_from: string[];
};

function findCanonicalRoot() {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "../.."),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "briefs", "daily_brief.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

async function readJsonFile<T>(path: string, fallbackValue: T): Promise<{ exists: boolean; data: T }> {
  try {
    const raw = await readFile(path, "utf8");
    return { exists: true, data: JSON.parse(raw) as T };
  } catch {
    return { exists: false, data: fallbackValue };
  }
}

export async function getCommandCenterData(): Promise<CommandCenterData> {
  const root = findCanonicalRoot();
  const paths = {
    brief: join(root, "staffordos", "briefs", "daily_brief.json"),
    verified: join(root, "staffordos", "discovery", "verified_store_pool.json"),
    scanQueue: join(root, "staffordos", "scan", "scan_queue.json"),
    market: join(root, "staffordos", "market", "checkout_issue_benchmarks.json"),
    scanStats: join(root, "abando-backend", "scheduler", "scanStats.json"),
    merchants: join(root, "abando-backend", "scheduler", "merchantRegistry.json"),
  };

  const [brief, verified, scanQueue, market, scanStats, merchants] = await Promise.all([
    readJsonFile<DailyBrief>(paths.brief, {}),
    readJsonFile<VerifiedStore[]>(paths.verified, []),
    readJsonFile<ScanQueueEntry[]>(paths.scanQueue, []),
    readJsonFile<MarketBenchmarks>(paths.market, {}),
    readJsonFile<ScanStats>(paths.scanStats, {}),
    readJsonFile<MerchantRegistryEntry[]>(paths.merchants, []),
  ]);

  const verifiedStores = Array.isArray(verified.data) ? verified.data : [];
  const scanQueueEntries = Array.isArray(scanQueue.data) ? scanQueue.data : [];
  const merchantEntries = Array.isArray(merchants.data) ? merchants.data : [];
  const verifiedShopifyCount = verifiedStores.filter((entry) => entry?.verified_shopify === true).length;
  const reportsGenerated = Number(brief.data?.leak_reports_count || 0);
  const outreachPacketsReady = Number(brief.data?.outreach_packets_count || 0);
  const scansCompletedToday = Number(scanStats.data?.scansToday || 0);
  const installsToday = 0;
  const revenueAtRiskYearly = merchantEntries.reduce((sum, merchant) => {
    return sum + Number(merchant?.latestResult?.revenueLeakEstimate || 0);
  }, 0);
  const revenueAtRiskToday = Number((revenueAtRiskYearly / 365).toFixed(2));
  const queueStatus = scanQueue.exists
    ? scanQueueEntries.length > 0
      ? "ready"
      : "empty"
    : "missing";
  const embeddedAppStatus = brief.exists && market.exists ? "healthy" : "degraded";
  const failedScans = merchantEntries.filter(
    (merchant) => merchant?.latestResult && !merchant.latestResult.issue,
  ).length;
  const generatedFrom = Object.entries(paths)
    .filter(([key, _value]) => {
      if (key === "brief") return brief.exists;
      if (key === "verified") return verified.exists;
      if (key === "scanQueue") return scanQueue.exists;
      if (key === "market") return market.exists;
      if (key === "scanStats") return scanStats.exists;
      if (key === "merchants") return merchants.exists;
      return false;
    })
    .map(([_key, value]) => value.replace(`${root}/`, ""));

  const actions: string[] = [];
  const criticalMissing = [brief.exists, verified.exists, scanQueue.exists, market.exists, scanStats.exists, merchants.exists].some(
    (exists) => !exists,
  );

  if (!scanQueue.exists || scanQueueEntries.length === 0) {
    actions.push("Scan queue is empty or missing. Rebuild the scan queue before the next worker cycle.");
  }

  if (!market.exists || !(market.data?.top_issues || []).length) {
    actions.push("Market intelligence is missing. Regenerate checkout issue benchmarks.");
  }

  if (!verified.exists || verifiedShopifyCount === 0) {
    actions.push("No verified Shopify stores are available. Rerun discovery harvest.");
  }

  const operatorStatus: "GREEN" | "YELLOW" | "RED" = criticalMissing
    ? "RED"
    : actions.length > 0
    ? "YELLOW"
    : "GREEN";

  return {
    business: {
      current_mrr: 0,
      projected_30_day_mrr: Number(brief.data?.projected_30_day_mrr || 0),
      installs_today: installsToday,
      revenue_at_risk_today: revenueAtRiskToday,
      revenue_saved_30d: 0,
    },
    pipeline: {
      discovered_store_pool_size: verifiedStores.length,
      verified_shopify_count: verifiedShopifyCount,
      scan_queue_depth: scanQueueEntries.length,
      scans_completed_today: scansCompletedToday,
      reports_generated: reportsGenerated,
      outreach_packets_ready: outreachPacketsReady,
    },
    reliability: {
      failed_scans: failedScans,
      retry_backlog: 0,
      billing_failures: 0,
      embedded_app_status: embeddedAppStatus,
      queue_status: queueStatus,
    },
    market: {
      top_checkout_issue: String(market.data?.summary?.top_issue || ""),
      average_revenue_leak_yearly: Number(
        market.data?.top_issues?.[0]?.average_estimated_revenue_leak_yearly || 0,
      ),
      total_scanned_stores: Number(market.data?.total_scanned_stores || 0),
    },
    operator_status: operatorStatus,
    actions: actions.length > 0 ? actions : ["No operator action needed"],
    generated_from: generatedFrom,
  };
}
