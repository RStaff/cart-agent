import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateMission002ShopifixerReadiness } from "./evaluate_mission_002_shopifixer_execution_readiness_v1.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const BINDING_PATH = path.join(REPO_ROOT, "staffordos/missions/mission_002_shopifixer_merchant_execution_readiness_binding_v1.json");
const READINESS_OUTPUT_PATH = path.join(MODULE_DIR, "output", "mission_002_shopifixer_execution_readiness_v1.json");
const FIX_STATUS_ROUTE_PATH = "abando-frontend/app/fix-status/page.tsx";
const LEGACY_STATUS_ROUTE_PATH = "abando-frontend/app/shopifixer/status/page.tsx";

function readText(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  } catch {
    return "";
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(readText(filePath));
  } catch {
    return null;
  }
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

function normalizeMission002Readiness(readiness) {
  const normalized = JSON.parse(JSON.stringify(readiness ?? null));
  if (
    normalized &&
    typeof normalized === "object" &&
    normalized.schema === "staffordos.mission_002_shopifixer_execution_readiness.v1"
  ) {
    // Readiness generated_at is operational metadata under staffordos/governance/READINESS_ARTIFACT_DETERMINISM_POLICY_V1.md.
    normalized.generated_at = "<normalized-mission-002-readiness-generated_at>";
  }
  return normalized;
}

