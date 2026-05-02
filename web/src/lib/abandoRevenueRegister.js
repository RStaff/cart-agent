import { readFileSync, writeFileSync } from "node:fs";

export function recordRevenueProof({ repoRoot, attribution }) {
  const file = `${repoRoot}/staffordos/system_inventory/output/execution_proof_register_v1.json`;

  let data = {};
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch {}

  data.latest_abando_revenue_proof = {
    timestamp: new Date().toISOString(),
    experienceId: attribution.experienceId,
    revenue: attribution.revenue,
    status: "REVENUE_ATTRIBUTED"
  };

  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}
