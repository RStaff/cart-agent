export type ChiefOfStaffWorkspaceId = "stafford-media" | "professional" | "personal";

export type ChiefOfStaffWorkspaceFamily = "business" | "professional" | "personal";

export type ChiefOfStaffSourceType =
  | "workspace"
  | "capability"
  | "objective"
  | "decision"
  | "action"
  | "evidence"
  | "proof"
  | "learning"
  | "architecture";

export type ChiefOfStaffFreshness = "Current" | "Recent" | "Historical" | "Unknown" | "Stale";

export type ChiefOfStaffClaimType =
  | "SOURCE_FACT"
  | "DERIVED_SUMMARY"
  | "INFERENCE"
  | "CANDIDATE_RECOMMENDATION"
  | "UNKNOWN"
  | "BLOCKED_BY_AUTHORITY"
  | "PLANNED_CAPABILITY";

export type ChiefOfStaffConfidence =
  | "High confidence"
  | "Moderate confidence"
  | "Low confidence"
  | "Not enough evidence";

export type ChiefOfStaffRecommendationStatus =
  | "Candidate"
  | "Needs more information"
  | "Needs authority"
  | "Not recommended"
  | "Ready for operator review";

export type ChiefOfStaffAuthorityStatus =
  | "Informational only"
  | "Candidate recommendation"
  | "Operator review required"
  | "Approval required"
  | "Blocked by missing authority"
  | "Not authorized";

export type ChiefOfStaffSourceFixture = {
  sourceId: string;
  sourceType: ChiefOfStaffSourceType;
  workspaceId: ChiefOfStaffWorkspaceId;
  authorityClassification: string;
  freshness: ChiefOfStaffFreshness;
  privacyClassification: string;
  immutable: boolean;
  title: string;
  contentSummary: string;
  exactSourceReference: string;
  limitations: string[];
  availability?: "available_now" | "planned" | "needs_review";
  supportedClaimIds?: string[];
  supportedStatements?: string[];
  supportedNumbers?: string[];
  conflictGroup?: string;
  conflictValue?: string;
};

export type ChiefOfStaffRequestFixture = {
  requestId: string;
  currentUserId: string;
  workspaceId: ChiefOfStaffWorkspaceId;
  workspaceFamily: ChiefOfStaffWorkspaceFamily;
  activeRole: string;
  permissionSummary: string;
  capabilitySummary: string;
  operatorQuestion: string;
  allowedSourceTypes: ChiefOfStaffSourceType[];
  sourceSnapshotIds: string[];
  currentTime: string;
  privacyClassification: string;
  policyContext: {
    mode: "read_only_contract";
    writesAllowed: false;
    externalAiAllowed: false;
    workspaceContextAuthorization: "not_authorization";
    authorizedPrivacyClassifications: string[];
  };
  requestedOutputType: string;
};

export type ChiefOfStaffClaim = {
  claimId: string;
  claimType: ChiefOfStaffClaimType;
  statement: string;
  supportingSourceIds: string[];
  confidenceClassification: ChiefOfStaffConfidence;
  limitation: string;
  workspaceId: ChiefOfStaffWorkspaceId;
  authorityStatus: ChiefOfStaffAuthorityStatus | "";
  conflictDisclosure?: boolean;
};

export type ChiefOfStaffAlternative = {
  label: string;
  reason: string;
};

export type ChiefOfStaffSourceTrace = {
  claimId: string;
  sourceIds: string[];
};

export type ChiefOfStaffRecommendation = {
  recommendationId: string;
  workspaceId: ChiefOfStaffWorkspaceId;
  operatorFacingAction: string;
  whyNow: string;
  objectiveId: string;
  decisionId: string;
  supportingActionId: string;
  evidenceIds: string[];
  proofStatus: string;
  learningIds: string[];
  riskSummary: string;
  uncertainty: string;
  authorityNeeded: string;
  authorityStatus: ChiefOfStaffAuthorityStatus | "";
  expectedResult: string;
  proofNeeded: string;
  alternatives: ChiefOfStaffAlternative[];
  sourceTrace: ChiefOfStaffSourceTrace[];
  recommendationStatus: ChiefOfStaffRecommendationStatus | "Approved" | "Executing" | "Completed" | string;
};

export type ChiefOfStaffResponse = {
  responseId: string;
  workspaceId: ChiefOfStaffWorkspaceId;
  headline: string;
  summary: string;
  attentionItems: Array<{
    title: string;
    reason: string;
    claimIds: string[];
  }>;
  supportingClaims: ChiefOfStaffClaim[];
  missingInformation: Array<{
    type: string;
    statement: string;
  }>;
  candidateActions: ChiefOfStaffRecommendation[];
  risks: string[];
  approvalsNeeded: string[];
  proofExpected: string;
  learningReferences: string[];
  sources: Array<{
    sourceId: string;
    exactSourceReference: string;
  }>;
  limitations: string[];
  generatedAt: string;
  authorityStatus: ChiefOfStaffAuthorityStatus | "";
};

