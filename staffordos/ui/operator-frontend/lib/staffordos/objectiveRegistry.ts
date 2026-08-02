import type { StaffordOsWorkspaceId } from "./workspaceRegistry";

export type StaffordOsObjectiveStatus = "active" | "planned" | "paused" | "completed" | "needs_review";

export type StaffordOsObjectiveSource =
  | "repository_backed"
  | "operator_defined"
  | "imported"
  | "ai_proposed"
  | "planned_example"
  | "needs_verification";

export type StaffordOsObjectiveType =
  | "business_operations"
  | "revenue_conversion"
  | "delivery_quality"
  | "professional_growth"
  | "personal_planning";

export type StaffordOsObjectivePriorityClass = "foundation" | "near_term" | "quality" | "planned";

export type StaffordOsObjective = {
  id: string;
  workspaceId: StaffordOsWorkspaceId;
  missionId: string;
  title: string;
  description: string;
  whyItMatters: string;
  objectiveType: StaffordOsObjectiveType;
  status: StaffordOsObjectiveStatus;
  priorityClass: StaffordOsObjectivePriorityClass;
  owner: string;
  successCondition: string;
  proofRequirement: string;
  evidenceStatus: string;
  timeframe: string;
  relatedCapabilities: string[];
  relatedActions: string[];
  privacyClassification: string;
  authorityStatus: string;
  source: StaffordOsObjectiveSource;
  sourceArtifacts: string[];
};

export const OBJECTIVE_STATUS_LABELS: Record<StaffordOsObjectiveStatus, string> = {
  active: "Active",
  planned: "Planned",
  paused: "Paused",
  completed: "Completed",
  needs_review: "Needs review",
};

export const OBJECTIVE_SOURCE_LABELS: Record<StaffordOsObjectiveSource, string> = {
  repository_backed: "Repository-backed",
  operator_defined: "Operator-defined",
  imported: "Imported",
  ai_proposed: "AI-proposed",
  planned_example: "Planned example",
  needs_verification: "Needs verification",
};

export const OBJECTIVE_PRIORITY_LABELS: Record<StaffordOsObjectivePriorityClass, string> = {
  foundation: "Foundation",
  near_term: "Near-term",
  quality: "Quality",
  planned: "Planned",
};

