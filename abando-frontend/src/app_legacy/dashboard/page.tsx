import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import MerchantDashboard from "@/components/dashboard/MerchantDashboard";

type MerchantSnapshot = {
  store_domain: string;
  audit_score: number;
  estimated_revenue_leak: string;
  confidence: string;
  top_issue: string;
  benchmark_summary: string;
  recommended_action: string;
  latest_signal: {
    title: string;
    timestamp: string;
    summary: string;
  };
  updated_at: string;
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "dashboard", "merchant_dashboard_snapshot.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function readSnapshot(filePath: string): MerchantSnapshot {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as MerchantSnapshot;
  } catch {
    return {
      store_domain: "example.myshopify.com",
      audit_score: 74,
      estimated_revenue_leak: "$12,400 / month",
      confidence: "High confidence",
      top_issue: "Mobile checkout friction",
      benchmark_summary:
        "You are behind similar Shopify stores on checkout completion. Stores in your segment recover ~18% of abandoned carts when optimized.",
      recommended_action:
        "Reduce mobile checkout friction and enable a stronger abandoned checkout recovery flow this week.",
      latest_signal: {
        title: "Checkout recovery opportunity is rising",
        timestamp: "",
        summary:
          "Recent audit signals show shoppers are dropping before payment completion, with mobile checkout friction remaining the highest-confidence blocker.",
      },
      updated_at: "",
    };
  }
}

export default function DashboardPage() {
  const rootDir = findCanonicalRoot();
  const snapshot = readSnapshot(join(rootDir, "staffordos", "dashboard", "merchant_dashboard_snapshot.json"));

  return <MerchantDashboard snapshot={snapshot} />;
}
