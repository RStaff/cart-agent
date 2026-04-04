import path from "node:path";

export const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
export const HYGIENE_DIR = path.join(CANONICAL_ROOT, "staffordos/hygiene");
export const HYGIENE_OUTPUT_DIR = path.join(HYGIENE_DIR, "output");
export const MACHINE_ROLE_ENV_VAR = "HYGIENE_MACHINE_ROLE";
export const MACHINE_ROLES = {
  BUILD_TEST_ONLY: "BUILD_TEST_ONLY",
  DEPLOYMENT_CAPABLE: "DEPLOYMENT_CAPABLE",
};
export const LEGACY_HYGIENE_OUTPUT_RELATIVE_PATHS = new Set([
  "staffordos/operator_frontdoor/operator_frontdoor_report.md",
  "staffordos/hygiene/branch_scope_report.md",
  "staffordos/hygiene/cleanup_execution_pack_v2.md",
  "staffordos/hygiene/cleanup_execution_plan.md",
  "staffordos/hygiene/environment_inventory_v1.json",
  "staffordos/hygiene/hygiene_report_v1.json",
  "staffordos/hygiene/promotion_blocker_breakdown.md",
  "staffordos/hygiene/promotion_readiness_report.md",
  "staffordos/hygiene/promotion_readiness_report_v2.md",
  "staffordos/hygiene/worktree_cleanup_gate_report.md",
  "staffordos/hygiene/worktree_reduction_plan.md",
]);

export function getHygieneOutputPath(filename) {
  return path.join(HYGIENE_OUTPUT_DIR, filename);
}

export function normalizePath(filePath) {
  return String(filePath || "").replace(/\\/g, "/");
}

export function toRepoRelative(filePath) {
  const normalized = normalizePath(filePath);
  const root = normalizePath(CANONICAL_ROOT);
  if (normalized.startsWith(`${root}/`)) {
    return normalized.slice(root.length + 1);
  }
  return normalized;
}

export function isHygieneOutputPath(filePath) {
  const relative = toRepoRelative(filePath);
  return (
    relative === "staffordos/hygiene/output" ||
    relative.startsWith("staffordos/hygiene/output/") ||
    LEGACY_HYGIENE_OUTPUT_RELATIVE_PATHS.has(relative)
  );
}

export function resolveMachineRole(env = process.env) {
  const configured = String(env[MACHINE_ROLE_ENV_VAR] || "").trim();
  if (configured === MACHINE_ROLES.DEPLOYMENT_CAPABLE) {
    return { role: MACHINE_ROLES.DEPLOYMENT_CAPABLE, source: MACHINE_ROLE_ENV_VAR };
  }
  if (configured === MACHINE_ROLES.BUILD_TEST_ONLY) {
    return { role: MACHINE_ROLES.BUILD_TEST_ONLY, source: MACHINE_ROLE_ENV_VAR };
  }
  return { role: MACHINE_ROLES.BUILD_TEST_ONLY, source: "default" };
}
