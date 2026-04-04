import fs from "node:fs";
import path from "node:path";
import { getHygieneOutputPath, resolveMachineRole } from "./runtime_support_v1.js";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const INVENTORY_PATH = getHygieneOutputPath("environment_inventory_v1.json");
const HYGIENE_REPORT_PATH = getHygieneOutputPath("hygiene_report_v1.json");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function hasDeployBlocker(hygieneReport, text) {
  return Boolean(
    Array.isArray(hygieneReport?.deploy_blockers) &&
    hygieneReport.deploy_blockers.some((entry) => String(entry).includes(text)),
  );
}

function buildInventory() {
  const hygieneReport = readJson(HYGIENE_REPORT_PATH);
  const machineRole = resolveMachineRole();
  const vercelBlocked = hasDeployBlocker(hygieneReport, "VERCEL_TOKEN");

  return {
    generated_at: new Date().toISOString(),
    inventory_version: "environment_inventory_v1",
    note: "Inventory only. This file documents current environment ownership and current known issues. It is not a new policy source.",
    machine_role: machineRole.role,
    machine_role_source: machineRole.source,
    environments: [
      {
        environment_id: "LOCAL_FRONTEND",
        canonical_url: "http://localhost:3000",
        purpose: "Operator-only frontend rehearsal for install, proof, and layout validation.",
        primary_user: "OPERATOR",
        allowed_surfaces: ["INSTALL_FLOW", "MERCHANT_DASHBOARD", "EXPERIENCE_PROOF"],
        source_of_truth_for: ["local_ui_layout", "local_cta_visibility", "operator_rehearsal"],
        not_valid_for: ["merchant_proof", "live_oauth", "delivery_execution", "production_promotion"],
        critical_dependencies: ["local Next.js frontend", "frontend environment variables", "operator browser session"],
        current_known_issues: [
          "Local frontend is not valid promotion proof for merchant experience.",
          "Historical local vs production ownership drift created confusion in merchant-facing flows.",
        ],
      },
      {
        environment_id: "LOCAL_API",
        canonical_url: "http://localhost:8081",
        purpose: "Operator-only backend validation for local APIs and forwarded webhook behavior.",
        primary_user: "OPERATOR",
        allowed_surfaces: ["API_ENDPOINTS", "WEBHOOKS"],
        source_of_truth_for: ["local_api_behavior", "local_webhook_handler_validation"],
        not_valid_for: ["merchant_proof", "live_oauth", "production_delivery_success", "production_promotion"],
        critical_dependencies: ["local backend process", "local env files", "optional webhook forwarding"],
        current_known_issues: [
          "Local API success does not prove production delivery or merchant-safe routing.",
          "Historical local/prod mismatch created environment ownership drift.",
        ],
      },
      {
        environment_id: "LOCAL_NETWORK",
        canonical_url: "http://127.0.0.1:8081",
        purpose: "Loopback variant of the local backend when tooling prefers explicit 127.0.0.1 access.",
        primary_user: "OPERATOR",
        allowed_surfaces: ["API_ENDPOINTS", "WEBHOOKS"],
        source_of_truth_for: ["loopback_local_api_access", "tooling_compatibility_checks"],
        not_valid_for: ["merchant_proof", "live_oauth", "production_delivery_success", "production_promotion"],
        critical_dependencies: ["local backend process", "loopback networking", "operator tooling"],
        current_known_issues: [
          "127.0.0.1 is operator-only and must never appear in merchant-facing flows.",
          "Historical localhost and loopback leakage contributed to environment confusion.",
        ],
      },
      {
        environment_id: "PRODUCTION_FRONTEND",
        canonical_url: "https://app.abando.ai",
        purpose: "Canonical merchant-facing frontend for install, proof, returned state, and Shopify callback host.",
        primary_user: "MERCHANT",
        allowed_surfaces: ["INSTALL_FLOW", "MERCHANT_DASHBOARD", "EXPERIENCE_PROOF", "OAUTH_CALLBACK"],
        source_of_truth_for: ["merchant_ui", "merchant_proof_surface", "oauth_callback_host", "returned_page_render"],
        not_valid_for: ["backend_webhook_processing", "local_operator_debug_assumptions"],
        critical_dependencies: ["Vercel deployment", "frontend env alignment", "production API proxying"],
        current_known_issues: [
          "OAuth callback drift previously pointed installs at the Render host instead of app.abando.ai.",
          "Live proof loop is not yet fully completed end to end.",
          ...(vercelBlocked ? ["Frontend production deployment is currently blocked from this environment because VERCEL_TOKEN is missing."] : []),
        ],
      },
      {
        environment_id: "PRODUCTION_API",
        canonical_url: "https://cart-agent-api.onrender.com",
        purpose: "Canonical live backend truth for API responses, health checks, delivery execution, and webhooks.",
        primary_user: "SYSTEM",
        allowed_surfaces: ["API_ENDPOINTS", "WEBHOOKS"],
        source_of_truth_for: ["api_health", "delivery_readiness", "delivery_execution", "status_truth", "webhook_processing"],
        not_valid_for: ["merchant_facing_page_render", "oauth_redirect_host"],
        critical_dependencies: ["Render deployment", "backend env variables", "Prisma/database", "delivery providers", "Shopify webhooks"],
        current_known_issues: [
          "Render API must never be used as the OAuth redirect host.",
          "Live proof loop currently stops if no real storefront checkout has been captured.",
          "Historical base URL drift created multiple sources of truth for merchant-facing URLs.",
        ],
      },
      {
        environment_id: "SHOPIFY_EMBEDDED",
        canonical_url: "https://admin.shopify.com",
        purpose: "Merchant-facing embedded Shopify context used when Abando opens inside Shopify Admin.",
        primary_user: "MERCHANT",
        allowed_surfaces: ["MERCHANT_DASHBOARD", "INSTALL_FLOW"],
        source_of_truth_for: ["embedded_navigation_context", "merchant_admin_launch_context"],
        not_valid_for: ["direct_api_truth", "oauth_callback_host_source_of_truth", "local_operator_testing"],
        critical_dependencies: ["Shopify Admin session", "embedded app configuration", "frontend render compatibility"],
        current_known_issues: [
          "Embedded flows depend on canonical production frontend routing, not local assumptions.",
          "Embedded proof is not valid unless the underlying production frontend and API are aligned.",
        ],
      },
      {
        environment_id: "STAFFORDOS_OPERATOR_SURFACE",
        canonical_url: "http://localhost:3000/operator",
        purpose: "Operator-only command and analysis surface for StaffordOS workflows and diagnostics.",
        primary_user: "OPERATOR",
        allowed_surfaces: ["OPERATOR_SURFACE"],
        source_of_truth_for: ["operator coordination", "diagnostics", "internal execution planning"],
        not_valid_for: ["merchant_proof", "merchant_install_claims", "delivery_execution_proof", "oauth_production_validation"],
        critical_dependencies: ["local frontend", "operator auth/session", "StaffordOS modules"],
        current_known_issues: [
          "Operator surfaces are separate from merchant-facing Abando truth.",
          "Mixed operator and merchant concerns in one worktree are currently creating operational drag.",
        ],
      },
    ],
  };
}

function writeInventory(inventory) {
  fs.mkdirSync(path.dirname(INVENTORY_PATH), { recursive: true });
  fs.writeFileSync(INVENTORY_PATH, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
}

const inventory = buildInventory();
writeInventory(inventory);
console.log(`Wrote environment inventory to ${INVENTORY_PATH}`);