export type ChiefOfStaffValidationErrorCode =
  | "RESPONSE_WORKSPACE_MISMATCH"
  | "CLAIM_WORKSPACE_MISMATCH"
  | "SOURCE_WORKSPACE_MISMATCH"
  | "SOURCE_NOT_ALLOWED"
  | "SOURCE_NOT_FOUND"
  | "CLAIM_WITHOUT_SOURCE"
  | "INVALID_CLAIM_TYPE"
  | "UNSUPPORTED_SOURCE_FACT"
  | "INFERENCE_NOT_LABELED"
  | "RECOMMENDATION_STATUS_NOT_ALLOWED"
  | "RECOMMENDATION_WITHOUT_AUTHORITY_STATUS"
  | "RECOMMENDATION_WITHOUT_SOURCE_TRACE"
  | "PLANNED_CAPABILITY_PRESENTED_AS_AVAILABLE"
  | "UNSUPPORTED_NUMERIC_VALUE"
  | "EXPECTED_RESULT_PRESENTED_AS_OUTCOME"
  | "EVIDENCE_PRESENTED_AS_PROOF"
  | "PROOF_PRESENTED_AS_COMPLETION"
  | "LEARNING_PRESENTED_AS_POLICY"
  | "AI_AUTHORITY_CLAIM"
  | "MISSING_LIMITATION"
  | "MISSING_AUTHORITY_STATUS"
  | "UNKNOWN_NOT_USED"
  | "CONFLICT_SILENTLY_RESOLVED"
  | "STALE_SOURCE_NOT_DISCLOSED"
  | "PRIVATE_SOURCE_NOT_AUTHORIZED";

export type ChiefOfStaffValidationError = {
  code: ChiefOfStaffValidationErrorCode;
  path: string;
  message: string;
  technicalDetail: string;
  relatedClaimId?: string;
  recommendationId?: string;
};

export type ChiefOfStaffValidationWarning = {
  code: string;
  path: string;
  message: string;
  technicalDetail: string;
};

export type ChiefOfStaffValidationResult = {
  valid: boolean;
  validationStatus: "accepted" | "rejected";
  errors: ChiefOfStaffValidationError[];
  warnings: ChiefOfStaffValidationWarning[];
  checkedClaimCount: number;
  checkedRecommendationCount: number;
  checkedSourceCount: number;
};

export type ChiefOfStaffValidationReport = {
  trusted: boolean;
  headline: string;
  summary: string;
  claimsChecked: number;
  recommendationsChecked: number;
  sourcesChecked: number;
  warnings: string[];
  technicalDetails: string[];
};

export const CHIEF_OF_STAFF_SAFE_UNKNOWN_FALLBACK =
  "I cannot verify that from the current StaffordOS sources.";

const CLAIM_TYPES: ChiefOfStaffClaimType[] = [
  "SOURCE_FACT",
  "DERIVED_SUMMARY",
  "INFERENCE",
  "CANDIDATE_RECOMMENDATION",
  "UNKNOWN",
  "BLOCKED_BY_AUTHORITY",
  "PLANNED_CAPABILITY",
];

const ALLOWED_RECOMMENDATION_STATUSES: ChiefOfStaffRecommendationStatus[] = [
  "Candidate",
  "Needs more information",
  "Needs authority",
  "Not recommended",
  "Ready for operator review",
];

const LIMITED_OR_STALE_FRESHNESS: ChiefOfStaffFreshness[] = ["Historical", "Unknown", "Stale"];

