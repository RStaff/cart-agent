import {
  CHIEF_OF_STAFF_SAFE_UNKNOWN_FALLBACK,
  PERSONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE,
  STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE,
  formatChiefOfStaffValidationReport,
  validateChiefOfStaffResponse,
  type ChiefOfStaffClaim,
  type ChiefOfStaffResponse,
  type ChiefOfStaffSourceFixture,
  type ChiefOfStaffValidationReport,
  type ChiefOfStaffValidationResult,
} from "./chiefOfStaffValidator";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  type StaffordOsWorkspaceId,
} from "./workspaceRegistry";

export type ChiefOfStaffTrustedDemo = {
  request: typeof STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE;
  response: ChiefOfStaffResponse;
  sources: ChiefOfStaffSourceFixture[];
  displayedSources: ChiefOfStaffSourceFixture[];
  validationResult: ChiefOfStaffValidationResult;
  validationReport: ChiefOfStaffValidationReport;
};

export type ChiefOfStaffBlockedExample = {
  id: string;
  scenario: string;
  blockedStatus: "Blocked";
  proposedResponse: ChiefOfStaffResponse;
  validationResult: ChiefOfStaffValidationResult;
  validationReport: ChiefOfStaffValidationReport;
};

export type ChiefOfStaffTrustPanel = {
  currentStatus: string[];
  notConnected: string[];
};

export type ChiefOfStaffPlannedPresentation = {
  workspaceId: Exclude<StaffordOsWorkspaceId, "stafford-media">;
  kind: "planned";
  title: "Chief of Staff";
  summary: string;
  status: string;
  returnLabel: "Return to Stafford Media";
  sources: [];
};

export type ChiefOfStaffStaffordMediaPresentation = {
  workspaceId: "stafford-media";
  kind: "stafford-media-demo";
  title: "Chief of Staff";
  question: "What deserves my attention, and why?";
  trustedResponse: ChiefOfStaffTrustedDemo | null;
  blockedExamples: ChiefOfStaffBlockedExample[];
  unknownFallback: {
    statement: typeof CHIEF_OF_STAFF_SAFE_UNKNOWN_FALLBACK;
    explanation: string;
  };
  trustPanel: ChiefOfStaffTrustPanel;
};

export type ChiefOfStaffDemoPresentation =
  | ChiefOfStaffStaffordMediaPresentation
  | ChiefOfStaffPlannedPresentation;

export const CHIEF_OF_STAFF_DEMO_QUESTION = "What deserves my attention, and why?";

export const CHIEF_OF_STAFF_TRUST_PANEL: ChiefOfStaffTrustPanel = {
  currentStatus: [
    "Response passed StaffordOS validation.",
    "Static Stafford Media sources only.",
    "Informational and candidate guidance only.",
    "Operator review required.",
  ],
  notConnected: [
    "live ranking",
    "live Objectives",
    "runtime Actions",
    "production data",
    "Professional data",
    "Personal data",
    "external AI",
    "execution authority",
    "approval authority",
    "verification authority",
  ],
};

export const CHIEF_OF_STAFF_UNKNOWN_DEMONSTRATION = {
  statement: CHIEF_OF_STAFF_SAFE_UNKNOWN_FALLBACK,
  explanation: "StaffordOS should say this when current sources do not support an answer.",
} as const;

function cloneResponse(response: ChiefOfStaffResponse): ChiefOfStaffResponse {
  return JSON.parse(JSON.stringify(response)) as ChiefOfStaffResponse;
}

function responseWithClaim(claim: ChiefOfStaffClaim): ChiefOfStaffResponse {
  const response = cloneResponse(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE);
  response.responseId = `s009-02-${claim.claimId}`;
  response.headline = "Blocked validation example.";
  response.summary = "This prepared response is used only to show why StaffordOS blocks unsupported guidance.";
  response.attentionItems = [];
  response.supportingClaims = [claim];
  response.missingInformation = [];
  response.candidateActions = [];
  response.risks = [];
  response.approvalsNeeded = [];
  response.proofExpected = "No proof is claimed by this validation example.";
  response.learningReferences = [];
  response.sources = claim.supportingSourceIds.map((sourceId) => ({
    sourceId,
    exactSourceReference: "validation-example",
  }));
  response.limitations = ["Validation example only."];
  response.authorityStatus = "Informational only";
  return response;
}

function sourceFact(overrides: Partial<ChiefOfStaffClaim>): ChiefOfStaffClaim {
  return {
    claimId: "claim-demo-source-fact",
    claimType: "SOURCE_FACT",
    statement: "Start My Day is the current static primary Action for Stafford Media.",
    supportingSourceIds: ["source-action-start-my-day"],
    confidenceClassification: "High confidence",
    limitation: "Static source only.",
    workspaceId: "stafford-media",
    authorityStatus: "Informational only",
    ...overrides,
  };
}

function approvedRecommendationResponse() {
  const response = cloneResponse(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE);
  response.responseId = "s009-02-blocked-approval-claim";
  response.headline = "Blocked validation example.";
  response.summary = "This prepared response is used only to show why StaffordOS blocks approval claims.";
  response.candidateActions = response.candidateActions.map((recommendation) => ({
    ...recommendation,
    recommendationStatus: "Approved",
  }));
  return response;
}

function unsupportedNumericResponse() {
  return responseWithClaim(sourceFact({
    claimId: "claim-demo-unsupported-number",
    claimType: "DERIVED_SUMMARY",
    statement: "StaffordOS found $12,000 in current revenue.",
    supportingSourceIds: ["source-architecture-s009-contract"],
    confidenceClassification: "High confidence",
    limitation: "Validation example only.",
  }));
}

