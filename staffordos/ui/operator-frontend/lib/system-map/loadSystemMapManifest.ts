import fs from "fs";
import path from "path";

const REPO_ROOT = process.cwd().includes("staffordos/ui/operator-frontend")
  ? path.resolve(process.cwd(), "../../..")
  : process.cwd();

const MANIFEST_PATH = path.join(
  REPO_ROOT,
  "staffordos/system_inventory/output/system_map_ui_input_manifest_v1.json"
);

export type SystemMapUiManifest = {
  generated_at: string;
  manifest_name: string;
  purpose: string;
  inputs: Record<string, string>;
  ui_readiness: {
    ready_for_ui_binding: boolean;
    ready_for_scheduler_display: boolean;
    proof_gate_required: boolean;
  };
  system_status_summary: {
    capability_status_counts: Record<string, number>;
    proof_status_counts: Record<string, number>;
    discovery_sync_status: string;
    discovery_runner_ready_for_scheduler: boolean;
  };
  display_sections: string[];
  blockers: Array<{
    id: string;
    category: string;
    status: string;
    proof_required: string;
    blocks: string[];
  }>;
  rule: string;
};

export function loadSystemMapManifest(): SystemMapUiManifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`System Map UI manifest not found: ${MANIFEST_PATH}`);
  }

  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

export function getSystemMapManifestPath(): string {
  return MANIFEST_PATH;
}