export const STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES: ChiefOfStaffSourceFixture[] = [
  {
    sourceId: "source-workspace-stafford-media",
    sourceType: "workspace",
    workspaceId: "stafford-media",
    authorityClassification: "Repository-backed",
    freshness: "Current",
    privacyClassification: "owner_private_stafford_media_fixture",
    immutable: true,
    title: "Stafford Media workspace",
    contentSummary: "Stafford Media is the only available workspace today. Professional and Personal remain planned.",
    exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.ts#stafford-media",
    limitations: ["Presentation-only workspace context. Not authorization."],
    availability: "available_now",
    supportedClaimIds: ["claim-workspace-stafford-media-current"],
    supportedStatements: ["Stafford Media is the current available workspace."],
  },
  {
    sourceId: "source-capability-start-my-day",
    sourceType: "capability",
    workspaceId: "stafford-media",
    authorityClassification: "Repository-backed",
    freshness: "Current",
    privacyClassification: "owner_private_stafford_media_fixture",
    immutable: true,
    title: "Start My Day capability",
    contentSummary: "Start My Day opens the current Home page from the existing StaffordOS pages.",
    exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts#start-my-day",
    limitations: ["Route link only. Does not provide live priority ranking or execution."],
    availability: "available_now",
    supportedClaimIds: ["claim-start-my-day-primary"],
    supportedStatements: ["Start My Day is available from the current StaffordOS pages."],
  },
  {
    sourceId: "source-objective-operating-loop",
    sourceType: "objective",
    workspaceId: "stafford-media",
    authorityClassification: "Repository-backed",
    freshness: "Current",
    privacyClassification: "owner_private_stafford_media_fixture",
    immutable: true,
    title: "Run the business from one clear loop",
    contentSummary: "Static objective for keeping the current operating surface focused on what deserves attention.",
    exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.ts#stafford-media-operating-loop",
    limitations: ["Static objective only. No live measurement or completion state."],
    availability: "available_now",
    supportedClaimIds: ["claim-objective-operating-loop"],
    supportedStatements: ["Start My Day supports the objective Run the business from one clear loop."],
  },
  {
    sourceId: "source-decision-start-my-day",
    sourceType: "decision",
    workspaceId: "stafford-media",
    authorityClassification: "Repository-backed",
    freshness: "Current",
    privacyClassification: "owner_private_stafford_media_fixture",
    immutable: true,
    title: "Use Start My Day as the static Home action",
    contentSummary: "S008 selected Start My Day as static Home guidance while live priority ranking remains unconnected.",
    exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.ts#s008-start-my-day-static-home-action",
    limitations: ["Static architecture decision. Not approval to execute work."],
    availability: "available_now",
    supportedClaimIds: ["claim-static-not-ranked"],
    supportedStatements: ["The current guidance is static and not dynamically ranked."],
  },
  {
    sourceId: "source-action-start-my-day",
    sourceType: "action",
    workspaceId: "stafford-media",
    authorityClassification: "Repository-backed",
    freshness: "Current",
    privacyClassification: "owner_private_stafford_media_fixture",
    immutable: true,
    title: "Start My Day",
    contentSummary: "Static Action record for Start My Day. It directs the operator to the current Stafford Media Home page.",
    exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts#start-my-day-home-action",
    limitations: ["Static Action Registry source only. No execution authority."],
    availability: "available_now",
    supportedClaimIds: ["claim-start-my-day-primary", "claim-action-ready-for-review"],
    supportedStatements: [
      "Start My Day is the current static primary Action for Stafford Media.",
      "The recommendation is ready for operator review, not approved.",
    ],
  },
  {
    sourceId: "source-evidence-start-my-day",
    sourceType: "evidence",
    workspaceId: "stafford-media",
    authorityClassification: "Repository-backed",
    freshness: "Current",
    privacyClassification: "owner_private_stafford_media_fixture",
    immutable: true,
    title: "The current Home page is the working starting point",
    contentSummary: "Evidence supports opening the current Home page before deeper work and keeps /os from pretending it has live ranking.",
    exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/evidenceFoundation.ts#evidence-start-my-day-current-source",
    limitations: ["Evidence explains why the Action appears worth taking. It is not Proof."],
    availability: "available_now",
    supportedClaimIds: ["claim-evidence-supports-action"],
    supportedStatements: ["Repository-backed evidence supports the Start My Day Action."],
  },
  {
    sourceId: "source-proof-start-my-day-route",
    sourceType: "proof",
    workspaceId: "stafford-media",
    authorityClassification: "Historical certification",
    freshness: "Historical",
    privacyClassification: "owner_private_stafford_media_fixture",
    immutable: true,
    title: "The current Home page opened during validation",
    contentSummary: "/operator returned HTTP 200 during S008 route validation. This proves route availability only.",
    exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/proofFoundation.ts#proof-start-my-day-route-available",
    limitations: ["Historical route proof only. Does not prove business work completed."],
    availability: "available_now",
    supportedClaimIds: ["claim-proof-route-only"],
    supportedStatements: ["Historical Proof shows route availability only."],
    supportedNumbers: ["200"],
  },
  {
    sourceId: "source-learning-os-grows-beside-operator",
    sourceType: "learning",
    workspaceId: "stafford-media",
    authorityClassification: "Repository-backed",
    freshness: "Historical",
    privacyClassification: "owner_private_stafford_media_fixture",
    immutable: true,
    title: "/os can grow beside the current operator pages",
    contentSummary: "Confirmed Learning says incremental /os work should point to current operator truth until parity is proven.",
    exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/learningFoundation.ts#learning-os-grows-beside-operator",
    limitations: ["Learning is not Policy and does not change permissions or priority."],
    availability: "available_now",
    supportedClaimIds: ["claim-learning-route-migration"],
    supportedStatements: ["Confirmed Learning says /os can grow beside the current operator pages."],
  },
  {
    sourceId: "source-architecture-s009-contract",
    sourceType: "architecture",
    workspaceId: "stafford-media",
    authorityClassification: "Architecture authority",
    freshness: "Current",
    privacyClassification: "owner_private_stafford_media_fixture",
    immutable: true,
    title: "S009 read-only Chief of Staff contract",
    contentSummary: "S009.00 defines source-traced read-only responses and blocks LLM implementation, execution, verification, persistence, and provider calls.",
    exactSourceReference: "staffordos/architecture/S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.md",
    limitations: ["Contract only. No runtime Chief of Staff exists."],
    availability: "available_now",
    supportedClaimIds: ["claim-no-live-ai"],
    supportedStatements: ["Live business data and AI recommendations are not connected."],
  },
];

export const PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES: ChiefOfStaffSourceFixture[] = [
  {
    sourceId: "source-professional-planned",
    sourceType: "workspace",
    workspaceId: "professional",
    authorityClassification: "Architecture-defined",
    freshness: "Current",
    privacyClassification: "owner_private_professional_fixture",
    immutable: true,
    title: "Professional workspace planned",
    contentSummary: "Professional remains planned. No real job, employer, application, interview, meeting, or accomplishment data is connected.",
    exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.ts#professional",
    limitations: ["Planned workspace only. Not available as current operating truth."],
    availability: "planned",
    supportedClaimIds: ["claim-professional-planned"],
    supportedStatements: ["Professional is planned and has no real professional data connected."],
  },
];

