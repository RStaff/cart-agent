import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const DEFAULT_BINDING_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json");
const DEFAULT_PROOF_RUN_DIR = path.join(DEFAULT_REPO_ROOT, "staffordos/proof_runs/mission_001_nokings_shopifixer_v1");
const DEFAULT_CERTIFICATION_MEMO_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md");
const DEFAULT_EXERCISE_005_CERTIFICATION_MEMO_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/implementation/p11_7_mission_001_exercise_005_certification_v1.md");
const DEFAULT_OUTPUT_PATH = path.join(MODULE_DIR, "output", "nokings_mission_001_readiness_v1.json");

function clean(value, fallback = "Not Yet Available") {
  const text = String(value ?? "").trim();
  return text.length ? text : fallback;
}

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

function sha256(value) {
  return crypto.createHash("sha256").update(String(value ?? ""), "utf8").digest("hex");
}

function normalizeStore(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function parseMarkdownFields(content) {
  const lines = String(content || "").split(/\r?\n/);
  function valueAfter(label) {
    const index = lines.findIndex((line) => line.trim() === label);
    if (index < 0) return "";
    for (let i = index + 1; i < lines.length; i += 1) {
      const candidate = lines[i].trim();
      if (!candidate) continue;
      if (/^[A-Za-z][A-Za-z /&-]+:$/.test(candidate)) break;
      return candidate.replace(/^-+\s*/, "");
    }
    return "";
  }
  function listAfter(label) {
    const index = lines.findIndex((line) => line.trim() === label);
    if (index < 0) return [];
    const items = [];
    for (let i = index + 1; i < lines.length; i += 1) {
      const candidate = lines[i].trim();
      if (!candidate) continue;
      if (/^[A-Za-z][A-Za-z /&-]+:$/.test(candidate)) break;
      items.push(candidate.replace(/^-+\s*/, ""));
    }
    return items;
  }

  return {
    status: valueAfter("Status:"),
    activeExercise: valueAfter("Active Exercise:"),
    exercise004ScopePath: valueAfter("Exercise 004 Scope Path:"),
    exercise005ScopePath: valueAfter("Exercise 005 Scope Path:"),
    scopeAuthority: valueAfter("Scope Authority:"),
    store: valueAfter("Store:"),
    objective: valueAfter("Exact Problem / Learning Objective:"),
    issue: valueAfter("Issue:"),
    scopedFix: valueAfter("Smallest Scoped Fix:"),
    targetArtifact: valueAfter("Target Page / Template / Artifact:"),
    inScope: listAfter("In Scope:"),
    outOfScope: listAfter("Out of Scope:"),
    merchantApprovalRequired: valueAfter("Merchant Approval Required:"),
    changeLocation: valueAfter("Change Location:"),
    implementationNotes: valueAfter("Implementation Notes:"),
    successCriteria: valueAfter("Success Criteria:"),
    affectedPage: valueAfter("Affected Page / Artifact:"),
    observedImprovement: valueAfter("Observed Improvement:"),
    merchantFacingSummary: valueAfter("Merchant-Facing Summary:"),
    remainingLimitations: valueAfter("Remaining Limitations:"),
    screenshot: valueAfter("Screenshot:"),
    notes: valueAfter("Notes:")
  };
}

function parseCertificationMemo(content) {
  const text = String(content || "");
  const capture = (re) => {
    const match = text.match(re);
    return match ? match[1].trim() : "";
  };
  const hasSection = (heading) => new RegExp(`##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(text);
  const hasLine = (needle) => text.toLowerCase().includes(String(needle).toLowerCase());
  return {
    present: Boolean(text.trim()),
    missionId: capture(/Mission ID:\s*`([^`]+)`/i),
    exercise: capture(/Exercise:\s*`([^`]+)`/i),
    merchant: capture(/Merchant:\s*`([^`]+)`/i),
    canonicalStore: capture(/Canonical store:\s*`([^`]+)`/i),
    certificationDecision: capture(/\*\*(GO|CONDITIONAL GO|NO GO)\*\*/i),
    evidenceChainReviewed: hasSection("Evidence Chain Verification"),
    architectureInventoryCompleted: hasSection("Architecture Inventory Completed"),
    collectionArchitectureCertified: hasSection("Collection Architecture Certified"),
    repositoryTruthReviewed: hasSection("Repository Truth Reviewed"),
    readinessAssessment: hasSection("Readiness Assessment"),
    recommendation: hasSection("Recommendation for Exercise 005"),
    nextCanonicalExercise: hasSection("Next Canonical Exercise"),
    unsupportedClaimsExcluded: hasSection("Unsupported Claims Explicitly Excluded"),
    mutationAndRollbackAssessment: hasSection("Mutation And Rollback Assessment") || hasSection("Mutation and Rollback Assessment"),
    exercise006Recommended: hasLine("Exercise 006 - Cart Inventory") && hasLine("ex_006_cart_inventory"),
    noShopifyMutation: hasLine("No Shopify mutation occurred")
  };
}

function loadBinding(bindingPath) {
  return readJson(bindingPath, {});
}

function stageStatus(status, reason) {
  return {
    status,
    reason
  };
}

function evaluateNokingsMissionReadiness({
  repoRoot = DEFAULT_REPO_ROOT,
  bindingPath = DEFAULT_BINDING_PATH,
  proofRunDir = DEFAULT_PROOF_RUN_DIR,
  certificationMemoPath = DEFAULT_CERTIFICATION_MEMO_PATH,
  exercise005CertificationMemoPath = DEFAULT_EXERCISE_005_CERTIFICATION_MEMO_PATH
} = {}) {
  const binding = loadBinding(bindingPath);
  const scopeIndexPath = path.join(proofRunDir, "fix_scope.md");
  const missionScopeIndex = parseMarkdownFields(readText(scopeIndexPath));
  const exercise006ScopePath = path.join(proofRunDir, "exercises", "exercise_006", "fix_scope.md");
  const exercise006ScopeExists = fs.existsSync(exercise006ScopePath);
  const rootActiveExerciseLabel = clean(missionScopeIndex.activeExercise);
  const activeExerciseLabel = exercise006ScopeExists ? "Exercise 006 - Cart Inventory" : rootActiveExerciseLabel;
  const activeExerciseSlug = /Exercise 004 - Product Page Inventory/i.test(activeExerciseLabel)
    ? "exercise_004"
    : /Exercise 005 - Collection Page Inventory/i.test(activeExerciseLabel)
      ? "exercise_005"
      : /Exercise 006 - Cart Inventory/i.test(activeExerciseLabel)
        ? "exercise_006"
        : "";
  const activeScopePath = activeExerciseSlug ? path.join(proofRunDir, "exercises", activeExerciseSlug, "fix_scope.md") : "";
  const activeScopeExists = activeScopePath ? fs.existsSync(activeScopePath) : false;
  const activeScope = parseMarkdownFields(readText(activeScopePath));
  const exerciseEvidenceDir = activeExerciseSlug ? path.join(proofRunDir, "exercises", activeExerciseSlug) : proofRunDir;
  const beforePath = path.join(exerciseEvidenceDir, "before_evidence.md");
  const afterPath = path.join(exerciseEvidenceDir, "after_evidence.md");
  const missionProofPackagePath = path.join(exerciseEvidenceDir, "mission_proof_package.md");
  const executionNotesPath = path.join(exerciseEvidenceDir, "execution_notes.md");
  const certificationMemo = parseCertificationMemo(readText(certificationMemoPath));
  const exercise005CertificationMemo = parseCertificationMemo(readText(exercise005CertificationMemoPath));

  const beforeEvidence = parseMarkdownFields(readText(beforePath));
  const afterEvidence = parseMarkdownFields(readText(afterPath));
  const proofPackagePath = missionProofPackagePath;
  const proofPackageText = readText(proofPackagePath);
  const proofPackage = parseMarkdownFields(proofPackageText);
  const executionNotes = parseMarkdownFields(readText(executionNotesPath));
  const store = clean(binding?.canonical_store_domain || binding?.merchant?.store_domain || binding?.merchant?.client_id || "");
  const bindingStoreMatches = normalizeStore(binding?.canonical_store_domain) === "no-kings-athletics.myshopify.com";
  const missionIdMatches = clean(binding?.mission_id) === "mission_001";
  const productMatches = clean(binding?.product) === "ShopiFixer";
  const environmentMatches = clean(binding?.environment_type) === "controlled_training";
  const proofRunId = clean(binding?.proof_run_id);
  const proofRunPath = clean(binding?.proof_run_path);
  const proofRunPathExists = fs.existsSync(proofRunDir);
  const storefrontUrl = clean(binding?.storefront_url, "Not Yet Available");
  const paymentRequired = binding?.payment_required === true;
  const paymentAuthority = clean(binding?.payment_authority);

  const merchantBindingPass = Boolean(bindingStoreMatches && missionIdMatches && productMatches && environmentMatches && proofRunId && proofRunPath && proofRunPathExists);
  const activeScopeObjective = clean(activeScope.objective || activeScope.issue || activeScope.scopedFix);
  const activeScopeTarget = clean(activeScope.targetArtifact);
  const activeScopeStore = normalizeStore(activeScope.store);
  const scopeIsExercise004 = /Exercise 004 - Product Page Inventory/i.test(activeScopeObjective) || /templates\/product\.json|product page inventory/i.test(activeScopeTarget);
  const scopeIsExercise005 = /Exercise 005 - Collection Page Inventory/i.test(activeScopeObjective) || /templates\/collection\.json|collection page inventory/i.test(activeScopeTarget);
  const scopeIsExercise006 = /Exercise 006 - Cart Inventory/i.test(activeScopeObjective) || /templates\/cart\.json|cart inventory/i.test(activeScopeTarget);
  const scopeMatchesActiveExercise = activeExerciseSlug === "exercise_004"
    ? scopeIsExercise004
    : activeExerciseSlug === "exercise_005"
      ? scopeIsExercise005
      : activeExerciseSlug === "exercise_006"
        ? scopeIsExercise006
        : false;
  const scopeComplete = Boolean(activeExerciseSlug && activeScopeExists && clean(activeScope.status).toLowerCase() === "complete" && activeScopeStore === "no-kings-athletics.myshopify.com" && scopeMatchesActiveExercise);
  const scopeBlocker = !activeExerciseSlug || !activeScopeExists
    ? "Active exercise scope missing"
    : !scopeMatchesActiveExercise
      ? "Active exercise scope rejected"
      : !scopeComplete
        ? "Scope Incomplete"
        : "";
  const beforeEvidenceText = [beforeEvidence.objective, beforeEvidence.issue, beforeEvidence.affectedPage, beforeEvidence.notes, beforeEvidence.screenshot].join(" ");
  const beforeEvidenceRelevant = scopeIsExercise006
    ? /cart/i.test(beforeEvidenceText)
    : scopeIsExercise005
      ? /collection/i.test(beforeEvidenceText)
      : /product/i.test(beforeEvidenceText);
  const beforeEvidenceCaptured = (clean(beforeEvidence.status).toLowerCase() === "complete" || clean(beforeEvidence.status).toLowerCase() === "captured") && beforeEvidenceRelevant;
  const analysisPhase = scopeIsExercise006
    ? "cart_inventory"
    : scopeIsExercise005
      ? "collection_page_inventory"
      : "product_page_inventory";
  const executionNotesText = [executionNotes.objective, executionNotes.issue, executionNotes.affectedPage, executionNotes.notes].join(" ");
  const analysisComplete = scopeIsExercise006
    ? clean(executionNotes.status).toLowerCase() === "complete" && /cart/i.test(executionNotesText)
    : scopeIsExercise005
      ? clean(executionNotes.status).toLowerCase() === "complete" && /collection/i.test(executionNotesText)
      : clean(executionNotes.status).toLowerCase() === "complete" || clean(executionNotes.status).toLowerCase() === "captured";
  const executionAuthorityPass = merchantBindingPass && scopeComplete && beforeEvidenceCaptured && analysisComplete;
  const afterEvidenceText = [afterEvidence.objective, afterEvidence.issue, afterEvidence.affectedPage, afterEvidence.notes].join(" ");
  const afterEvidenceCaptured = scopeIsExercise006
    ? (clean(afterEvidence.status).toLowerCase() === "complete" || clean(afterEvidence.status).toLowerCase() === "captured") && /cart/i.test(afterEvidenceText)
    : scopeIsExercise005
      ? (clean(afterEvidence.status).toLowerCase() === "complete" || clean(afterEvidence.status).toLowerCase() === "captured") && /collection/i.test(afterEvidenceText)
      : clean(afterEvidence.status).toLowerCase() === "complete" || clean(afterEvidence.status).toLowerCase() === "captured";
  const proofPackageStoreMatches = normalizeStore(proofPackage.store) === normalizeStore(binding?.canonical_store_domain);
  const proofPackageMatchesActiveExercise = scopeIsExercise005
    ? /Exercise 005 - Collection Page Inventory/i.test(proofPackageText) && /collection/i.test(proofPackageText)
    : scopeIsExercise004
      ? /Exercise 004 - Product Page Inventory/i.test(proofPackageText) && /product/i.test(proofPackageText)
      : scopeIsExercise006
        ? /Exercise 006 - Cart Inventory/i.test(proofPackageText) && /cart/i.test(proofPackageText)
        : false;
  const proofReady = ["complete", "assembled", "recognized"].includes(clean(proofPackage.status).toLowerCase()) && proofPackageStoreMatches && proofPackageMatchesActiveExercise;
  const certificationDecision = clean(certificationMemo.certificationDecision).toUpperCase();
  const exercise005CertificationDecision = clean(exercise005CertificationMemo.certificationDecision).toUpperCase();
  const exercise004CertificationReady = Boolean(certificationMemo.present &&
      certificationMemo.missionId === "mission_001" &&
      certificationMemo.exercise === "Exercise 004 - Product Page Inventory" &&
      normalizeStore(certificationMemo.canonicalStore) === "no-kings-athletics.myshopify.com" &&
      certificationMemo.merchant === "NoKings Athletics" &&
      ["GO", "CONDITIONAL GO"].includes(certificationDecision) &&
      certificationMemo.evidenceChainReviewed &&
      certificationMemo.architectureInventoryCompleted &&
      certificationMemo.repositoryTruthReviewed &&
      certificationMemo.readinessAssessment &&
      certificationMemo.recommendation &&
      certificationMemo.noShopifyMutation);
  const exercise005CertificationReady = Boolean(exercise005CertificationMemo.present &&
      exercise005CertificationMemo.missionId === "mission_001" &&
      exercise005CertificationMemo.exercise === "Exercise 005 - Collection Page Inventory" &&
      normalizeStore(exercise005CertificationMemo.canonicalStore) === "no-kings-athletics.myshopify.com" &&
      exercise005CertificationMemo.merchant === "NoKings Athletics" &&
      ["GO", "CONDITIONAL GO"].includes(exercise005CertificationDecision) &&
      exercise005CertificationMemo.evidenceChainReviewed &&
      exercise005CertificationMemo.collectionArchitectureCertified &&
      exercise005CertificationMemo.repositoryTruthReviewed &&
      exercise005CertificationMemo.readinessAssessment &&
      exercise005CertificationMemo.unsupportedClaimsExcluded &&
      exercise005CertificationMemo.mutationAndRollbackAssessment &&
      exercise005CertificationMemo.nextCanonicalExercise &&
      exercise005CertificationMemo.exercise006Recommended &&
      exercise005CertificationMemo.noShopifyMutation);
  const certificationMemoReady = scopeIsExercise004 ? exercise004CertificationReady : scopeIsExercise005 ? exercise005CertificationReady : false;
  const nextPlanningBlocker = scopeIsExercise006 ? "Exercise 007 Planning Missing" : scopeIsExercise005 ? "Exercise 006 Planning Missing" : "Exercise 005 Planning Missing";
  const nextPlanningPhase = scopeIsExercise006 ? "exercise_007_planning" : scopeIsExercise005 ? "exercise_006_planning" : "exercise_005_planning";
  const rollbackReady = Boolean(merchantBindingPass && proofRunPathExists);

  const gatingReasons = [
    !merchantBindingPass ? "Merchant binding incomplete" : "",
    !scopeComplete ? scopeBlocker : "",
    !beforeEvidenceCaptured ? "Before Evidence Missing" : "",
    !analysisComplete ? (scopeIsExercise006 ? "Cart Inventory Not Performed" : scopeIsExercise005 ? "Collection Page Inventory Not Performed" : "Product Page Inventory Not Performed") : "",
    !afterEvidenceCaptured ? "After Evidence Missing" : "",
    !proofReady ? "Proof Package Missing" : !certificationMemoReady ? "Mission Certification Missing" : nextPlanningBlocker,
    paymentRequired ? "Payment required by mission binding" : ""
  ].filter(Boolean);

  const currentPhase = !merchantBindingPass
    ? "merchant_binding"
    : !scopeComplete
      ? "scope"
      : !beforeEvidenceCaptured
          ? "before_evidence"
          : !analysisComplete
            ? analysisPhase
            : !afterEvidenceCaptured
              ? "after_evidence"
              : !proofReady
              ? "proof_package"
              : !certificationMemoReady
                ? "mission_certification"
              : paymentRequired
                ? "delivery_payment"
                : nextPlanningPhase;

  const currentBlocker = gatingReasons[0] || "Not Yet Available";
  const nextSafeAction = !merchantBindingPass
    ? "Complete mission binding"
    : !scopeComplete
      ? (scopeIsExercise006 ? "Establish governed Exercise 006 scope" : "Establish governed mission scope")
      : !beforeEvidenceCaptured
        ? "Capture Before Evidence"
        : !analysisComplete
          ? (scopeIsExercise006 ? "Perform governed read-only cart inventory" : scopeIsExercise005 ? "Perform governed read-only collection page inventory" : "Perform governed read-only product page inventory")
        : !afterEvidenceCaptured
          ? "Capture After Evidence"
        : !proofReady
            ? (scopeIsExercise006 ? "Generate Exercise 006 Mission Proof Package" : scopeIsExercise005 ? "Generate Exercise 005 Mission Proof Package" : "Generate Mission Proof Package")
            : !certificationMemoReady
              ? (scopeIsExercise006 ? "Certify Exercise 006" : scopeIsExercise005 ? "Certify Exercise 005" : "Certify Mission 001 Exercise 004")
              : paymentRequired
                ? "Resolve payment applicability"
                : (scopeIsExercise006 ? "Plan Exercise 007 - Header Navigation Inventory" : scopeIsExercise005 ? "Plan Exercise 006 - Cart Inventory" : "Plan Exercise 005 - Collection Page Inventory");

  const productionOperationPermitted = merchantBindingPass;
  const completionPermitted = false;
  const status = merchantBindingPass && !paymentRequired && gatingReasons.length > 0 ? "CONDITIONAL_GO" : merchantBindingPass && !gatingReasons.length ? "GO" : "NO_GO";

  const report = {
    schema: "staffordos.nokings_mission_001_readiness.v1",
    generated_at: new Date().toISOString(),
    status,
    production_operation_permitted: productionOperationPermitted,
    completion_permitted: completionPermitted,
    merchant: {
      merchant_name: clean(binding?.merchant?.merchant_name, "NoKings Athletics"),
      store: store,
      canonical_store_domain: clean(binding?.canonical_store_domain, "no-kings-athletics.myshopify.com"),
      storefront_url: storefrontUrl,
      shopify_admin_identity: clean(binding?.shopify_admin_identity, "Not Yet Available"),
      product: clean(binding?.product, "ShopiFixer"),
      environment_type: clean(binding?.environment_type, "controlled_training"),
      proof_run_id: proofRunId,
      proof_run_path: proofRunPath
    },
    active_exercise: activeExerciseLabel || "Not Yet Available",
    current_phase: currentPhase,
    current_blocker: currentBlocker,
    blocking_reasons: gatingReasons,
    next_safe_action: nextSafeAction,
    payment_required: paymentRequired,
    scope_authority: {
      index_path: scopeIndexPath,
      active_scope_path: activeScopePath || "Not Yet Available",
      active_exercise: activeExerciseLabel || "Not Yet Available"
    },
    gates: {
      merchant_binding: merchantBindingPass ? stageStatus("pass", "NoKings binding established") : stageStatus("blocked", "NoKings binding incomplete"),
      scope: scopeComplete ? stageStatus("pass", "Governed mission scope established") : stageStatus("blocked", scopeBlocker),
      before_evidence: beforeEvidenceCaptured ? stageStatus("pass", "Before evidence scaffold present") : stageStatus("blocked", "Before Evidence Missing"),
      execution: executionAuthorityPass ? stageStatus("pass", "Governed analysis completed and next phase may proceed") : stageStatus("blocked", scopeIsExercise006 ? "Cart Inventory Not Performed" : scopeIsExercise005 ? "Collection Page Inventory Not Performed" : "Product Page Inventory Not Performed"),
      after_evidence: afterEvidenceCaptured ? stageStatus("pass", "After evidence scaffold present") : stageStatus("blocked", "After Evidence Missing"),
      proof: proofReady ? stageStatus("pass", "Mission proof package recognized") : stageStatus("blocked", "Proof Package Missing"),
      mission_certification: proofReady
        ? (certificationMemoReady
            ? stageStatus("pass", scopeIsExercise006 ? "Mission 001 Exercise 006 certified" : scopeIsExercise005 ? "Mission 001 Exercise 005 certified" : "Mission 001 Exercise 004 certified")
            : stageStatus("blocked", "Mission Certification Missing"))
        : stageStatus("blocked", "Proof Package Missing"),
      exercise_005_planning: scopeIsExercise004 && certificationMemoReady ? stageStatus("blocked", "Exercise 005 Planning Missing") : stageStatus("blocked", scopeIsExercise006 ? "Superseded by Exercise 006 scope" : scopeIsExercise005 ? "Superseded by Exercise 006 planning" : "Mission Certification Missing"),
      exercise_006_planning: scopeIsExercise006 ? stageStatus("pass", "Exercise 006 scope created") : scopeIsExercise005 && certificationMemoReady ? stageStatus("blocked", "Exercise 006 Planning Missing") : stageStatus("blocked", "Mission Certification Missing"),
      rollback: rollbackReady ? stageStatus("pass", "Separate mission proof-run path is available for rollback") : stageStatus("blocked", "Rollback path not yet established"),
      payment_applicability: paymentRequired
        ? stageStatus("blocked", paymentAuthority)
        : stageStatus("pass", "No payment required unless canonical mission doctrine explicitly requires it")
    },
    scores: {
      merchant_binding: merchantBindingPass ? 100 : 0,
      scope: scopeComplete ? 100 : 25,
      before_evidence: beforeEvidenceCaptured ? 100 : 0,
      execution: executionAuthorityPass ? 100 : 0,
      after_evidence: afterEvidenceCaptured ? 100 : 0,
      proof: proofReady ? 100 : 0,
      mission_certification: certificationMemoReady ? 100 : 0,
      exercise_005_planning: certificationMemoReady ? 0 : 0,
      rollback: rollbackReady ? 100 : 50,
      payment: paymentRequired ? 0 : 100,
      overall: merchantBindingPass ? (scopeComplete ? (beforeEvidenceCaptured ? (certificationMemoReady ? 80 : 70) : 40) : 35) : 0
    },
    evidence_sources: [
      "STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md",
      "SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md",
      "SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md",
      "staffordos/governance/archive/20260604_artifact_archive/canonical_systems_v1.md",
      "staffordos/governance/archive/20260604_artifact_archive/canonical_artifact_inventory_v1.md",
      "staffordos/governance/archive/20260604_artifact_archive/commercialization_truth_map_v1.md",
      "staffordos/governance/archive/20260604_artifact_archive/commercialization_gaps_v1.md",
      "staffordos/audits/no_kings/evidence/before_evidence_record_v1.md",
      "staffordos/audits/no_kings/evidence/before/homepage_desktop_before.png",
      "staffordos/audits/no_kings/evidence/before/homepage_mobile_before.png",
      "staffordos/audits/no_kings/execution_truth/execution_access_result_v1.md",
      "staffordos/audits/no_kings/execution_truth/theme_pull_test_v2.txt",
      bindingPath,
      scopeIndexPath,
      activeScopePath,
      beforePath,
      afterPath,
      proofPackagePath,
      executionNotesPath,
      (scopeIsExercise006 || scopeIsExercise005) ? exercise005CertificationMemoPath : certificationMemoPath
    ],
    warnings: [
      "Mission 001 is a controlled training environment, not paid-commercial work.",
      "NoKings evidence remains a separate proof target from the generic cart-agent-dev ShopiFixer pilot.",
      "No seal or completion truth is fabricated.",
      "No Shopify mutation is performed by this evaluator."
    ]
  };

  return report;
}

function runCli() {
  const repoRoot = process.env.NOKINGS_REPO_ROOT ? path.resolve(process.env.NOKINGS_REPO_ROOT) : DEFAULT_REPO_ROOT;
  const bindingPath = process.env.NOKINGS_BINDING_PATH ? path.resolve(process.env.NOKINGS_BINDING_PATH) : DEFAULT_BINDING_PATH;
  const proofRunDir = process.env.NOKINGS_PROOF_RUN_DIR ? path.resolve(process.env.NOKINGS_PROOF_RUN_DIR) : DEFAULT_PROOF_RUN_DIR;
  const outputPath = process.env.NOKINGS_READINESS_OUTPUT_PATH ? path.resolve(process.env.NOKINGS_READINESS_OUTPUT_PATH) : DEFAULT_OUTPUT_PATH;
  const report = evaluateNokingsMissionReadiness({ repoRoot, bindingPath, proofRunDir });
  writeJson(outputPath, report);
  console.log(
    `NoKings Mission 001 readiness: ${report.status} | phase=${report.current_phase} | blocker=${report.current_blocker} | next=${report.next_safe_action} | payment=${report.payment_required ? "required" : "not_required"} | completion=${report.completion_permitted ? "yes" : "no"}`
  );
  process.exit(report.status === "NO_GO" ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}

function pathToFileURL(filePath) {
  return new URL(`file://${path.resolve(filePath)}`);
}

export { evaluateNokingsMissionReadiness };
