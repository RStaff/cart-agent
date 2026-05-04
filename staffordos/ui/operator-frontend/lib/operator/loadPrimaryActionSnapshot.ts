import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadPrimaryActionSnapshot() {
  const path = resolve(process.cwd(), "../../snapshots/primary_action_snapshot_v1.json");
  return JSON.parse(readFileSync(path, "utf8"));
}