export const PERSONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES: ChiefOfStaffSourceFixture[] = [
  {
    sourceId: "source-personal-planned",
    sourceType: "workspace",
    workspaceId: "personal",
    authorityClassification: "Architecture-defined",
    freshness: "Current",
    privacyClassification: "owner_private_personal_fixture",
    immutable: true,
    title: "Personal workspace planned",
    contentSummary: "Personal remains planned. No real personal, family, media, sharing, memory, or learner data is connected.",
    exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.ts#personal",
    limitations: ["Planned workspace only. Not available as current operating truth."],
    availability: "planned",
    supportedClaimIds: ["claim-personal-planned"],
    supportedStatements: ["Personal is planned and has no real personal data connected."],
  },
];

export const STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE: ChiefOfStaffRequestFixture = {
  requestId: "s009-01-request-stafford-media-attention",
  currentUserId: "static-fixture-owner-not-authenticated",
  workspaceId: "stafford-media",
  workspaceFamily: "business",
  activeRole: "owner_fixture_not_authorization",
  permissionSummary: "Static test fixture only. This is not real authentication, authorization, membership, role, or permission authority.",
  capabilitySummary: "Stafford Media static S008 capabilities only.",
  operatorQuestion: "What deserves my attention, and why?",
  allowedSourceTypes: [
    "workspace",
    "capability",
    "objective",
    "decision",
    "action",
    "evidence",
    "proof",
    "learning",
    "architecture",
  ],
  sourceSnapshotIds: STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES.map((source) => source.sourceId),
  currentTime: "2026-08-01T12:00:00-04:00",
  privacyClassification: "owner_private_stafford_media_fixture",
  policyContext: {
    mode: "read_only_contract",
    writesAllowed: false,
    externalAiAllowed: false,
    workspaceContextAuthorization: "not_authorization",
    authorizedPrivacyClassifications: ["owner_private_stafford_media_fixture"],
  },
  requestedOutputType: "source_traced_attention_summary",
};

export const VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE: ChiefOfStaffResponse = {
  responseId: "s009-01-valid-response-stafford-media-attention",
  workspaceId: "stafford-media",
  headline: "Start with Start My Day.",
  summary:
    "The current static StaffordOS sources point to Start My Day as the first place to review. This is not live ranking or execution authority.",
  attentionItems: [
    {
      title: "Start My Day",
      reason: "It is the current static primary Action for Stafford Media.",
      claimIds: ["claim-start-my-day-primary"],
    },
  ],
  supportingClaims: [
    {
      claimId: "claim-start-my-day-primary",
      claimType: "SOURCE_FACT",
      statement: "Start My Day is the current static primary Action for Stafford Media.",
      supportingSourceIds: ["source-action-start-my-day"],
      confidenceClassification: "High confidence",
      limitation: "This is static Action Registry truth, not live AI ranking.",
      workspaceId: "stafford-media",
      authorityStatus: "Informational only",
    },
    {
      claimId: "claim-objective-operating-loop",
      claimType: "SOURCE_FACT",
      statement: "Start My Day supports the objective Run the business from one clear loop.",
      supportingSourceIds: ["source-objective-operating-loop"],
      confidenceClassification: "High confidence",
      limitation: "This objective is static and not live measured.",
      workspaceId: "stafford-media",
      authorityStatus: "Informational only",
    },
    {
      claimId: "claim-static-not-ranked",
      claimType: "SOURCE_FACT",
      statement: "The current guidance is static and not dynamically ranked.",
      supportingSourceIds: ["source-decision-start-my-day"],
      confidenceClassification: "High confidence",
      limitation: "Live priority ranking is not connected.",
      workspaceId: "stafford-media",
      authorityStatus: "Informational only",
    },
    {
      claimId: "claim-no-live-ai",
      claimType: "SOURCE_FACT",
      statement: "Live business data and AI recommendations are not connected.",
      supportingSourceIds: ["source-architecture-s009-contract"],
      confidenceClassification: "High confidence",
      limitation: "No runtime Chief of Staff exists.",
      workspaceId: "stafford-media",
      authorityStatus: "Informational only",
    },
  ],
  missingInformation: [
    {
      type: "source freshness check",
      statement: "Live priority ranking and runtime evidence aggregation are not connected.",
    },
  ],
  candidateActions: [
    {
      recommendationId: "recommendation-start-my-day-review",
      workspaceId: "stafford-media",
      operatorFacingAction: "Start My Day",
      whyNow: "This is the current static starting point for Stafford Media work.",
      objectiveId: "stafford-media-operating-loop",
      decisionId: "s008-start-my-day-static-home-action",
      supportingActionId: "start-my-day-home-action",
      evidenceIds: ["evidence-start-my-day-current-source"],
      proofStatus: "Proof available for route availability only.",
      learningIds: ["learning-os-grows-beside-operator"],
      riskSummary: "Do not treat this as approval, execution, or proof of a business outcome.",
      uncertainty: "Live ranking and runtime evidence aggregation are not connected.",
      authorityNeeded: "Operator review required before any live business action.",
      authorityStatus: "Operator review required",
      expectedResult: "Ross opens the current Stafford Media Home page.",
      proofNeeded: "The current Home page opens without changing work state.",
      alternatives: [
        {
          label: "Review People to Contact",
          reason: "Use when outreach is already the known next concern.",
        },
      ],
      sourceTrace: [
        {
          claimId: "claim-start-my-day-primary",
          sourceIds: ["source-action-start-my-day"],
        },
      ],
      recommendationStatus: "Ready for operator review",
    },
  ],
  risks: ["Do not treat this as approval, execution, or proof of a business outcome."],
  approvalsNeeded: ["Operator review is required before acting on live business work."],
  proofExpected: "The current Home page opens without changing work state.",
  learningReferences: ["learning-os-grows-beside-operator"],
  sources: [
    {
      sourceId: "source-action-start-my-day",
      exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts#start-my-day-home-action",
    },
    {
      sourceId: "source-objective-operating-loop",
      exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.ts#stafford-media-operating-loop",
    },
    {
      sourceId: "source-decision-start-my-day",
      exactSourceReference: "staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.ts#s008-start-my-day-static-home-action",
    },
    {
      sourceId: "source-architecture-s009-contract",
      exactSourceReference: "staffordos/architecture/S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.md",
    },
  ],
  limitations: [
    "Static fixture only.",
    "No real authorization.",
    "No external AI provider was called.",
    "No live ranking was performed.",
    "No runtime state was mutated.",
  ],
  generatedAt: "2026-08-01T12:00:00-04:00",
  authorityStatus: "Informational only",
};

