import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadDashboardSnapshot() {
  const path = resolve(process.cwd(), "../../clients/operator_dashboard_snapshot_v1.json");
  return JSON.parse(readFileSync(path, "utf8"));
}
