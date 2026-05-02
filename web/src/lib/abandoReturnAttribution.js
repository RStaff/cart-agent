import { readFileSync, writeFileSync } from "node:fs";

export async function recordReturnAttribution({ repoRoot, payload }) {
  const file = `${repoRoot}/staffordos/system_inventory/output/abando_return_log_v1.json`;

  let existing = [];
  try {
    existing = JSON.parse(readFileSync(file, "utf8"));
  } catch {}

  const entry = {
    timestamp: new Date().toISOString(),
    experienceId: payload.experienceId,
    shop: payload.shop,
    returned: true,
    revenue: payload.revenue || 0,
    currency: "USD"
  };

  existing.push(entry);

  writeFileSync(file, JSON.stringify(existing, null, 2) + "\n");

  return entry;
}
