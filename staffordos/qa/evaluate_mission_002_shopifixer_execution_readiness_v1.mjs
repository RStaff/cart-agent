import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const DEFAULT_BINDING_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/missions/mission_002_shopifixer_merchant_execution_readiness_binding_v1.json");
const DEFAULT_OUTPUT_PATH = path.join(MODULE_DIR, "output", "mission_002_shopifixer_execution_readiness_v1.json");

function readText(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  } catch {
    return "";
  }
}

function readJson(filePath, fallback = {}) {
  try {
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function exists(repoRoot, relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function has(text, needle) {
  return String(text || "").includes(needle);
}

function stageStatus(status, detail, evidence = []) {
  return {
    status,
    detail,
    evidence
  };
}

function findAuthority(authorityRegistry, name) {
  return Array.isArray(authorityRegistry?.authorities)
    ? authorityRegistry.authorities.find((authority) => authority?.name === name) || null
    : null;
}

function evaluateMission002ShopifixerReadiness(options = {}) {
  const repoRoot = options.repoRoot ? path.resolve(options.repoRoot) : DEFAULT_REPO_ROOT;
  const bindingPath = options.bindingPath ? path.resolve(options.bindingPath) : DEFAULT_BINDING_PATH;
  const rel = (value) => path.relative(repoRoot, value).replace(/\\/g, "/");

  const binding = readJson(bindingPath, null);
  const missionDefinitionPath = "staffordos/implementation/p11_57_mission_002_authority_definition_v1.md";
  const readinessPlanPath = "staffordos/implementation/p11_58_mission_002_binding_and_readiness_plan_v1.md";
  const mission001ReadinessPath = "staffordos/qa/output/nokings_mission_001_readiness_v1.json";
  const mission001CertificationPath = "staffordos/implementation/p11_53_mission_001_completion_certification_v1.md";
  const productionRestorationPath = "staffordos/implementation/p11_55_governed_production_typo_restoration_v1.md";
  const continuityAuditPath = "STAFFORDOS_CANONICAL_CONTINUITY_ROUTE_AUDIT_V1.md";
  const merchantWorkspacePath = "STAFFORDOS_MERCHANT_WORKSPACE_ARCHITECTURE_V1.md";
  const paymentLifecyclePath = "staffordos/authority/payment_lifecycle_registry_v1.md";
  const authorityRegistryPath = "staffordos/authority/authority_registry_v1.json";
  const authorityRegistryDocPath = "staffordos/authority/authority_registry_v1.md";
  const paymentSourceOutputPath = "staffordos/authority/output/payment_authority_source_validation_v1.json";
  const fulfillmentAuthorityPath = "staffordos/authority/output/shopifixer_fulfillment_authority_v1.md";
  const evaluatorPath = "staffordos/qa/evaluate_mission_002_shopifixer_execution_readiness_v1.mjs";
  const validatorPath = "staffordos/qa/validate_mission_002_shopifixer_execution_binding_v1.mjs";
  const outputPath = "staffordos/qa/output/mission_002_shopifixer_execution_readiness_v1.json";
  const fixStatusRoutePath = "abando-frontend/app/fix-status/page.tsx";
  const legacyStatusRoutePath = "abando-frontend/app/shopifixer/status/page.tsx";

  const missionDefinition = readText(path.join(repoRoot, missionDefinitionPath));
  const readinessPlan = readText(path.join(repoRoot, readinessPlanPath));
  const mission001Readiness = readJson(path.join(repoRoot, mission001ReadinessPath), null);
  const mission001Certification = readText(path.join(repoRoot, mission001CertificationPath));
  const productionRestoration = readText(path.join(repoRoot, productionRestorationPath));
  const continuityAudit = readText(path.join(repoRoot, continuityAuditPath));
  const merchantWorkspace = readText(path.join(repoRoot, merchantWorkspacePath));
  const paymentLifecycle = readText(path.join(repoRoot, paymentLifecyclePath));
  const authorityRegistry = readJson(path.join(repoRoot, authorityRegistryPath), null);
  const authorityRegistryDoc = readText(path.join(repoRoot, authorityRegistryDocPath));
  const paymentSourceOutput = readJson(path.join(repoRoot, paymentSourceOutputPath), null);
  const fulfillmentAuthority = readText(path.join(repoRoot, fulfillmentAuthorityPath));
  const fixStatusRoute = readText(path.join(repoRoot, fixStatusRoutePath));
  const legacyStatusRoute = readText(path.join(repoRoot, legacyStatusRoutePath));

  const checkoutAuthority = findAuthority(authorityRegistry, "Checkout Authority");
  const packetAuthority = findAuthority(authorityRegistry, "Packet Authority");
  const stripeWebhookAuthority = findAuthority(authorityRegistry, "Stripe Webhook Authority");
  const billingAuthority = findAuthority(authorityRegistry, "Billing Authority");

  const mission001Complete = Boolean(
    mission001Readiness?.status === "GO" &&
    mission001Readiness?.current_phase === "mission_001_complete" &&
    mission001Readiness?.current_blocker === "None" &&
    mission001Readiness?.completion_permitted === true &&
    has(mission001Certification, "MISSION 001 COMPLETION CERTIFICATION PASSED") &&
    has(productionRestoration, "JOIN THE RELENTLESS")
  );

  const missionDefinitionReady = Boolean(
    has(missionDefinition, "mission_002_shopifixer_merchant_execution_readiness") &&
    has(missionDefinition, "Required Before Mission 002 Implementation") &&
    has(missionDefinition, "Mission 002 may proceed to a binding and readiness-definition mission")
  );

  const bindingReady = Boolean(
    binding?.schema === "staffordos.mission_binding.shopifixer_merchant_execution_readiness.v1" &&
    binding?.mission_id === "mission_002_shopifixer_merchant_execution_readiness" &&
    binding?.status === "governance_binding_established" &&
    binding?.mission_boundaries?.application_code_changes_permitted_by_this_binding === false &&
    binding?.mission_boundaries?.runtime_changes_permitted_by_this_binding === false &&
    binding?.mission_boundaries?.payment_activity_permitted === false &&
    binding?.mission_boundaries?.first_engineering_slice_requires_separate_authority === true
  );

  const readinessArtifactsReady = Boolean(
    exists(repoRoot, readinessPlanPath) &&
    exists(repoRoot, evaluatorPath) &&
    exists(repoRoot, validatorPath) &&
    exists(repoRoot, outputPath) &&
    has(readinessPlan, "Mission 002 governance readiness passes only when")
  );

  const paymentAuthorityReconciled = Boolean(
    authorityRegistry?.current_blocker === null &&
    authorityRegistry?.next_required_phase === "S2H_CONTROLLED_REAL_PAYMENT_VALIDATION" &&
    Array.isArray(authorityRegistry?.blocked_actions) &&
    !authorityRegistry.blocked_actions.includes("real_payment_validation") &&
    stripeWebhookAuthority?.status === "active_verified_source_authority" &&
    has(authorityRegistryDoc, "S2F source-authority blocker: none") &&
    has(paymentLifecycle, "None for S2F source authority") &&
    paymentSourceOutput?.status === "passed" &&
    paymentSourceOutput?.current_blocker === null
  );

  const packetBoundaryReady = Boolean(
    checkoutAuthority?.not_allowed?.includes("Mark payment_received") &&
    packetAuthority?.not_allowed?.some((item) => String(item).includes("payment_received")) &&
    stripeWebhookAuthority?.allowed_state_transitions?.includes("payment_pending -> payment_received") &&
    billingAuthority?.status === "non_canonical_for_shopifixer_packet_payments"
  );

  const fixStatusRouteImplemented = Boolean(
    exists(repoRoot, fixStatusRoutePath) &&
    has(fixStatusRoute, "../shopifixer/status/page") &&
    has(fixStatusRoute, 'export const dynamic = "force-dynamic"') &&
    exists(repoRoot, legacyStatusRoutePath) &&
    has(legacyStatusRoute, "/api/packets/")
  );

  const continuityAuthorityReady = Boolean(
    has(continuityAudit, "Canonical post-payment continuity route in the active payment flow:** `/fix-status`") &&
    has(continuityAudit, "Legacy continuity implementation still present in this repository:** `/shopifixer/status`") &&
    has(merchantWorkspace, "`/fix-status` should become the permanent Merchant Workspace shell.") &&
    binding?.merchant_continuity_authority?.canonical_customer_route === "/fix-status" &&
    binding?.merchant_continuity_authority?.canonical_route_implementation === fixStatusRoutePath &&
    binding?.merchant_continuity_authority?.legacy_compatibility_implementation === legacyStatusRoutePath &&
    binding?.merchant_continuity_authority?.implementation_status === "implemented_by_m002_03" &&
    fixStatusRouteImplemented
  );

  const fulfillmentGateReady = Boolean(
    has(fulfillmentAuthority, "status: payment_received") &&
    has(fulfillmentAuthority, "execution_status: not_started") &&
    has(fulfillmentAuthority, "proof_status: not_started") &&
    has(fulfillmentAuthority, "completion_status: not_started") &&
    has(fulfillmentAuthority, "Fix Scope") &&
    has(fulfillmentAuthority, "Merchant-Facing Proof Package")
  );

  const competencyDeferralReady = Boolean(
    binding?.competency_relationship?.current_canonical_score === 38 &&
    binding?.competency_relationship?.score_change_authorized === false &&
    has(missionDefinition, "Current canonical score remains 38/100")
  );

  const gates = {
    mission_001_complete: mission001Complete
      ? stageStatus("pass", "Mission 001 completion and production restoration are governed.", [mission001ReadinessPath, mission001CertificationPath, productionRestorationPath])
      : stageStatus("blocked", "Mission 001 completion authority is missing or inconsistent.", [mission001ReadinessPath, mission001CertificationPath, productionRestorationPath]),
    mission_002_definition: missionDefinitionReady
      ? stageStatus("pass", "Mission 002 definition authority exists.", [missionDefinitionPath])
      : stageStatus("blocked", "Mission 002 definition authority is missing or incomplete.", [missionDefinitionPath]),
    mission_002_binding: bindingReady
      ? stageStatus("pass", "Mission 002 binding is established and non-executing.", [rel(bindingPath)])
      : stageStatus("blocked", "Mission 002 binding is missing or allows execution without separate authority.", [rel(bindingPath)]),
    readiness_artifacts: readinessArtifactsReady
      ? stageStatus("pass", "Mission 002 readiness evaluator, validator, output, and plan exist.", [readinessPlanPath, evaluatorPath, validatorPath, outputPath])
      : stageStatus("blocked", "Mission 002 readiness artifacts are incomplete.", [readinessPlanPath, evaluatorPath, validatorPath, outputPath]),
    payment_authority_reconciled: paymentAuthorityReconciled
      ? stageStatus("pass", "Stale S2F source-authority blocker is reconciled; S2H requires separate authority.", [authorityRegistryPath, authorityRegistryDocPath, paymentLifecyclePath, paymentSourceOutputPath])
      : stageStatus("blocked", "Payment authority still contains stale S2F source-authority conflict.", [authorityRegistryPath, authorityRegistryDocPath, paymentLifecyclePath, paymentSourceOutputPath]),
    packet_authority_boundary: packetBoundaryReady
      ? stageStatus("pass", "Checkout and Packet Authority cannot grant payment_received; Stripe Webhook Authority owns the paid transition.", [authorityRegistryPath])
      : stageStatus("blocked", "Packet/payment authority boundary is incomplete.", [authorityRegistryPath]),
    merchant_continuity_authority: continuityAuthorityReady
      ? stageStatus("pass", "Canonical /fix-status route is implemented; legacy /shopifixer/status remains a compatibility surface.", [continuityAuditPath, merchantWorkspacePath, rel(bindingPath), fixStatusRoutePath, legacyStatusRoutePath])
      : stageStatus("blocked", "Merchant continuity route authority is unclear.", [continuityAuditPath, merchantWorkspacePath, rel(bindingPath)]),
    fulfillment_start_gate: fulfillmentGateReady
      ? stageStatus("pass", "Fulfillment start conditions and proof package requirements are governed.", [fulfillmentAuthorityPath])
      : stageStatus("blocked", "Fulfillment start or proof requirements are missing.", [fulfillmentAuthorityPath]),
    competency_score_deferral: competencyDeferralReady
      ? stageStatus("pass", "Capability score remains 38 until deterministic scoring authority exists.", [rel(bindingPath), missionDefinitionPath])
      : stageStatus("blocked", "Competency score deferral is missing or ambiguous.", [rel(bindingPath), missionDefinitionPath])
  };

  const failures = Object.values(gates)
    .filter((gate) => gate.status !== "pass")
    .map((gate) => gate.detail);

  const status = failures.length ? "NO_GO" : "GO";
  const currentPhase = status === "GO" ? "ready_for_continuity_runtime_preflight" : "mission_002_governance_reconciliation";
  const currentBlocker = status === "GO" ? "None" : failures[0];
  const nextSafeAction = status === "GO"
    ? "Authorize read-side runtime preflight for the payment-return to /fix-status handoff before controlled real payment validation."
    : "Complete Mission 002 binding, readiness, and payment-authority reconciliation before engineering.";

  return {
    schema: "staffordos.mission_002_shopifixer_execution_readiness.v1",
    generated_at: new Date().toISOString(),
    mission_id: "mission_002_shopifixer_merchant_execution_readiness",
    mission_name: "Mission 002 - ShopiFixer Merchant Execution Readiness Authority",
    status,
    current_phase: currentPhase,
    current_blocker: currentBlocker,
    next_safe_action: nextSafeAction,
    completion_permitted: false,
    first_engineering_slice_permitted: false,
    first_engineering_slice_completed: status === "GO" && fixStatusRouteImplemented,
    next_engineering_slice_permitted: status === "GO",
    separate_engineering_authorization_required: true,
    payment_activity_permitted: false,
    shopify_mutation_permitted: false,
    runtime_mutation_permitted: false,
    application_code_change_permitted_by_this_binding: false,
    current_canonical_score: 38,
    next_payment_phase: "S2H_CONTROLLED_REAL_PAYMENT_VALIDATION",
    payment_phase_requires_separate_authority: true,
    canonical_continuity_route: "/fix-status",
    canonical_continuity_route_implementation: fixStatusRoutePath,
    legacy_compatibility_route: "/shopifixer/status",
    legacy_compatibility_route_implementation: legacyStatusRoutePath,
    known_implementation_gaps: [
      "Live payment validation has not been executed by this governance binding.",
      "Merchant execution and proof package creation require separate future authority."
    ],
    gates,
    evidence_sources: [
      rel(bindingPath),
      missionDefinitionPath,
      readinessPlanPath,
      mission001ReadinessPath,
      mission001CertificationPath,
      productionRestorationPath,
      continuityAuditPath,
      merchantWorkspacePath,
      fixStatusRoutePath,
      legacyStatusRoutePath,
      paymentLifecyclePath,
      authorityRegistryPath,
      authorityRegistryDocPath,
      paymentSourceOutputPath,
      fulfillmentAuthorityPath
    ],
    warnings: [
      "This readiness artifact authorizes governance readiness only.",
      "No payment, packet mutation, Shopify mutation, application implementation, deployment, or merchant execution is authorized by this artifact.",
      "Runtime handoff validation for payment-return to /fix-status requires separate read-side authority."
    ]
  };
}

function runCli() {
  const repoRoot = process.env.MISSION_002_REPO_ROOT ? path.resolve(process.env.MISSION_002_REPO_ROOT) : DEFAULT_REPO_ROOT;
  const bindingPath = process.env.MISSION_002_BINDING_PATH ? path.resolve(process.env.MISSION_002_BINDING_PATH) : DEFAULT_BINDING_PATH;
  const outputPath = process.env.MISSION_002_READINESS_OUTPUT_PATH ? path.resolve(process.env.MISSION_002_READINESS_OUTPUT_PATH) : DEFAULT_OUTPUT_PATH;
  const report = evaluateMission002ShopifixerReadiness({ repoRoot, bindingPath });
  writeJson(outputPath, report);
  console.log(
    `Mission 002 ShopiFixer readiness: ${report.status} | phase=${report.current_phase} | blocker=${report.current_blocker} | next=${report.next_safe_action}`
  );
  process.exit(report.status === "NO_GO" ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}

export { evaluateMission002ShopifixerReadiness };