export const STAFFORDOS_OBJECTIVES: StaffordOsObjective[] = [
  {
    id: "stafford-media-operating-loop",
    workspaceId: "stafford-media",
    missionId: "stafford-media-business-core",
    title: "Run the business from one clear loop",
    description: "Keep the current operating surface focused on what to contact, what is close to payment, what needs work, and what is blocked.",
    whyItMatters: "StaffordOS should reduce terminal archaeology and help Ross decide where to continue.",
    objectiveType: "business_operations",
    status: "active",
    priorityClass: "foundation",
    owner: "Ross / Stafford Media",
    successCondition: "Ross can answer the business-core questions from the operating surfaces without hunting through files.",
    proofRequirement: "The Home, capability map, current operator surfaces, and evidence views make the next useful place to work clear.",
    evidenceStatus: "Repository-backed by S008 and business-core authority documents; live measurement is not connected.",
    timeframe: "Current operating foundation",
    relatedCapabilities: [
      "start-my-day",
      "decide-what-matters",
      "review-recent-activity",
      "understand-system-connections",
      "review-rules-and-checks",
    ],
    relatedActions: ["start-my-day-home-action"],
    privacyClassification: "Owner-private unless Business access is explicitly granted later.",
    authorityStatus: "Static read-only objective presentation.",
    source: "repository_backed",
    sourceArtifacts: [
      "staffordos/architecture/S008_05_UNIFIED_ACTION_AND_DECISION_MODEL.md",
      "staffordos/architecture/S008_07_WORKSPACE_AWARE_UNIFIED_HOME_AND_PRIORITY_PRESENTATION.md",
      "staffordos/authority/output/staffordos_business_core_definition_of_done_v1.md",
      "staffordos/system_inventory/objective_binding_v1.json",
    ],
  },
  {
    id: "stafford-media-convert-opportunities",
    workspaceId: "stafford-media",
    missionId: "stafford-media-business-core",
    title: "Turn opportunities into paid work",
    description: "Move qualified merchants from lead and offer state toward verified payment without overstating revenue.",
    whyItMatters: "Stafford Media needs a clear path from opportunity to paid work before delivery starts.",
    objectiveType: "revenue_conversion",
    status: "active",
    priorityClass: "near_term",
    owner: "Ross / Stafford Media",
    successCondition: "The operator can see who needs contact, which opportunities are close to payment, and what blocks payment.",
    proofRequirement: "Payment and revenue claims must remain tied to the governed payment and revenue authorities.",
    evidenceStatus: "Repository-backed by lifecycle, product, and business-core authority documents; no live revenue metric is shown here.",
    timeframe: "Current business loop",
    relatedCapabilities: [
      "find-people-to-contact",
      "review-marketing-activity",
      "see-money-to-collect",
      "decide-what-matters",
    ],
    relatedActions: [],
    privacyClassification: "Owner-private unless Business access is explicitly granted later.",
    authorityStatus: "Static read-only objective presentation.",
    source: "repository_backed",
    sourceArtifacts: [
      "staffordos/authority/canonical_business_lifecycle_v1.md",
      "staffordos/authority/product_definitions_v1.md",
      "staffordos/authority/output/staffordos_business_core_definition_of_done_v1.md",
      "staffordos/system_inventory/objective_binding_v1.json",
    ],
  },
  {
    id: "stafford-media-complete-work-with-proof",
    workspaceId: "stafford-media",
    missionId: "stafford-media-business-core",
    title: "Complete customer work with proof",
    description: "Keep ShopiFixer work scoped, paid before delivery, and supported by before-and-after evidence.",
    whyItMatters: "Customer work should create trust only when the scope, payment boundary, delivery state, and proof are clear.",
    objectiveType: "delivery_quality",
    status: "active",
    priorityClass: "quality",
    owner: "Ross / Stafford Media",
    successCondition: "Current customer work shows what is moving, what is blocked, and what proof will show completion.",
    proofRequirement: "Before evidence, execution notes, QA evidence, after evidence, and merchant-facing proof package are available where required.",
    evidenceStatus: "Repository-backed by ShopiFixer lifecycle, proof, and Mission 002 readiness authority; no live completion metric is shown here.",
    timeframe: "Current delivery foundation",
    relatedCapabilities: [
      "manage-current-customer-work",
      "review-rules-and-checks",
      "review-recent-activity",
    ],
    relatedActions: [],
    privacyClassification: "Owner-private unless Business access is explicitly granted later.",
    authorityStatus: "Static read-only objective presentation.",
    source: "repository_backed",
    sourceArtifacts: [
      "staffordos/authority/canonical_business_lifecycle_v1.md",
      "staffordos/authority/output/staffordos_business_core_definition_of_done_v1.md",
      "staffordos/missions/mission_002_shopifixer_merchant_execution_readiness_binding_v1.json",
      "staffordos/qa/output/mission_002_shopifixer_execution_readiness_v1.json",
    ],
  },
  {
    id: "professional-secure-right-role",
    workspaceId: "professional",
    missionId: "professional-planned",
    title: "Secure the right role",
    description: "A future private objective category for choosing and pursuing the right professional opportunity.",
    whyItMatters: "Professional decisions need private evidence, fit, and owner approval before action.",
    objectiveType: "professional_growth",
    status: "planned",
    priorityClass: "planned",
    owner: "Owner",
    successCondition: "Not defined yet.",
    proofRequirement: "Not connected yet.",
    evidenceStatus: "Planned example only.",
    timeframe: "Planned",
    relatedCapabilities: ["professional-job-search", "professional-application-materials", "professional-interview-prep"],
    relatedActions: [],
    privacyClassification: "Owner-private.",
    authorityStatus: "Planned example; not active operating truth.",
    source: "planned_example",
    sourceArtifacts: [
      "staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.md",
      "staffordos/architecture/S008_06_WORKSPACE_CONTEXT_AND_OWNER_FIRST_SWITCHER_FOUNDATION.md",
    ],
  },
  {
    id: "professional-succeed-current-role",
    workspaceId: "professional",
    missionId: "professional-planned",
    title: "Succeed in the current role",
    description: "A future private objective category for protecting commitments, proof, relationships, and growth at work.",
    whyItMatters: "Current-role support must not invent accomplishments, commitments, feedback, or employer data.",
    objectiveType: "professional_growth",
    status: "planned",
    priorityClass: "planned",
    owner: "Owner",
    successCondition: "Not defined yet.",
    proofRequirement: "Not connected yet.",
    evidenceStatus: "Planned example only.",
    timeframe: "Planned",
    relatedCapabilities: ["professional-current-role"],
    relatedActions: [],
    privacyClassification: "Owner-private.",
    authorityStatus: "Planned example; not active operating truth.",
    source: "planned_example",
    sourceArtifacts: [
      "staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.md",
      "staffordos/architecture/S008_06_WORKSPACE_CONTEXT_AND_OWNER_FIRST_SWITCHER_FOUNDATION.md",
    ],
  },
  {
    id: "personal-protect-private-priorities",
    workspaceId: "personal",
    missionId: "personal-planned",
    title: "Protect private priorities",
    description: "A future owner-private objective category for responsibilities, learning, family, and creative work.",
    whyItMatters: "Personal work must stay private by default and shared only through explicit approval.",
    objectiveType: "personal_planning",
    status: "planned",
    priorityClass: "planned",
    owner: "Owner",
    successCondition: "Not defined yet.",
    proofRequirement: "Not connected yet.",
    evidenceStatus: "Planned example only.",
    timeframe: "Planned",
    relatedCapabilities: ["personal-private-planning", "personal-learning", "personal-family", "personal-media"],
    relatedActions: [],
    privacyClassification: "Owner-private by default.",
    authorityStatus: "Planned example; not active operating truth.",
    source: "planned_example",
    sourceArtifacts: [
      "staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.md",
      "staffordos/architecture/S008_06_WORKSPACE_CONTEXT_AND_OWNER_FIRST_SWITCHER_FOUNDATION.md",
    ],
  },
];

export function getObjectivesForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return STAFFORDOS_OBJECTIVES.filter((objective) => objective.workspaceId === workspaceId);
}

export function getActiveObjectivesForWorkspace(workspaceId: StaffordOsWorkspaceId) {
  return getObjectivesForWorkspace(workspaceId).filter((objective) => objective.status === "active");
}

export function getObjectiveById(objectiveId: string | null | undefined) {
  return STAFFORDOS_OBJECTIVES.find((objective) => objective.id === objectiveId) || null;
}

export function getObjectivesForCapability(capabilityId: string) {
  return STAFFORDOS_OBJECTIVES.filter((objective) => objective.relatedCapabilities.includes(capabilityId));
}