function makeError(
  code: ChiefOfStaffValidationErrorCode,
  path: string,
  message: string,
  technicalDetail: string,
  relatedClaimId?: string,
  recommendationId?: string,
): ChiefOfStaffValidationError {
  return {
    code,
    path,
    message,
    technicalDetail,
    ...(relatedClaimId ? { relatedClaimId } : {}),
    ...(recommendationId ? { recommendationId } : {}),
  };
}

function sourceMapFor(sources: ChiefOfStaffSourceFixture[]) {
  return new Map(sources.map((source) => [source.sourceId, source]));
}

function textContainsUnsupportedNumber(text: string, supportedNumbers: Set<string>) {
  const numericMatches = text.match(/(?:\$ ?\d[\d,]*(?:\.\d+)?)|(?:\b\d+(?:\.\d+)?%?\b)/g) || [];
  return numericMatches.some((match) => {
    const normalized = match.replace(/[$,\s%]/g, "");
    if (normalized.length >= 4 && /^20\d{2}/.test(normalized)) {
      return false;
    }
    return !supportedNumbers.has(match) && !supportedNumbers.has(normalized);
  });
}

function responseHumanText(response: ChiefOfStaffResponse) {
  return [
    response.headline,
    response.summary,
    response.proofExpected,
    ...response.attentionItems.flatMap((item) => [item.title, item.reason]),
    ...response.supportingClaims.map((claim) => claim.statement),
    ...response.missingInformation.map((item) => item.statement),
    ...response.candidateActions.flatMap((recommendation) => [
      recommendation.operatorFacingAction,
      recommendation.whyNow,
      recommendation.proofStatus,
      recommendation.riskSummary,
      recommendation.uncertainty,
      recommendation.expectedResult,
      recommendation.proofNeeded,
    ]),
    ...response.risks,
    ...response.approvalsNeeded,
    ...response.limitations,
  ].join("\n");
}

function claimIsMaterial(claim: ChiefOfStaffClaim) {
  return !["UNKNOWN", "BLOCKED_BY_AUTHORITY"].includes(claim.claimType);
}

function directlySupportedBySource(claim: ChiefOfStaffClaim, source: ChiefOfStaffSourceFixture) {
  return (
    source.supportedClaimIds?.includes(claim.claimId) ||
    source.supportedStatements?.includes(claim.statement)
  );
}

function hasInferenceLanguage(statement: string) {
  return /\b(therefore|likely|probably|because|suggests that|implies that|should now)\b/i.test(statement);
}

function mentionsAvailabilityAsCurrent(statement: string) {
  return /\b(available now|available today|currently available|ready to use|working now|operational)\b/i.test(statement);
}

function mentionsExpectedAsOutcome(statement: string) {
  return /\b(expected result (happened|occurred|was completed|is complete)|expected result proves|what should happen already happened)\b/i.test(statement);
}

function mentionsEvidenceAsProof(statement: string) {
  return /\b(evidence (proves|verified|is verified proof)|supporting evidence is proof|evidence confirms completion)\b/i.test(statement);
}

function mentionsProofAsCompletion(statement: string) {
  return /\b(proof (completes|completed|marks complete)|proof means the action is complete|proof completes the objective)\b/i.test(statement);
}

function mentionsLearningAsPolicy(statement: string) {
  return /\b(learning is policy|lesson is policy|learning requires all future|must always because we learned|governing rule from learning)\b/i.test(statement);
}