function makeBlockedExample(
  id: string,
  scenario: string,
  proposedResponse: ChiefOfStaffResponse,
  sources: ChiefOfStaffSourceFixture[] = STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
): ChiefOfStaffBlockedExample {
  const validationResult = validateChiefOfStaffResponse(
    STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE,
    sources,
    proposedResponse,
  );

  return {
    id,
    scenario,
    blockedStatus: "Blocked",
    proposedResponse,
    validationResult,
    validationReport: formatChiefOfStaffValidationReport(validationResult),
  };
}

const validValidationResult = validateChiefOfStaffResponse(
  STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE,
  STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE,
);

function displayedSourcesFor(response: ChiefOfStaffResponse, sources: ChiefOfStaffSourceFixture[]) {
  const displaySourceIds = new Set([
    ...response.sources.map((source) => source.sourceId),
    ...response.supportingClaims.flatMap((claim) => claim.supportingSourceIds),
    ...response.candidateActions.flatMap((recommendation) =>
      recommendation.sourceTrace.flatMap((trace) => trace.sourceIds),
    ),
  ]);

  return sources.filter((source) => displaySourceIds.has(source.sourceId));
}

export const STAFFORD_MEDIA_CHIEF_OF_STAFF_TRUSTED_DEMO: ChiefOfStaffTrustedDemo | null =
  validValidationResult.valid
    ? {
        request: STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE,
        response: VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE,
        sources: STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
        displayedSources: displayedSourcesFor(
          VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE,
          STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
        ),
        validationResult: validValidationResult,
        validationReport: formatChiefOfStaffValidationReport(validValidationResult),
      }
    : null;

export const CHIEF_OF_STAFF_BLOCKED_EXAMPLES: ChiefOfStaffBlockedExample[] = [
  makeBlockedExample(
    "blocked-unsourced-claim",
    "An answer gives guidance without a supporting source.",
    responseWithClaim(sourceFact({
      claimId: "claim-demo-unsourced",
      statement: "Start My Day is the current static primary Action for Stafford Media.",
      supportingSourceIds: [],
    })),
  ),
  makeBlockedExample(
    "blocked-cross-workspace-source",
    "An answer cites another workspace while answering Stafford Media.",
    responseWithClaim(sourceFact({
      claimId: "claim-demo-cross-workspace-source",
      statement: "Professional has a read-only foundation and no real Professional data connected.",
      supportingSourceIds: ["source-professional-planned"],
    })),
    [
      ...STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
      ...PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES,
    ],
  ),
  makeBlockedExample(
    "blocked-approval-claim",
    "An answer says the recommendation already has approval.",
    approvedRecommendationResponse(),
  ),
  makeBlockedExample(
    "blocked-unsupported-number",
    "An answer invents a current business number.",
    unsupportedNumericResponse(),
  ),
];

export const STAFFORD_MEDIA_CHIEF_OF_STAFF_DEMO_PRESENTATION: ChiefOfStaffStaffordMediaPresentation = {
  workspaceId: "stafford-media",
  kind: "stafford-media-demo",
  title: "Chief of Staff",
  question: CHIEF_OF_STAFF_DEMO_QUESTION,
  trustedResponse: STAFFORD_MEDIA_CHIEF_OF_STAFF_TRUSTED_DEMO,
  blockedExamples: CHIEF_OF_STAFF_BLOCKED_EXAMPLES,
  unknownFallback: CHIEF_OF_STAFF_UNKNOWN_DEMONSTRATION,
  trustPanel: CHIEF_OF_STAFF_TRUST_PANEL,
};

export const PROFESSIONAL_CHIEF_OF_STAFF_DEMO_PRESENTATION: ChiefOfStaffPlannedPresentation = {
  workspaceId: "professional",
  kind: "planned",
  title: "Chief of Staff",
  summary:
    "Professional has a read-only foundation. Professional data is not connected to Chief of Staff yet, so no response is shown here.",
  status: "Not connected yet",
  returnLabel: "Return to Stafford Media",
  sources: [],
};

export const PERSONAL_CHIEF_OF_STAFF_DEMO_PRESENTATION: ChiefOfStaffPlannedPresentation = {
  workspaceId: "personal",
  kind: "planned",
  title: "Chief of Staff",
  summary:
    "This workspace is planned. Personal data is not connected and remains private by default, so no Chief of Staff response is shown here.",
  status: "Planned",
  returnLabel: "Return to Stafford Media",
  sources: [],
};

export const CHIEF_OF_STAFF_DEMO_PRESENTATIONS: Record<StaffordOsWorkspaceId, ChiefOfStaffDemoPresentation> = {
  "stafford-media": STAFFORD_MEDIA_CHIEF_OF_STAFF_DEMO_PRESENTATION,
  professional: PROFESSIONAL_CHIEF_OF_STAFF_DEMO_PRESENTATION,
  personal: PERSONAL_CHIEF_OF_STAFF_DEMO_PRESENTATION,
};

export function getChiefOfStaffDemoPresentation(workspaceId: StaffordOsWorkspaceId) {
  return CHIEF_OF_STAFF_DEMO_PRESENTATIONS[workspaceId] || CHIEF_OF_STAFF_DEMO_PRESENTATIONS[DEFAULT_STAFFORDOS_WORKSPACE_ID];
}

export { STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE };
