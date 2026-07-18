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
const DEFAULT_EXERCISE_006_CERTIFICATION_MEMO_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/implementation/p11_14_mission_001_exercise_006_certification_v1.md");
const DEFAULT_EXERCISE_007_CERTIFICATION_MEMO_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/implementation/p11_21_mission_001_exercise_007_certification_v1.md");
const DEFAULT_EXERCISE_008_CERTIFICATION_MEMO_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/implementation/p11_28_mission_001_exercise_008_certification_v1.md");
const DEFAULT_EXERCISE_009_CERTIFICATION_MEMO_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/implementation/p11_36_mission_001_exercise_009_certification_v1.md");
const DEFAULT_EXERCISE_010_CERTIFICATION_MEMO_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/implementation/p11_43_mission_001_exercise_010_certification_v1.md");
const DEFAULT_GATE_ASSESSMENT_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/implementation/p11_44_mission_001_readiness_gate_assessment_v1.md");
const DEFAULT_APPLIED_CHANGE_EXECUTION_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/implementation/p11_51_mission_001_governed_applied_change_execution_v1.md");
const DEFAULT_ROLLBACK_REHEARSAL_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/implementation/p11_52_mission_001_governed_rollback_rehearsal_v1.md");
const DEFAULT_MISSION_001_COMPLETION_CERTIFICATION_PATH = path.join(DEFAULT_REPO_ROOT, "staffordos/implementation/p11_53_mission_001_completion_certification_v1.md");
const DEFAULT_OUTPUT_PATH = path.join(MODULE_DIR, "output", "nokings_mission_001_readiness_v1.json");
const MISSION_001_CAPABILITY_GATE_BLOCKER = "Mission 001 Gate Unmet: Applied-Change And Executed-Rollback Capability Classes Missing";
const MISSION_001_CAPABILITY_GATE_ACTION = "Authorize governed applied-change remediation mission to demonstrate applied-change and executed-rollback capability classes";
const MISSION_001_COMPLETION_CERTIFICATION_BLOCKER = "Mission 001 Completion Certification Missing";
const MISSION_001_COMPLETION_CERTIFICATION_ACTION = "Certify Mission 001 completion under amended capability-class gate";
const MISSION_001_COMPLETE_ACTION = "Begin next governed mission selection after Mission 001 completion certification";

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
    cartArchitectureCertified: hasSection("Cart Architecture Certified"),
    headerNavigationArchitectureCertified: hasSection("Header Navigation Architecture Certified"),
    trustBadgeArchitectureCertified: hasSection("Trust Badge Architecture Certified"),
    footerArchitectureCertified: hasSection("Footer Architecture Certified"),
    safeEditSimulationCertified: hasSection("Safe Edit Simulation Certified"),
    repositoryTruthReviewed: hasSection("Repository Truth Reviewed"),
    readinessAssessment: hasSection("Readiness Assessment"),
    recommendation: hasSection("Recommendation for Exercise 005"),
    nextCanonicalExercise: hasSection("Next Canonical Exercise"),
    nextCanonicalMission: hasSection("Next Canonical Mission"),
    unsupportedClaimsExcluded: hasSection("Unsupported Claims Explicitly Excluded"),
    mutationAndRollbackAssessment: hasSection("Mutation And Rollback Assessment") || hasSection("Mutation and Rollback Assessment"),
    exercise006Recommended: hasLine("Exercise 006 - Cart Inventory") && hasLine("ex_006_cart_inventory"),
    exercise007Recommended: hasLine("Exercise 007 - Header Navigation Inventory") && hasLine("ex_007_header_navigation_inventory"),
    exercise008Recommended: hasLine("Exercise 008 - Trust Badge Inventory") && hasLine("ex_008_trust_badge_inventory"),
    exercise009Recommended: hasLine("Exercise 009 - Footer Inventory") && hasLine("ex_009_footer_inventory"),
    exercise010Recommended: hasLine("Exercise 010 - Safe Edit Simulation") && hasLine("ex_010_safe_edit_simulation"),
    noShopifyMutation: hasLine("No Shopify mutation occurred")
  };
}

function parseAppliedChangeExecution(content) {
  const text = String(content || "");
  const has = (needle) => text.includes(needle);
  return {
    present: Boolean(text.trim()),
    mission: has("Mission 001 - NoKings Shopify Engineering Training"),
    store: has("no-kings-athletics.myshopify.com"),
    theme: has("Horizon") && has("166489554980") && has("live"),
    asset: has("templates/index.json"),
    path: has(".sections.section_fDNEmL.blocks.text_UEkm8A.settings.text"),
    beforeValue: has("<h2>JOIN THE RELENTLES</h2>"),
    afterValue: has("<h2>JOIN THE RELENTLESS</h2>"),
    beforeHash: has("8cf9c0fa3960e4e5df13d4c2398f019960acde4137cfe1f5dcec0ec62fce5e1e"),
    afterHash: has("10e2dcf14d5ef49235a94f99f2053b69f5957799718d995d2b2b2e9aec9f02b7"),
    desktopValidated: has("After desktop rendered target text: `JOIN THE RELENTLESS`"),
    mobileValidated: has("After mobile rendered target text: `JOIN THE RELENTLESS`"),
    oneAsset: has("Shopify assets pushed: one") && has("Asset pushed: `templates/index.json`"),
    oneValue: has("JSON values changed: one") || has("Diff scope: one logical JSON value"),
    emergencyRollbackNotRequired: /Emergency rollback status:\s*not required/i.test(text),
    noPayment: has("Payment activity: none")
  };
}

function parseRollbackRehearsal(content) {
  const text = String(content || "");
  const has = (needle) => text.includes(needle);
  return {
    present: Boolean(text.trim()),
    mission: has("Mission 001 - NoKings Shopify Engineering Training"),
    store: has("no-kings-athletics.myshopify.com"),
    theme: has("Horizon") && has("166489554980") && has("live"),
    asset: has("templates/index.json"),
    path: has(".sections.section_fDNEmL.blocks.text_UEkm8A.settings.text"),
    currentValue: has("<h2>JOIN THE RELENTLESS</h2>"),
    rollbackValue: has("<h2>JOIN THE RELENTLES</h2>"),
    rollbackHash: has("8cf9c0fa3960e4e5df13d4c2398f019960acde4137cfe1f5dcec0ec62fce5e1e"),
    postChangeHash: has("10e2dcf14d5ef49235a94f99f2053b69f5957799718d995d2b2b2e9aec9f02b7"),
    desktopValidated: has("Final desktop rendered target text: `JOIN THE RELENTLES`"),
    mobileValidated: has("Final mobile rendered target text: `JOIN THE RELENTLES`"),
    oneAsset: has("Shopify assets pushed: one") && has("Asset pushed: `templates/index.json`"),
    oneValue: has("JSON values restored: one"),
    restoredBaseline: has("Diff against captured rollback baseline: none"),
    noPayment: has("Payment activity: none")
  };
}

function parseMissionCompletionCertification(content) {
  const text = String(content || "");
  const has = (needle) => text.includes(needle);
  const hasSection = (heading) => new RegExp(`##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(text);
  return {
    present: Boolean(text.trim()),
    mission: has("Mission 001 - NoKings Shopify Engineering Training"),
    store: has("no-kings-athletics.myshopify.com"),
    doctrineAuthority: hasSection("Doctrine Authority"),
    evidenceReviewed: hasSection("Evidence Reviewed"),
    capabilityMatrix: hasSection("Capability-Class Matrix"),
    appliedChangeSummary: hasSection("P11.51 Applied-Change Summary"),
    rollbackSummary: hasSection("P11.52 Rollback Summary"),
    restorationProof: hasSection("Source And Hash Restoration Proof"),
    scopeControlProof: hasSection("Scope-Control Proof"),
    gateEvaluation: hasSection("Amended Gate Evaluation"),
    competencyDecision: hasSection("Competency Update Decision"),
    finalStatus: has("Mission 001 status: `complete`"),
    verdict: /\*\*(GO|CONDITIONAL GO)\*\*/i.test(text),
    completionPassed: has("MISSION 001 COMPLETION CERTIFICATION PASSED"),
    noSecrets: !/(token|cookie|session_secret|access_token)\s*[:=]/i.test(text)
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

const EXERCISE_DEFINITIONS = [
  {
    slug: "exercise_004",
    label: "Exercise 004 - Product Page Inventory",
    scopePattern: /Exercise 004 - Product Page Inventory/i,
    targetPattern: /templates\/product\.json|product page inventory/i,
    evidencePattern: /product/i,
    analysisPhase: "product_page_inventory",
    analysisBlocker: "Product Page Inventory Not Performed",
    analysisAction: "Perform governed read-only product page inventory",
    proofAction: "Generate Mission Proof Package",
    certificationAction: "Certify Mission 001 Exercise 004",
    nextPlanningPhase: "exercise_005_planning",
    nextPlanningBlocker: "Exercise 005 Planning Missing",
    nextPlanningAction: "Plan Exercise 005 - Collection Page Inventory"
  },
  {
    slug: "exercise_005",
    label: "Exercise 005 - Collection Page Inventory",
    scopePattern: /Exercise 005 - Collection Page Inventory/i,
    targetPattern: /templates\/collection\.json|collection page inventory/i,
    evidencePattern: /collection/i,
    analysisPhase: "collection_page_inventory",
    analysisBlocker: "Collection Page Inventory Not Performed",
    analysisAction: "Perform governed read-only collection page inventory",
    proofAction: "Generate Exercise 005 Mission Proof Package",
    certificationAction: "Certify Exercise 005",
    nextPlanningPhase: "exercise_006_planning",
    nextPlanningBlocker: "Exercise 006 Planning Missing",
    nextPlanningAction: "Plan Exercise 006 - Cart Inventory"
  },
  {
    slug: "exercise_006",
    label: "Exercise 006 - Cart Inventory",
    scopePattern: /Exercise 006 - Cart Inventory/i,
    targetPattern: /templates\/cart\.json|cart inventory/i,
    evidencePattern: /cart/i,
    analysisPhase: "cart_inventory",
    analysisBlocker: "Cart Inventory Not Performed",
    analysisAction: "Perform governed read-only cart inventory",
    proofAction: "Generate Exercise 006 Mission Proof Package",
    certificationAction: "Certify Exercise 006",
    nextPlanningPhase: "exercise_007_planning",
    nextPlanningBlocker: "Exercise 007 Planning Missing",
    nextPlanningAction: "Plan Exercise 007 - Header Navigation Inventory"
  },
  {
    slug: "exercise_007",
    label: "Exercise 007 - Header Navigation Inventory",
    scopePattern: /Exercise 007 - Header Navigation Inventory/i,
    targetPattern: /sections\/header-group\.json|sections\/header\.liquid|header navigation inventory/i,
    evidencePattern: /header|navigation|mobile menu/i,
    analysisPhase: "header_navigation_inventory",
    analysisBlocker: "Header Navigation Inventory Not Performed",
    analysisAction: "Perform governed read-only header navigation inventory",
    proofAction: "Generate Exercise 007 Mission Proof Package",
    certificationAction: "Certify Exercise 007",
    nextPlanningPhase: "exercise_008_planning",
    nextPlanningBlocker: "Exercise 008 Planning Missing",
    nextPlanningAction: "Plan Exercise 008 - Trust Badge Inventory"
  },
  {
    slug: "exercise_008",
    label: "Exercise 008 - Trust Badge Inventory",
    scopePattern: /Exercise 008 - Trust Badge Inventory/i,
    targetPattern: /trust badge inventory|snippets\/buy-buttons-styles\.liquid|blocks\/payment-icons\.liquid|snippets\/product-badges-styles\.liquid|snippets\/button\.liquid/i,
    evidencePattern: /trust|badge|payment|button|checkout|shipping|returns|reassurance/i,
    analysisPhase: "trust_badge_inventory",
    analysisBlocker: "Trust Badge Inventory Not Performed",
    analysisAction: "Perform governed read-only trust badge inventory",
    proofAction: "Generate Exercise 008 Mission Proof Package",
    certificationAction: "Certify Exercise 008",
    nextPlanningPhase: "exercise_009_planning",
    nextPlanningBlocker: "Exercise 009 Planning Missing",
    nextPlanningAction: "Plan Exercise 009 - Footer Inventory"
  },
  {
    slug: "exercise_009",
    label: "Exercise 009 - Footer Inventory",
    scopePattern: /Exercise 009 - Footer Inventory/i,
    targetPattern: /footer inventory|sections\/footer-group\.json|sections\/footer\.liquid|sections\/footer-utilities\.liquid/i,
    evidencePattern: /footer|policy|signup|social|copyright|utilities/i,
    analysisPhase: "footer_inventory",
    analysisBlocker: "Footer Inventory Not Performed",
    analysisAction: "Perform governed read-only footer inventory",
    proofAction: "Generate Exercise 009 Mission Proof Package",
    certificationAction: "Certify Exercise 009",
    nextPlanningPhase: "exercise_010_planning",
    nextPlanningBlocker: "Exercise 010 Planning Missing",
    nextPlanningAction: "Plan Exercise 010 - Safe Edit Simulation"
  },
  {
    slug: "exercise_010",
    label: "Exercise 010 - Safe Edit Simulation",
    scopePattern: /Exercise 010 - Safe Edit Simulation/i,
    targetPattern: /safe edit simulation|smallest-safe change|proposed diff/i,
    evidencePattern: /safe edit|smallest-safe|rollback|proposed|diff|baseline|simulation/i,
    analysisPhase: "safe_edit_simulation",
    analysisBlocker: "Safe Edit Simulation Not Performed",
    analysisAction: "Perform governed safe edit simulation",
    proofAction: "Generate Exercise 010 Mission Proof Package",
    certificationAction: "Certify Exercise 010",
    nextPlanningPhase: "mission_001_gate_assessment",
    nextPlanningBlocker: "Mission 001 Gate Assessment Missing",
    nextPlanningAction: "Assess Mission 001 readiness gate"
  }
];

function exerciseByLabel(label) {
  return EXERCISE_DEFINITIONS.find((exercise) => exercise.scopePattern.test(label)) || null;
}

function exerciseBySlug(slug) {
  return EXERCISE_DEFINITIONS.find((exercise) => exercise.slug === slug) || null;
}

function latestExistingExercise(proofRunDir) {
  return [...EXERCISE_DEFINITIONS]
    .reverse()
    .find((exercise) => fs.existsSync(path.join(proofRunDir, "exercises", exercise.slug, "fix_scope.md"))) || null;
}

function exerciseIndex(exercise) {
  return exercise ? EXERCISE_DEFINITIONS.findIndex((candidate) => candidate.slug === exercise.slug) : -1;
}

function evaluateNokingsMissionReadiness({
  repoRoot = DEFAULT_REPO_ROOT,
  bindingPath = DEFAULT_BINDING_PATH,
  proofRunDir = DEFAULT_PROOF_RUN_DIR,
  certificationMemoPath = DEFAULT_CERTIFICATION_MEMO_PATH,
  exercise005CertificationMemoPath = DEFAULT_EXERCISE_005_CERTIFICATION_MEMO_PATH,
  exercise006CertificationMemoPath = DEFAULT_EXERCISE_006_CERTIFICATION_MEMO_PATH,
  exercise007CertificationMemoPath = DEFAULT_EXERCISE_007_CERTIFICATION_MEMO_PATH,
  exercise008CertificationMemoPath = DEFAULT_EXERCISE_008_CERTIFICATION_MEMO_PATH,
  exercise009CertificationMemoPath = DEFAULT_EXERCISE_009_CERTIFICATION_MEMO_PATH,
  exercise010CertificationMemoPath = DEFAULT_EXERCISE_010_CERTIFICATION_MEMO_PATH,
  gateAssessmentPath = DEFAULT_GATE_ASSESSMENT_PATH,
  appliedChangeExecutionPath = DEFAULT_APPLIED_CHANGE_EXECUTION_PATH,
  rollbackRehearsalPath = DEFAULT_ROLLBACK_REHEARSAL_PATH,
  mission001CompletionCertificationPath = DEFAULT_MISSION_001_COMPLETION_CERTIFICATION_PATH
} = {}) {
  const binding = loadBinding(bindingPath);
  const scopeIndexPath = path.join(proofRunDir, "fix_scope.md");
  const missionScopeIndex = parseMarkdownFields(readText(scopeIndexPath));
  const rootActiveExerciseLabel = clean(missionScopeIndex.activeExercise);
  const latestExercise = latestExistingExercise(proofRunDir);
  const rootExercise = exerciseByLabel(rootActiveExerciseLabel);
  const activeExercise = latestExercise && exerciseIndex(latestExercise) > exerciseIndex(rootExercise)
    ? latestExercise
    : rootExercise || latestExercise;
  const activeExerciseLabel = activeExercise?.label || rootActiveExerciseLabel;
  const activeExerciseSlug = activeExercise?.slug || "";
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
  const exercise006CertificationMemo = parseCertificationMemo(readText(exercise006CertificationMemoPath));
  const exercise007CertificationMemo = parseCertificationMemo(readText(exercise007CertificationMemoPath));
  const exercise008CertificationMemo = parseCertificationMemo(readText(exercise008CertificationMemoPath));
  const exercise009CertificationMemo = parseCertificationMemo(readText(exercise009CertificationMemoPath));
  const exercise010CertificationMemo = parseCertificationMemo(readText(exercise010CertificationMemoPath));
  const appliedChangeExecution = parseAppliedChangeExecution(readText(appliedChangeExecutionPath));
  const rollbackRehearsal = parseRollbackRehearsal(readText(rollbackRehearsalPath));
  const mission001CompletionCertification = parseMissionCompletionCertification(readText(mission001CompletionCertificationPath));

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
  const scopeIsExercise007 = /Exercise 007 - Header Navigation Inventory/i.test(activeScopeObjective) || /sections\/header-group\.json|sections\/header\.liquid|header navigation inventory/i.test(activeScopeTarget);
  const scopeIsExercise008 = /Exercise 008 - Trust Badge Inventory/i.test(activeScopeObjective) || /trust badge inventory|snippets\/buy-buttons-styles\.liquid|blocks\/payment-icons\.liquid|snippets\/product-badges-styles\.liquid|snippets\/button\.liquid/i.test(activeScopeTarget);
  const scopeIsExercise009 = /Exercise 009 - Footer Inventory/i.test(activeScopeObjective) || /footer inventory|sections\/footer-group\.json|sections\/footer\.liquid|sections\/footer-utilities\.liquid/i.test(activeScopeTarget);
  const scopeIsExercise010 = /Exercise 010 - Safe Edit Simulation/i.test(activeScopeObjective) || /safe edit simulation|smallest-safe change|proposed diff/i.test(activeScopeTarget);
  const activeExerciseDefinition = exerciseBySlug(activeExerciseSlug);
  const scopeMatchesActiveExercise = activeExerciseDefinition
    ? (activeExerciseDefinition.scopePattern.test(activeScopeObjective) || activeExerciseDefinition.targetPattern.test(activeScopeTarget))
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
  const beforeEvidenceRelevant = activeExerciseDefinition ? activeExerciseDefinition.evidencePattern.test(beforeEvidenceText) : false;
  const beforeEvidenceCaptured = (clean(beforeEvidence.status).toLowerCase() === "complete" || clean(beforeEvidence.status).toLowerCase() === "captured") && beforeEvidenceRelevant;
  const analysisPhase = activeExerciseDefinition?.analysisPhase || "product_page_inventory";
  const analysisBlocker = activeExerciseDefinition?.analysisBlocker || "Product Page Inventory Not Performed";
  const executionNotesText = [executionNotes.objective, executionNotes.issue, executionNotes.affectedPage, executionNotes.notes].join(" ");
  const analysisComplete = activeExerciseDefinition
    ? clean(executionNotes.status).toLowerCase() === "complete" && activeExerciseDefinition.evidencePattern.test(executionNotesText)
    : clean(executionNotes.status).toLowerCase() === "complete" || clean(executionNotes.status).toLowerCase() === "captured";
  const executionAuthorityPass = merchantBindingPass && scopeComplete && beforeEvidenceCaptured && analysisComplete;
  const afterEvidenceText = [afterEvidence.objective, afterEvidence.issue, afterEvidence.affectedPage, afterEvidence.notes].join(" ");
  const afterEvidenceCaptured = activeExerciseDefinition
    ? (clean(afterEvidence.status).toLowerCase() === "complete" || clean(afterEvidence.status).toLowerCase() === "captured") && activeExerciseDefinition.evidencePattern.test(afterEvidenceText)
    : clean(afterEvidence.status).toLowerCase() === "complete" || clean(afterEvidence.status).toLowerCase() === "captured";
  const proofPackageStoreMatches = normalizeStore(proofPackage.store) === normalizeStore(binding?.canonical_store_domain);
  const proofPackageMatchesActiveExercise = activeExerciseDefinition
    ? activeExerciseDefinition.scopePattern.test(proofPackageText) && activeExerciseDefinition.evidencePattern.test(proofPackageText)
    : false;
  const proofReady = ["complete", "assembled", "recognized"].includes(clean(proofPackage.status).toLowerCase()) && proofPackageStoreMatches && proofPackageMatchesActiveExercise;
  const certificationDecision = clean(certificationMemo.certificationDecision).toUpperCase();
  const exercise005CertificationDecision = clean(exercise005CertificationMemo.certificationDecision).toUpperCase();
  const exercise006CertificationDecision = clean(exercise006CertificationMemo.certificationDecision).toUpperCase();
  const exercise007CertificationDecision = clean(exercise007CertificationMemo.certificationDecision).toUpperCase();
  const exercise008CertificationDecision = clean(exercise008CertificationMemo.certificationDecision).toUpperCase();
  const exercise009CertificationDecision = clean(exercise009CertificationMemo.certificationDecision).toUpperCase();
  const exercise010CertificationDecision = clean(exercise010CertificationMemo.certificationDecision).toUpperCase();
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
  const exercise006CertificationReady = Boolean(exercise006CertificationMemo.present &&
      exercise006CertificationMemo.missionId === "mission_001" &&
      exercise006CertificationMemo.exercise === "Exercise 006 - Cart Inventory" &&
      normalizeStore(exercise006CertificationMemo.canonicalStore) === "no-kings-athletics.myshopify.com" &&
      exercise006CertificationMemo.merchant === "NoKings Athletics" &&
      ["GO", "CONDITIONAL GO"].includes(exercise006CertificationDecision) &&
      exercise006CertificationMemo.evidenceChainReviewed &&
      exercise006CertificationMemo.cartArchitectureCertified &&
      exercise006CertificationMemo.repositoryTruthReviewed &&
      exercise006CertificationMemo.readinessAssessment &&
      exercise006CertificationMemo.unsupportedClaimsExcluded &&
      exercise006CertificationMemo.mutationAndRollbackAssessment &&
      exercise006CertificationMemo.nextCanonicalExercise &&
      exercise006CertificationMemo.exercise007Recommended &&
      exercise006CertificationMemo.noShopifyMutation);
  const exercise007CertificationReady = Boolean(exercise007CertificationMemo.present &&
      exercise007CertificationMemo.missionId === "mission_001" &&
      exercise007CertificationMemo.exercise === "Exercise 007 - Header Navigation Inventory" &&
      normalizeStore(exercise007CertificationMemo.canonicalStore) === "no-kings-athletics.myshopify.com" &&
      exercise007CertificationMemo.merchant === "NoKings Athletics" &&
      ["GO", "CONDITIONAL GO"].includes(exercise007CertificationDecision) &&
      exercise007CertificationMemo.evidenceChainReviewed &&
      exercise007CertificationMemo.headerNavigationArchitectureCertified &&
      exercise007CertificationMemo.repositoryTruthReviewed &&
      exercise007CertificationMemo.readinessAssessment &&
      exercise007CertificationMemo.unsupportedClaimsExcluded &&
      exercise007CertificationMemo.mutationAndRollbackAssessment &&
      exercise007CertificationMemo.nextCanonicalExercise &&
      exercise007CertificationMemo.exercise008Recommended &&
      exercise007CertificationMemo.noShopifyMutation);
  const exercise008CertificationReady = Boolean(exercise008CertificationMemo.present &&
      exercise008CertificationMemo.missionId === "mission_001" &&
      exercise008CertificationMemo.exercise === "Exercise 008 - Trust Badge Inventory" &&
      normalizeStore(exercise008CertificationMemo.canonicalStore) === "no-kings-athletics.myshopify.com" &&
      exercise008CertificationMemo.merchant === "NoKings Athletics" &&
      ["GO", "CONDITIONAL GO"].includes(exercise008CertificationDecision) &&
      exercise008CertificationMemo.evidenceChainReviewed &&
      exercise008CertificationMemo.trustBadgeArchitectureCertified &&
      exercise008CertificationMemo.repositoryTruthReviewed &&
      exercise008CertificationMemo.readinessAssessment &&
      exercise008CertificationMemo.unsupportedClaimsExcluded &&
      exercise008CertificationMemo.mutationAndRollbackAssessment &&
      exercise008CertificationMemo.nextCanonicalExercise &&
      exercise008CertificationMemo.exercise009Recommended &&
      exercise008CertificationMemo.noShopifyMutation);
  const exercise009CertificationReady = Boolean(exercise009CertificationMemo.present &&
      exercise009CertificationMemo.missionId === "mission_001" &&
      exercise009CertificationMemo.exercise === "Exercise 009 - Footer Inventory" &&
      normalizeStore(exercise009CertificationMemo.canonicalStore) === "no-kings-athletics.myshopify.com" &&
      exercise009CertificationMemo.merchant === "NoKings Athletics" &&
      ["GO", "CONDITIONAL GO"].includes(exercise009CertificationDecision) &&
      exercise009CertificationMemo.evidenceChainReviewed &&
      exercise009CertificationMemo.footerArchitectureCertified &&
      exercise009CertificationMemo.repositoryTruthReviewed &&
      exercise009CertificationMemo.readinessAssessment &&
      exercise009CertificationMemo.unsupportedClaimsExcluded &&
      exercise009CertificationMemo.mutationAndRollbackAssessment &&
      exercise009CertificationMemo.nextCanonicalExercise &&
      exercise009CertificationMemo.exercise010Recommended &&
      exercise009CertificationMemo.noShopifyMutation);
  const exercise010CertificationReady = Boolean(exercise010CertificationMemo.present &&
      exercise010CertificationMemo.missionId === "mission_001" &&
      exercise010CertificationMemo.exercise === "Exercise 010 - Safe Edit Simulation" &&
      normalizeStore(exercise010CertificationMemo.canonicalStore) === "no-kings-athletics.myshopify.com" &&
      exercise010CertificationMemo.merchant === "NoKings Athletics" &&
      ["GO", "CONDITIONAL GO"].includes(exercise010CertificationDecision) &&
      exercise010CertificationMemo.evidenceChainReviewed &&
      exercise010CertificationMemo.safeEditSimulationCertified &&
      exercise010CertificationMemo.repositoryTruthReviewed &&
      exercise010CertificationMemo.readinessAssessment &&
      exercise010CertificationMemo.unsupportedClaimsExcluded &&
      exercise010CertificationMemo.mutationAndRollbackAssessment &&
      exercise010CertificationMemo.nextCanonicalMission &&
      exercise010CertificationMemo.noShopifyMutation);
  const certificationMemoReady = scopeIsExercise004
    ? exercise004CertificationReady
    : scopeIsExercise005
      ? exercise005CertificationReady
      : scopeIsExercise006
        ? exercise006CertificationReady
        : scopeIsExercise007
          ? exercise007CertificationReady
          : scopeIsExercise008
            ? exercise008CertificationReady
            : scopeIsExercise009
              ? exercise009CertificationReady
              : scopeIsExercise010
                ? exercise010CertificationReady
                : false;
  const gateAssessmentText = readText(gateAssessmentPath);
  const gateAssessmentPresent = Boolean(gateAssessmentText.trim()) && /Gate Decision/i.test(gateAssessmentText) && /CONDITIONAL_GO/.test(gateAssessmentText);
  const appliedChangeReady = Boolean(appliedChangeExecution.present &&
    appliedChangeExecution.mission &&
    appliedChangeExecution.store &&
    appliedChangeExecution.theme &&
    appliedChangeExecution.asset &&
    appliedChangeExecution.path &&
    appliedChangeExecution.beforeValue &&
    appliedChangeExecution.afterValue &&
    appliedChangeExecution.beforeHash &&
    appliedChangeExecution.afterHash &&
    appliedChangeExecution.desktopValidated &&
    appliedChangeExecution.mobileValidated &&
    appliedChangeExecution.oneAsset &&
    appliedChangeExecution.oneValue &&
    appliedChangeExecution.emergencyRollbackNotRequired &&
    appliedChangeExecution.noPayment);
  const rollbackRehearsalReady = Boolean(rollbackRehearsal.present &&
    rollbackRehearsal.mission &&
    rollbackRehearsal.store &&
    rollbackRehearsal.theme &&
    rollbackRehearsal.asset &&
    rollbackRehearsal.path &&
    rollbackRehearsal.currentValue &&
    rollbackRehearsal.rollbackValue &&
    rollbackRehearsal.rollbackHash &&
    rollbackRehearsal.postChangeHash &&
    rollbackRehearsal.desktopValidated &&
    rollbackRehearsal.mobileValidated &&
    rollbackRehearsal.oneAsset &&
    rollbackRehearsal.oneValue &&
    rollbackRehearsal.restoredBaseline &&
    rollbackRehearsal.noPayment);
  const safeFixProposalReady = Boolean(scopeIsExercise010 && exercise010CertificationReady);
  const missionCapabilityGateMet = Boolean(scopeIsExercise010 && certificationMemoReady && gateAssessmentPresent && safeFixProposalReady && appliedChangeReady && rollbackRehearsalReady);
  const mission001CompletionCertificationReady = Boolean(mission001CompletionCertification.present &&
    mission001CompletionCertification.mission &&
    mission001CompletionCertification.store &&
    mission001CompletionCertification.doctrineAuthority &&
    mission001CompletionCertification.evidenceReviewed &&
    mission001CompletionCertification.capabilityMatrix &&
    mission001CompletionCertification.appliedChangeSummary &&
    mission001CompletionCertification.rollbackSummary &&
    mission001CompletionCertification.restorationProof &&
    mission001CompletionCertification.scopeControlProof &&
    mission001CompletionCertification.gateEvaluation &&
    mission001CompletionCertification.competencyDecision &&
    mission001CompletionCertification.finalStatus &&
    mission001CompletionCertification.verdict &&
    mission001CompletionCertification.completionPassed &&
    mission001CompletionCertification.noSecrets);
  const mission001Complete = Boolean(missionCapabilityGateMet && mission001CompletionCertificationReady && !paymentRequired);
  const gateRemediationActive = scopeIsExercise010 && certificationMemoReady && gateAssessmentPresent && !missionCapabilityGateMet;
  const missionCompletionCertificationActive = scopeIsExercise010 && certificationMemoReady && gateAssessmentPresent && missionCapabilityGateMet && !mission001CompletionCertificationReady;
  const nextPlanningBlocker = mission001Complete
    ? ""
    : missionCompletionCertificationActive
      ? MISSION_001_COMPLETION_CERTIFICATION_BLOCKER
      : gateRemediationActive
        ? MISSION_001_CAPABILITY_GATE_BLOCKER
        : (activeExerciseDefinition?.nextPlanningBlocker || "Exercise 005 Planning Missing");
  const nextPlanningPhase = mission001Complete
    ? "mission_001_complete"
    : missionCompletionCertificationActive
      ? "mission_001_completion_certification"
      : gateRemediationActive
        ? "mission_001_gate_remediation"
        : (activeExerciseDefinition?.nextPlanningPhase || "exercise_005_planning");
  const nextPlanningAction = mission001Complete
    ? MISSION_001_COMPLETE_ACTION
    : missionCompletionCertificationActive
      ? MISSION_001_COMPLETION_CERTIFICATION_ACTION
      : gateRemediationActive
        ? MISSION_001_CAPABILITY_GATE_ACTION
        : (activeExerciseDefinition?.nextPlanningAction || "Plan Exercise 005 - Collection Page Inventory");
  const rollbackReady = Boolean(merchantBindingPass && proofRunPathExists);

  const gatingReasons = [
    !merchantBindingPass ? "Merchant binding incomplete" : "",
    !scopeComplete ? scopeBlocker : "",
    !beforeEvidenceCaptured ? "Before Evidence Missing" : "",
    !analysisComplete ? analysisBlocker : "",
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

  const currentBlocker = gatingReasons[0] || (mission001Complete ? "None" : "Not Yet Available");
  const nextSafeAction = !merchantBindingPass
    ? "Complete mission binding"
    : !scopeComplete
      ? (scopeIsExercise010 ? "Establish governed Exercise 010 scope" : scopeIsExercise009 ? "Establish governed Exercise 009 scope" : scopeIsExercise008 ? "Establish governed Exercise 008 scope" : scopeIsExercise007 ? "Establish governed Exercise 007 scope" : scopeIsExercise006 ? "Establish governed Exercise 006 scope" : "Establish governed mission scope")
      : !beforeEvidenceCaptured
        ? "Capture Before Evidence"
        : !analysisComplete
          ? (activeExerciseDefinition?.analysisAction || "Perform governed read-only product page inventory")
        : !afterEvidenceCaptured
          ? "Capture After Evidence"
        : !proofReady
            ? (activeExerciseDefinition?.proofAction || "Generate Mission Proof Package")
            : !certificationMemoReady
              ? (activeExerciseDefinition?.certificationAction || "Certify Mission 001 Exercise 004")
              : paymentRequired
                ? "Resolve payment applicability"
                : nextPlanningAction;

  const productionOperationPermitted = merchantBindingPass;
  const completionPermitted = mission001Complete;
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
      execution: executionAuthorityPass ? stageStatus("pass", "Governed analysis completed and next phase may proceed") : stageStatus("blocked", analysisBlocker),
      after_evidence: afterEvidenceCaptured ? stageStatus("pass", "After evidence scaffold present") : stageStatus("blocked", "After Evidence Missing"),
      proof: proofReady ? stageStatus("pass", "Mission proof package recognized") : stageStatus("blocked", "Proof Package Missing"),
      mission_certification: proofReady
        ? (certificationMemoReady
            ? stageStatus("pass", scopeIsExercise010 ? "Mission 001 Exercise 010 certified" : scopeIsExercise009 ? "Mission 001 Exercise 009 certified" : scopeIsExercise008 ? "Mission 001 Exercise 008 certified" : scopeIsExercise007 ? "Mission 001 Exercise 007 certified" : scopeIsExercise006 ? "Mission 001 Exercise 006 certified" : scopeIsExercise005 ? "Mission 001 Exercise 005 certified" : "Mission 001 Exercise 004 certified")
            : stageStatus("blocked", "Mission Certification Missing"))
        : stageStatus("blocked", "Proof Package Missing"),
      exercise_005_planning: scopeIsExercise004 && certificationMemoReady ? stageStatus("blocked", "Exercise 005 Planning Missing") : stageStatus("blocked", scopeIsExercise009 ? "Superseded by Exercise 009 scope" : scopeIsExercise008 ? "Superseded by Exercise 008 scope" : scopeIsExercise007 ? "Superseded by Exercise 007 scope" : scopeIsExercise006 ? "Superseded by Exercise 006 scope" : scopeIsExercise005 ? "Superseded by Exercise 006 planning" : "Mission Certification Missing"),
      exercise_006_planning: (scopeIsExercise006 || scopeIsExercise007 || scopeIsExercise008 || scopeIsExercise009 || scopeIsExercise010) ? stageStatus("pass", "Exercise 006 scope created") : scopeIsExercise005 && certificationMemoReady ? stageStatus("blocked", "Exercise 006 Planning Missing") : stageStatus("blocked", "Mission Certification Missing"),
      exercise_007_planning: (scopeIsExercise007 || scopeIsExercise008 || scopeIsExercise009 || scopeIsExercise010) ? stageStatus("pass", "Exercise 007 scope created") : scopeIsExercise006 && certificationMemoReady ? stageStatus("blocked", "Exercise 007 Planning Missing") : stageStatus("blocked", "Mission Certification Missing"),
      exercise_008_planning: (scopeIsExercise008 || scopeIsExercise009 || scopeIsExercise010) ? stageStatus("pass", "Exercise 008 scope created") : scopeIsExercise007 && certificationMemoReady ? stageStatus("blocked", "Exercise 008 Planning Missing") : stageStatus("blocked", "Mission Certification Missing"),
      exercise_009_planning: (scopeIsExercise009 || scopeIsExercise010) ? stageStatus("pass", "Exercise 009 scope created") : scopeIsExercise008 && certificationMemoReady ? stageStatus("blocked", "Exercise 009 Planning Missing") : stageStatus("blocked", "Mission Certification Missing"),
      exercise_010_planning: scopeIsExercise010 ? stageStatus("pass", "Exercise 010 scope created") : scopeIsExercise009 && certificationMemoReady ? stageStatus("blocked", "Exercise 010 Planning Missing") : stageStatus("blocked", "Mission Certification Missing"),
      mission_001_capability_gate: missionCapabilityGateMet
        ? stageStatus("pass", "Amended Mission 001 capability-class gate is satisfied")
        : stageStatus("blocked", gateRemediationActive ? MISSION_001_CAPABILITY_GATE_BLOCKER : "Mission 001 capability-class gate not yet evaluable"),
      mission_001_completion_certification: missionCapabilityGateMet
        ? (mission001CompletionCertificationReady
            ? stageStatus("pass", "Mission 001 completion certification recognized")
            : stageStatus("blocked", MISSION_001_COMPLETION_CERTIFICATION_BLOCKER))
        : stageStatus("blocked", MISSION_001_CAPABILITY_GATE_BLOCKER),
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
      mission_001_capability_gate: missionCapabilityGateMet ? 100 : 0,
      mission_001_completion_certification: mission001CompletionCertificationReady ? 100 : 0,
      exercise_005_planning: certificationMemoReady ? 0 : 0,
      rollback: rollbackReady ? 100 : 50,
      payment: paymentRequired ? 0 : 100,
      overall: mission001Complete ? 100 : merchantBindingPass ? (scopeComplete ? (beforeEvidenceCaptured ? (certificationMemoReady ? 80 : 70) : 40) : 35) : 0
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
      scopeIsExercise010 ? exercise010CertificationMemoPath : scopeIsExercise009 ? exercise009CertificationMemoPath : scopeIsExercise008 ? exercise008CertificationMemoPath : scopeIsExercise007 ? exercise007CertificationMemoPath : scopeIsExercise006 ? exercise006CertificationMemoPath : scopeIsExercise005 ? exercise005CertificationMemoPath : certificationMemoPath,
      appliedChangeExecutionPath,
      rollbackRehearsalPath,
      mission001CompletionCertificationPath
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