function mentionsAiAuthority(statement: string) {
  return /\b(AI|Chief of Staff|StaffordOS)\b[^.]*\b(approved|approves|verified|verifies|executed|executes|authorized|authorizes|decided|decides|completed|completes)\b/i.test(statement);
}

function limitationDisclosesFreshness(limitation: string, freshness: ChiefOfStaffFreshness) {
  const normalized = limitation.toLowerCase();
  return normalized.includes(freshness.toLowerCase()) || /historical|stale|unknown|freshness|not current/.test(normalized);
}

function conflictGroups(sources: ChiefOfStaffSourceFixture[]) {
  const grouped = new Map<string, ChiefOfStaffSourceFixture[]>();
  for (const source of sources) {
    if (!source.conflictGroup || !source.conflictValue) {
      continue;
    }
    const current = grouped.get(source.conflictGroup) || [];
    current.push(source);
    grouped.set(source.conflictGroup, current);
  }

  return Array.from(grouped.values()).filter((group) => new Set(group.map((source) => source.conflictValue)).size > 1);
}

export function validateChiefOfStaffResponse(
  request: ChiefOfStaffRequestFixture,
  sources: ChiefOfStaffSourceFixture[],
  response: ChiefOfStaffResponse,
): ChiefOfStaffValidationResult {
  const errors: ChiefOfStaffValidationError[] = [];
  const warnings: ChiefOfStaffValidationWarning[] = [];
  const sourcesById = sourceMapFor(sources);
  const allowedPrivacy = new Set(request.policyContext.authorizedPrivacyClassifications);
  const supportedNumbers = new Set(sources.flatMap((source) => source.supportedNumbers || []));

  if (response.workspaceId !== request.workspaceId) {
    errors.push(makeError(
      "RESPONSE_WORKSPACE_MISMATCH",
      "response.workspaceId",
      "Response belongs to a different workspace.",
      `Expected ${request.workspaceId}, received ${response.workspaceId}.`,
    ));
  }

  if (!response.authorityStatus) {
    errors.push(makeError(
      "MISSING_AUTHORITY_STATUS",
      "response.authorityStatus",
      "Response is missing authority status.",
      "The response must say whether it is informational, a candidate recommendation, blocked, or not authorized.",
    ));
  }

  if (!response.limitations.length) {
    errors.push(makeError(
      "MISSING_LIMITATION",
      "response.limitations",
      "Response is missing limitations.",
      "The response must disclose static, unavailable, uncertain, or unauthorized boundaries where relevant.",
    ));
  }

  if (textContainsUnsupportedNumber(responseHumanText(response), supportedNumbers)) {
    errors.push(makeError(
      "UNSUPPORTED_NUMERIC_VALUE",
      "response",
      "Response includes a number that is not supported by the provided sources.",
      "Numeric business claims require exact source support. Identifiers and timestamps are ignored by this rule.",
    ));
  }

  const fullText = responseHumanText(response);
  if (mentionsAiAuthority(fullText)) {
    errors.push(makeError(
      "AI_AUTHORITY_CLAIM",
      "response",
      "Response claims AI authority it does not have.",
      "The Chief of Staff cannot approve, verify, execute, authorize, decide, or complete work.",
    ));
  }

  response.supportingClaims.forEach((claim, claimIndex) => {
    const claimPath = `response.supportingClaims[${claimIndex}]`;

    if (!CLAIM_TYPES.includes(claim.claimType)) {
      errors.push(makeError(
        "INVALID_CLAIM_TYPE",
        `${claimPath}.claimType`,
        "This claim type is not allowed.",
        `Received claim type ${claim.claimType}.`,
        claim.claimId,
      ));
    }

    if (claim.workspaceId !== request.workspaceId) {
      errors.push(makeError(
        "CLAIM_WORKSPACE_MISMATCH",
        `${claimPath}.workspaceId`,
        "This claim belongs to another workspace.",
        `Expected ${request.workspaceId}, received ${claim.workspaceId}.`,
        claim.claimId,
      ));
    }

    if (!claim.authorityStatus) {
      errors.push(makeError(
        "MISSING_AUTHORITY_STATUS",
        `${claimPath}.authorityStatus`,
        "This claim is missing authority status.",
        "Every material claim must state its authority boundary.",
        claim.claimId,
      ));
    }

    if (claimIsMaterial(claim) && !claim.limitation) {
      errors.push(makeError(
        "MISSING_LIMITATION",
        `${claimPath}.limitation`,
        "This claim is missing a limitation.",
        "Material claims must disclose uncertainty, static scope, authority limits, or source limits.",
        claim.claimId,
      ));
    }

    if (claimIsMaterial(claim) && claim.supportingSourceIds.length === 0) {
      errors.push(makeError(
        "CLAIM_WITHOUT_SOURCE",
        `${claimPath}.supportingSourceIds`,
        "This claim has no supporting source.",
        "Material claims need at least one authorized source.",
        claim.claimId,
      ));
    }

    if (claim.claimType !== "UNKNOWN" && claim.supportingSourceIds.length === 0) {
      errors.push(makeError(
        "UNKNOWN_NOT_USED",
        `${claimPath}.claimType`,
        "The response gives an unsupported answer instead of saying it is unknown.",
        "Use UNKNOWN with the safe fallback when sources do not support an answer.",
        claim.claimId,
      ));
    }

    let directSupportFound = false;
    for (const sourceId of claim.supportingSourceIds) {
      const source = sourcesById.get(sourceId);
      if (!source) {
        errors.push(makeError(
          "SOURCE_NOT_FOUND",
          `${claimPath}.supportingSourceIds`,
          "This claim cites a source that was not supplied.",
          `Missing source: ${sourceId}.`,
          claim.claimId,
        ));
        continue;
      }

      if (source.workspaceId !== request.workspaceId || source.workspaceId !== claim.workspaceId) {
        errors.push(makeError(
          "SOURCE_WORKSPACE_MISMATCH",
          `${claimPath}.supportingSourceIds`,
          "This source belongs to another workspace.",
          `Source ${source.sourceId} belongs to ${source.workspaceId}; request belongs to ${request.workspaceId}.`,
          claim.claimId,
        ));
      }

      if (!request.allowedSourceTypes.includes(source.sourceType)) {
        errors.push(makeError(
          "SOURCE_NOT_ALLOWED",
          `${claimPath}.supportingSourceIds`,
          "This source type is not allowed for the request.",
          `Source ${source.sourceId} has type ${source.sourceType}.`,
          claim.claimId,
        ));
      }

      if (!allowedPrivacy.has(source.privacyClassification)) {
        errors.push(makeError(
          "PRIVATE_SOURCE_NOT_AUTHORIZED",
          `${claimPath}.supportingSourceIds`,
          "This source is outside the request's privacy boundary.",
          `Source ${source.sourceId} has privacy ${source.privacyClassification}.`,
          claim.claimId,
        ));
      }

      if (source.availability === "planned" && mentionsAvailabilityAsCurrent(claim.statement)) {
        errors.push(makeError(
          "PLANNED_CAPABILITY_PRESENTED_AS_AVAILABLE",
          `${claimPath}.statement`,
          "This planned information is described as available now.",
          `Source ${source.sourceId} is planned, not available now.`,
          claim.claimId,
        ));
      }

      if (LIMITED_OR_STALE_FRESHNESS.includes(source.freshness) && !limitationDisclosesFreshness(claim.limitation, source.freshness)) {
        errors.push(makeError(
          "STALE_SOURCE_NOT_DISCLOSED",
          `${claimPath}.limitation`,
          "This claim relies on limited freshness without saying so.",
          `Source ${source.sourceId} freshness is ${source.freshness}.`,
          claim.claimId,
        ));
      }

      if (directlySupportedBySource(claim, source)) {
        directSupportFound = true;
      }
    }

    if (claim.claimType === "SOURCE_FACT" && !directSupportFound) {
      errors.push(makeError(
        "UNSUPPORTED_SOURCE_FACT",
        `${claimPath}.statement`,
        "This direct fact is not directly supported by the cited source.",
        "SOURCE_FACT claims require explicit source support by claim ID or exact statement.",
        claim.claimId,
      ));
    }

    if (claim.claimType === "SOURCE_FACT" && hasInferenceLanguage(claim.statement) && !directSupportFound) {
      errors.push(makeError(
        "INFERENCE_NOT_LABELED",
        `${claimPath}.statement`,
        "This looks like reasoning but is labeled as a direct fact.",
        "Derived or inferential statements must use INFERENCE or DERIVED_SUMMARY.",
        claim.claimId,
      ));
    }

    if (mentionsExpectedAsOutcome(claim.statement)) {
      errors.push(makeError(
        "EXPECTED_RESULT_PRESENTED_AS_OUTCOME",
        `${claimPath}.statement`,
        "Expected result is being described as if it already happened.",
        "Expected result and observed Outcome must remain separate.",
        claim.claimId,
      ));
    }

    if (mentionsEvidenceAsProof(claim.statement) || claim.supportingSourceIds.some((sourceId) => sourcesById.get(sourceId)?.sourceType === "evidence" && /\bproof|verified\b/i.test(claim.statement))) {
      errors.push(makeError(
        "EVIDENCE_PRESENTED_AS_PROOF",
        `${claimPath}.statement`,
        "Evidence is being described as Proof.",
        "Evidence supports reasoning before action. Proof demonstrates an observed outcome after action.",
        claim.claimId,
      ));
    }

    if (mentionsProofAsCompletion(claim.statement) || claim.supportingSourceIds.some((sourceId) => sourcesById.get(sourceId)?.sourceType === "proof" && /\b(completes|completed|complete action|complete objective)\b/i.test(claim.statement))) {
      errors.push(makeError(
        "PROOF_PRESENTED_AS_COMPLETION",
        `${claimPath}.statement`,
        "Proof is being used to claim automatic completion.",
        "Proof does not complete Actions or Objectives automatically.",
        claim.claimId,
      ));
    }

    if (mentionsLearningAsPolicy(claim.statement) || claim.supportingSourceIds.some((sourceId) => sourcesById.get(sourceId)?.sourceType === "learning" && /\bpolicy|governing rule|must always\b/i.test(claim.statement))) {
      errors.push(makeError(
        "LEARNING_PRESENTED_AS_POLICY",
        `${claimPath}.statement`,
        "Learning is being described as Policy.",
        "Learning may inform future work, but Policy requires separate governance.",
        claim.claimId,
      ));
    }
  });

  response.candidateActions.forEach((recommendation, recommendationIndex) => {
    const recommendationPath = `response.candidateActions[${recommendationIndex}]`;

    if (recommendation.workspaceId !== request.workspaceId) {
      errors.push(makeError(
        "CLAIM_WORKSPACE_MISMATCH",
        `${recommendationPath}.workspaceId`,
        "This recommendation belongs to another workspace.",
        `Expected ${request.workspaceId}, received ${recommendation.workspaceId}.`,
        undefined,
        recommendation.recommendationId,
      ));
    }

    if (!ALLOWED_RECOMMENDATION_STATUSES.includes(recommendation.recommendationStatus as ChiefOfStaffRecommendationStatus)) {
      errors.push(makeError(
        "RECOMMENDATION_STATUS_NOT_ALLOWED",
        `${recommendationPath}.recommendationStatus`,
        "This recommendation status is not allowed.",
        `Received ${recommendation.recommendationStatus}.`,
        undefined,
        recommendation.recommendationId,
      ));
    }

    if (!recommendation.authorityNeeded || !recommendation.authorityStatus) {
      errors.push(makeError(
        "RECOMMENDATION_WITHOUT_AUTHORITY_STATUS",
        `${recommendationPath}.authorityStatus`,
        "This recommendation is missing authority requirements.",
        "Recommendations must state what authority or operator review is still needed.",
        undefined,
        recommendation.recommendationId,
      ));
    }

    if (!recommendation.sourceTrace.length || recommendation.sourceTrace.every((trace) => trace.sourceIds.length === 0)) {
      errors.push(makeError(
        "RECOMMENDATION_WITHOUT_SOURCE_TRACE",
        `${recommendationPath}.sourceTrace`,
        "This recommendation has no source trace.",
        "Candidate recommendations must cite the claims and sources they depend on.",
        undefined,
        recommendation.recommendationId,
      ));
    }
  });

  for (const source of response.sources) {
    if (!sourcesById.has(source.sourceId)) {
      errors.push(makeError(
        "SOURCE_NOT_FOUND",
        "response.sources",
        "The response source list includes a source that was not supplied.",
        `Missing source: ${source.sourceId}.`,
      ));
    }
  }

  for (const conflictGroup of conflictGroups(sources)) {
    const conflictSourceIds = new Set(conflictGroup.map((source) => source.sourceId));
    const disclosed = response.supportingClaims.some((claim) => {
      const claimSources = new Set(claim.supportingSourceIds);
      return (
        claim.conflictDisclosure === true &&
        conflictGroup.every((source) => claimSources.has(source.sourceId)) &&
        /conflict|disagree|operator review/i.test(claim.statement)
      );
    });

    const silentlyUsesOneSide = response.supportingClaims.some((claim) => {
      const usedConflictSources = claim.supportingSourceIds.filter((sourceId) => conflictSourceIds.has(sourceId));
      return usedConflictSources.length > 0 && usedConflictSources.length < conflictGroup.length && claim.claimType !== "UNKNOWN";
    });

    if (silentlyUsesOneSide && !disclosed) {
      errors.push(makeError(
        "CONFLICT_SILENTLY_RESOLVED",
        "response.supportingClaims",
        "Conflicting sources were reduced to one unqualified conclusion.",
        `Conflict group contains ${Array.from(conflictSourceIds).join(", ")}.`,
      ));
    }
  }

  const valid = errors.length === 0;
  return {
    valid,
    validationStatus: valid ? "accepted" : "rejected",
    errors,
    warnings,
    checkedClaimCount: response.supportingClaims.length,
    checkedRecommendationCount: response.candidateActions.length,
    checkedSourceCount: sources.length,
  };
}

export function formatChiefOfStaffValidationReport(
  result: ChiefOfStaffValidationResult,
): ChiefOfStaffValidationReport {
  if (result.valid) {
    return {
      trusted: true,
      headline: "Response follows the current StaffordOS rules.",
      summary: "Claims, recommendations, and sources were checked against the read-only Chief of Staff contract.",
      claimsChecked: result.checkedClaimCount,
      recommendationsChecked: result.checkedRecommendationCount,
      sourcesChecked: result.checkedSourceCount,
      warnings: result.warnings.map((warning) => warning.message),
      technicalDetails: result.warnings.map((warning) => `${warning.code}: ${warning.technicalDetail}`),
    };
  }

  return {
    trusted: false,
    headline: "Response cannot be shown as trusted.",
    summary: result.errors[0]?.message || "The response does not follow the current StaffordOS rules.",
    claimsChecked: result.checkedClaimCount,
    recommendationsChecked: result.checkedRecommendationCount,
    sourcesChecked: result.checkedSourceCount,
    warnings: result.warnings.map((warning) => warning.message),
    technicalDetails: result.errors.map((error) => `${error.code}: ${error.technicalDetail}`),
  };
}
