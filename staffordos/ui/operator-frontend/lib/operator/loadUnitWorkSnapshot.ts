import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadUnitWorkSnapshot() {
  const path = resolve(process.cwd(), "../../snapshots/unit_work_snapshot_v1.json");
  return JSON.parse(readFileSync(path, "utf8"));
}