function readinessSemanticallyEqual(left, right) {
  return stableStringify(normalizeMission002Readiness(left)) === stableStringify(normalizeMission002Readiness(right));
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function run() {
  const failures = [];
  const binding = readJson(BINDING_PATH);
  const persistedReadiness = readJson(READINESS_OUTPUT_PATH);
  const evaluatedReadiness = evaluateMission002ShopifixerReadiness({ repoRoot: REPO_ROOT, bindingPath: BINDING_PATH });
  const authorityRegistry = readJson(path.join(REPO_ROOT, "staffordos/authority/authority_registry_v1.json"));
  const authorityRegistryDoc = readText(path.join(REPO_ROOT, "staffordos/authority/authority_registry_v1.md"));
  const paymentLifecycle = readText(path.join(REPO_ROOT, "staffordos/authority/payment_lifecycle_registry_v1.md"));
  const paymentSourceValidation = readJson(path.join(REPO_ROOT, "staffordos/authority/output/payment_authority_source_validation_v1.json"));

  assert(binding?.schema === "staffordos.mission_binding.shopifixer_merchant_execution_readiness.v1", "Mission 002 binding schema is canonical", failures);
  assert(binding?.mission_id === "mission_002_shopifixer_merchant_execution_readiness", "Mission 002 binding mission_id is canonical", failures);
  assert(binding?.status === "governance_binding_established", "Mission 002 binding is established", failures);
  assert(binding?.mission_boundaries?.application_code_changes_permitted_by_this_binding === false, "binding does not authorize application code changes", failures);
  assert(binding?.mission_boundaries?.runtime_changes_permitted_by_this_binding === false, "binding does not authorize runtime changes", failures);
  assert(binding?.mission_boundaries?.payment_activity_permitted === false, "binding does not authorize payment activity", failures);
  assert(binding?.mission_boundaries?.first_engineering_slice_requires_separate_authority === true, "binding requires separate engineering authority", failures);
  assert(binding?.merchant_continuity_authority?.canonical_route_implementation === FIX_STATUS_ROUTE_PATH, "binding records canonical /fix-status implementation path", failures);
  assert(binding?.merchant_continuity_authority?.legacy_compatibility_implementation === LEGACY_STATUS_ROUTE_PATH, "binding records legacy compatibility route path", failures);
  assert(binding?.merchant_continuity_authority?.implementation_status === "implemented_by_m002_03", "binding records M002.03 route implementation status", failures);
  assert(!binding?.merchant_continuity_authority?.known_implementation_gap, "binding no longer reports /fix-status as missing", failures);

  const fixStatusRoute = readText(path.join(REPO_ROOT, FIX_STATUS_ROUTE_PATH));
  const legacyStatusRoute = readText(path.join(REPO_ROOT, LEGACY_STATUS_ROUTE_PATH));
  assert(fixStatusRoute.includes("../shopifixer/status/page"), "canonical /fix-status route reuses legacy status implementation", failures);
  assert(legacyStatusRoute.includes("/api/packets/"), "legacy status implementation still hydrates from packet authority", failures);

  assert(Boolean(persistedReadiness), "Mission 002 readiness output is readable", failures);
  assert(persistedReadiness?.status === "GO", "Mission 002 governance readiness status is GO", failures);
  assert(persistedReadiness?.current_phase === "ready_for_continuity_runtime_preflight", "Mission 002 current phase is ready_for_continuity_runtime_preflight", failures);
  assert(persistedReadiness?.current_blocker === "None", "Mission 002 current blocker is None", failures);
  assert(persistedReadiness?.completion_permitted === false, "Mission 002 completion is not certified by this binding", failures);
  assert(persistedReadiness?.first_engineering_slice_permitted === false, "first engineering slice is no longer pending after M002.03", failures);
  assert(persistedReadiness?.first_engineering_slice_completed === true, "first engineering slice is complete after M002.03", failures);
  assert(persistedReadiness?.next_engineering_slice_permitted === true, "next engineering slice may be separately authorized", failures);
  assert(persistedReadiness?.payment_activity_permitted === false, "Mission 002 readiness output does not authorize payment activity", failures);
  assert(persistedReadiness?.shopify_mutation_permitted === false, "Mission 002 readiness output does not authorize Shopify mutation", failures);
  assert(persistedReadiness?.runtime_mutation_permitted === false, "Mission 002 readiness output does not authorize runtime mutation", failures);
  assert(persistedReadiness?.canonical_continuity_route_implementation === FIX_STATUS_ROUTE_PATH, "readiness output records canonical /fix-status implementation path", failures);
  assert(
    !persistedReadiness?.known_implementation_gaps?.some((gap) => String(gap).includes("/fix-status") && String(gap).includes("present")),
    "readiness output no longer reports /fix-status as missing",
    failures
  );

  assert(
    readinessSemanticallyEqual(persistedReadiness, evaluatedReadiness),
    "persisted Mission 002 readiness semantically matches evaluator output with generated_at normalized",
    failures
  );
  assert(
    readinessSemanticallyEqual(
      evaluatedReadiness,
      { ...evaluatedReadiness, generated_at: "2099-01-01T00:00:00.000Z" }
    ),
    "Mission 002 readiness semantic determinism accepts generated_at-only variance",
    failures
  );
  assert(
    !readinessSemanticallyEqual(
      evaluatedReadiness,
      { ...evaluatedReadiness, status: evaluatedReadiness.status === "GO" ? "NO_GO" : "GO" }
    ),
    "Mission 002 readiness semantic determinism rejects canonical status variance",
    failures
  );
  assert(
    !readinessSemanticallyEqual(
      evaluatedReadiness,
      { ...evaluatedReadiness, payment_activity_permitted: true }
    ),
    "Mission 002 readiness semantic determinism rejects payment authority variance",
    failures
  );

  assert(authorityRegistry?.current_blocker === null, "authority registry has no stale S2F current blocker", failures);
  assert(authorityRegistry?.next_required_phase === "S2H_CONTROLLED_REAL_PAYMENT_VALIDATION", "authority registry points to S2H as next required phase", failures);
  assert(!authorityRegistry?.blocked_actions?.includes("real_payment_validation"), "authority registry no longer blocks separately authorized real payment validation", failures);
  assert(authorityRegistryDoc.includes("S2F source-authority blocker: none"), "authority registry documentation records S2F blocker removal", failures);
  assert(paymentLifecycle.includes("None for S2F source authority"), "payment lifecycle registry records no S2F source-authority blocker", failures);
  assert(paymentSourceValidation?.status === "passed", "payment authority source validation output passes", failures);
  assert(paymentSourceValidation?.current_blocker === null, "payment authority source validation has no current blocker", failures);

  const allGatesPass = Object.values(evaluatedReadiness.gates || {}).every((gate) => gate?.status === "pass");
  assert(allGatesPass, "all Mission 002 readiness gates pass", failures);

  if (failures.length) {
    console.error(JSON.stringify({ status: "failed", failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: "passed",
    checks: {
      mission_002_binding: true,
      mission_002_readiness_output: true,
      generated_at_semantically_normalized: true,
      canonical_fields_remain_strict: true,
      canonical_fix_status_route_implemented: true,
      payment_authority_reconciled: true,
      next_engineering_slice_requires_separate_authority: true,
      no_payment_or_runtime_authority_granted: true
    }
  }, null, 2));
}

run();
