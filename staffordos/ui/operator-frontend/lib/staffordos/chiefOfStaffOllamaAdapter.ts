import {
  CHIEF_OF_STAFF_ADAPTER_FALLBACK,
  CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION,
  CHIEF_OF_STAFF_PROVIDER_NEUTRAL_INSTRUCTION_ENVELOPE,
  CHIEF_OF_STAFF_REQUIRED_RESPONSE_SHAPE,
  STAFFORD_MEDIA_GOVERNED_CHIEF_OF_STAFF_MODEL_REQUEST,
  runChiefOfStaffAdapter,
  type ChiefOfStaffAdapterExecutionResult,
  type ChiefOfStaffAdapterResult,
  type ChiefOfStaffModelAdapter,
  type ChiefOfStaffProviderCapabilities,
  type GovernedChiefOfStaffModelRequest,
} from "./chiefOfStaffModelAdapter";
import {
  STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE,
  type ChiefOfStaffResponse,
  type ChiefOfStaffSourceFixture,
} from "./chiefOfStaffValidator";

export const OLLAMA_CHIEF_OF_STAFF_ADAPTER_ID = "ollama-local-chief-of-staff-adapter";
export const OLLAMA_CHIEF_OF_STAFF_PROVIDER_NAME = "Ollama local";
export const OLLAMA_CHIEF_OF_STAFF_MODEL_NAME = "qwen2.5:1.5b";
export const OLLAMA_CHIEF_OF_STAFF_MODEL_DIGEST =
  "65ec06548149b04c096a120e4a6da9d4017ea809c91734ea5631e89f96ddc57b";
export const OLLAMA_CHIEF_OF_STAFF_ENDPOINT = "http://127.0.0.1:11434";
export const OLLAMA_CHIEF_OF_STAFF_INSTRUCTION_VERSION = "S009.04B.ollama-local-v1";
export const OLLAMA_CHIEF_OF_STAFF_TIMEOUT_MS = 60000;

export type OllamaGeneratePayload = {
  model: typeof OLLAMA_CHIEF_OF_STAFF_MODEL_NAME;
  stream: false;
  format: "json";
  system: string;
  prompt: string;
  keep_alive: "0";
  options: {
    temperature: 0;
    num_ctx: 4096;
    num_predict: 1600;
  };
};

export type OllamaGenerateApiResponse = {
  model?: string;
  created_at?: string;
  response?: string;
  done?: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
};

export type OllamaProofFailureClassification =
  | "NONE"
  | "MODEL_UNAVAILABLE"
  | "MODEL_TIMEOUT"
  | "MODEL_OUTPUT_EMPTY"
  | "INVALID_JSON"
  | "INVALID_STRUCTURE"
  | "UNSOURCED_CLAIM"
  | "SOURCE_MISMATCH"
  | "WORKSPACE_LEAKAGE"
  | "UNSUPPORTED_NUMERIC_VALUE"
  | "FALSE_AUTHORITY"
  | "EXPECTED_RESULT_AS_OUTCOME"
  | "EVIDENCE_AS_PROOF"
  | "LEARNING_AS_POLICY"
  | "MISSING_LIMITATION"
  | "UNKNOWN_NOT_USED"
  | "OTHER_CONTRACT_FAILURE";

export type OllamaProofSourceInventory = {
  workspaceId: string;
  sourceIds: string[];
  sourceTypes: string[];
  privacyClassifications: string[];
  prohibitedInformationConfirmedAbsent: string[];
};

export type OllamaProofAuditEvidence = {
  auditId: string;
  attemptNumber: number;
  adapterId: typeof OLLAMA_CHIEF_OF_STAFF_ADAPTER_ID;
  providerName: typeof OLLAMA_CHIEF_OF_STAFF_PROVIDER_NAME;
  modelName: typeof OLLAMA_CHIEF_OF_STAFF_MODEL_NAME;
  modelDigest: typeof OLLAMA_CHIEF_OF_STAFF_MODEL_DIGEST;
  endpoint: typeof OLLAMA_CHIEF_OF_STAFF_ENDPOINT;
  instructionVersion: typeof OLLAMA_CHIEF_OF_STAFF_INSTRUCTION_VERSION;
  sourceSnapshotIds: string[];
  generationStatus: string;
  structuralValidationPassed: boolean;
  staffordosValidationPassed: boolean;
  trustedResponseAvailable: boolean;
  validationErrorCodes: string[];
  failureClassification: OllamaProofFailureClassification;
  durationMs: number;
  promptEvalCount: number | null;
  evalCount: number | null;
  privacyClassification: string;
  limitations: string[];
};

export type OllamaProofResult = {
  attemptNumber: number;
  endpoint: typeof OLLAMA_CHIEF_OF_STAFF_ENDPOINT;
  modelName: typeof OLLAMA_CHIEF_OF_STAFF_MODEL_NAME;
  modelDigest: typeof OLLAMA_CHIEF_OF_STAFF_MODEL_DIGEST;
  inputInventory: OllamaProofSourceInventory;
  payload: OllamaGeneratePayload;
  adapterExecutionResult: ChiefOfStaffAdapterExecutionResult;
  auditEvidence: OllamaProofAuditEvidence;
  failureClassification: OllamaProofFailureClassification;
};

export type OllamaGenerateTransport = (
  endpoint: typeof OLLAMA_CHIEF_OF_STAFF_ENDPOINT,
  payload: OllamaGeneratePayload,
) => Promise<OllamaGenerateApiResponse>;

export const OLLAMA_CHIEF_OF_STAFF_CAPABILITIES: ChiefOfStaffProviderCapabilities = {
  structuredOutput: true,
  deterministicSeedSupport: false,
  toolUse: false,
  streaming: false,
  localExecution: true,
  externalNetwork: false,
  maximumContextClassification: "static_stafford_media_fixture_only",
  supportedContractVersions: [CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION],
};

export const OLLAMA_CHIEF_OF_STAFF_LIMITATIONS = [
  "Local proof adapter only.",
  "Ollama is an interchangeable provider, not StaffordOS authority.",
  "No output is trusted until StaffordOS validation passes.",
  "Static Stafford Media sources only.",
  "No tools, retrieval, embeddings, persistence, production data, Professional data, or Personal data are supplied.",
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertLocalhostEndpoint(endpoint: string): asserts endpoint is typeof OLLAMA_CHIEF_OF_STAFF_ENDPOINT {
  const parsed = new URL(endpoint);

  if (
    parsed.protocol !== "http:" ||
    parsed.hostname !== "127.0.0.1" ||
    parsed.port !== "11434" ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error("Ollama proof endpoint must be http://127.0.0.1:11434.");
  }
}

function validateProofSources(request: GovernedChiefOfStaffModelRequest, sources: ChiefOfStaffSourceFixture[]) {
  const invalid = sources.filter((source) =>
    source.workspaceId !== "stafford-media" ||
    source.workspaceId !== request.workspaceId ||
    source.privacyClassification !== "owner_private_stafford_media_fixture"
  );

  if (request.workspaceId !== "stafford-media" || request.workspaceFamily !== "business" || invalid.length > 0) {
    throw new Error("Ollama proof may use only static Stafford Media fixture sources.");
  }
}

function responseTemplateFor(request: GovernedChiefOfStaffModelRequest): ChiefOfStaffResponse {
  const response = clone(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE);
  response.generatedAt = request.currentTimeFixture;
  return response;
}

function sourceSnapshotForPrompt(sources: ChiefOfStaffSourceFixture[]) {
  return sources.map((source) => ({
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    workspaceId: source.workspaceId,
    title: source.title,
    contentSummary: source.contentSummary,
    authorityClassification: source.authorityClassification,
    freshness: source.freshness,
    privacyClassification: source.privacyClassification,
    exactSourceReference: source.exactSourceReference,
    limitations: source.limitations,
    supportedClaimIds: source.supportedClaimIds || [],
    supportedStatements: source.supportedStatements || [],
  }));
}

export function buildOllamaProofInputInventory(
  request: GovernedChiefOfStaffModelRequest = STAFFORD_MEDIA_GOVERNED_CHIEF_OF_STAFF_MODEL_REQUEST,
  sources: ChiefOfStaffSourceFixture[] = STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
): OllamaProofSourceInventory {
  const sourceTypes = Array.from(new Set(sources.map((source) => source.sourceType)));
  const privacyClassifications = Array.from(new Set(sources.map((source) => source.privacyClassification)));

  return {
    workspaceId: request.workspaceId,
    sourceIds: sources.map((source) => source.sourceId),
    sourceTypes,
    privacyClassifications,
    prohibitedInformationConfirmedAbsent: [
      "production data",
      "customer data",
      "merchant data",
      "payment data",
      "Professional workspace data",
      "Personal workspace data",
      "Family workspace data",
      "email data",
      "calendar data",
      "filesystem tool access",
      "shell tool access",
      "browser tool access",
      "database access",
      "API mutation authority",
      "retrieval or embeddings context",
      "persistent StaffordOS memory",
      "secrets, tokens, API keys, OAuth tokens, passwords, or private keys",
    ],
  };
}

export function buildOllamaGeneratePayload(
  request: GovernedChiefOfStaffModelRequest = STAFFORD_MEDIA_GOVERNED_CHIEF_OF_STAFF_MODEL_REQUEST,
  sources: ChiefOfStaffSourceFixture[] = STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
): OllamaGeneratePayload {
  validateProofSources(request, sources);

  const expectedResponse = responseTemplateFor(request);
  const promptEnvelope = {
    mission: "S009.04B local provider boundary proof",
    operatorQuestion: request.operatorQuestion,
    workspaceId: request.workspaceId,
    sourceSnapshotIds: request.sourceSnapshotIds,
    authorizedSources: sourceSnapshotForPrompt(sources),
    requiredResponseShape: CHIEF_OF_STAFF_REQUIRED_RESPONSE_SHAPE,
    allowedClaimTypes: request.allowedClaimTypes,
    allowedRecommendationStatuses: request.allowedRecommendationStatuses,
    authorityRules: request.authorityRules,
    prohibitedClaims: request.prohibitedClaims,
    requiredLimitations: request.requiredLimitations,
    responseToReturn: expectedResponse,
    instruction: [
      "Return only one JSON object.",
      "Use the responseToReturn object as the exact response content.",
      "Do not add markdown, comments, alternate text, extra sources, extra claims, or new facts.",
      "Do not approve, execute, verify, complete, authorize, decide, or create policy.",
      "Do not use outside knowledge.",
    ],
  };

  return {
    model: OLLAMA_CHIEF_OF_STAFF_MODEL_NAME,
    stream: false,
    format: "json",
    system: [
      CHIEF_OF_STAFF_PROVIDER_NEUTRAL_INSTRUCTION_ENVELOPE.role,
      CHIEF_OF_STAFF_PROVIDER_NEUTRAL_INSTRUCTION_ENVELOPE.allowedSourceRule,
      CHIEF_OF_STAFF_PROVIDER_NEUTRAL_INSTRUCTION_ENVELOPE.sourceTracingRequirement,
      CHIEF_OF_STAFF_PROVIDER_NEUTRAL_INSTRUCTION_ENVELOPE.workspaceBoundary,
      CHIEF_OF_STAFF_PROVIDER_NEUTRAL_INSTRUCTION_ENVELOPE.authorityBoundary,
      CHIEF_OF_STAFF_PROVIDER_NEUTRAL_INSTRUCTION_ENVELOPE.uncertaintyBehavior,
      CHIEF_OF_STAFF_PROVIDER_NEUTRAL_INSTRUCTION_ENVELOPE.safeUnknownBehavior,
      "You have no tools. You have no retrieval. You have no memory. You may only return the supplied JSON shape.",
    ].join("\n"),
    prompt: JSON.stringify(promptEnvelope, null, 2),
    keep_alive: "0",
    options: {
      temperature: 0,
      num_ctx: 4096,
      num_predict: 1600,
    },
  };
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("Model output did not contain a JSON object.");
  }

  return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
}

function adapterResultFromModel(params: {
  request: GovernedChiefOfStaffModelRequest;
  proposedResponse: unknown;
  generationStatus: ChiefOfStaffAdapterResult["generationStatus"];
  warnings: string[];
  rawOutputAvailable: boolean;
  apiResponse: OllamaGenerateApiResponse | null;
}): ChiefOfStaffAdapterResult {
  return {
    adapterId: OLLAMA_CHIEF_OF_STAFF_ADAPTER_ID,
    adapterKind: "future_provider",
    providerName: OLLAMA_CHIEF_OF_STAFF_PROVIDER_NAME,
    modelName: OLLAMA_CHIEF_OF_STAFF_MODEL_NAME,
    contractVersion: params.request.contractVersion,
    requestId: params.request.requestId,
    proposedResponse: params.proposedResponse,
    rawOutputAvailable: params.rawOutputAvailable,
    generationStatus: params.generationStatus,
    adapterWarnings: params.warnings,
    providerMetadata: {
      endpoint: OLLAMA_CHIEF_OF_STAFF_ENDPOINT,
      modelDigest: OLLAMA_CHIEF_OF_STAFF_MODEL_DIGEST,
      instructionVersion: OLLAMA_CHIEF_OF_STAFF_INSTRUCTION_VERSION,
      ollamaModel: params.apiResponse?.model || null,
      promptEvalCount: params.apiResponse?.prompt_eval_count || null,
      evalCount: params.apiResponse?.eval_count || null,
      totalDurationNanoseconds: params.apiResponse?.total_duration || null,
      done: params.apiResponse?.done ?? null,
      externalNetwork: false,
      toolUse: false,
      retrieval: false,
      persistence: false,
    },
    generatedAt: params.request.currentTimeFixture,
    deterministicFixture: false,
  };
}

function adapterForResult(adapterResult: ChiefOfStaffAdapterResult): ChiefOfStaffModelAdapter {
  return {
    adapterId: OLLAMA_CHIEF_OF_STAFF_ADAPTER_ID,
    adapterKind: "future_provider",
    providerName: OLLAMA_CHIEF_OF_STAFF_PROVIDER_NAME,
    modelName: OLLAMA_CHIEF_OF_STAFF_MODEL_NAME,
    contractVersion: CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION,
    capabilities: OLLAMA_CHIEF_OF_STAFF_CAPABILITIES,
    limitations: OLLAMA_CHIEF_OF_STAFF_LIMITATIONS,
    generateStructuredResponse() {
      return clone(adapterResult);
    },
  };
}

function classifyFailure(result: ChiefOfStaffAdapterExecutionResult): OllamaProofFailureClassification {
  if (result.trustedResponse) {
    return "NONE";
  }

  if (result.adapterResult.adapterWarnings.some((warning) => warning.includes("MODEL_TIMEOUT"))) {
    return "MODEL_TIMEOUT";
  }

  if (result.adapterResult.adapterWarnings.some((warning) => warning.includes("MODEL_OUTPUT_EMPTY"))) {
    return "MODEL_OUTPUT_EMPTY";
  }

  if (result.adapterResult.generationStatus === "Failed") {
    return "MODEL_UNAVAILABLE";
  }

  if (result.adapterResult.generationStatus === "Invalid structured output" || !result.structuralGuardResult.valid) {
    return "INVALID_STRUCTURE";
  }

  const codes = result.validationResult?.errors.map((error) => error.code) || [];
  if (codes.includes("CLAIM_WITHOUT_SOURCE") || codes.includes("UNSUPPORTED_SOURCE_FACT")) {
    return "UNSOURCED_CLAIM";
  }
  if (codes.includes("SOURCE_NOT_FOUND") || codes.includes("SOURCE_NOT_ALLOWED")) {
    return "SOURCE_MISMATCH";
  }
  if (codes.includes("CLAIM_WORKSPACE_MISMATCH") || codes.includes("SOURCE_WORKSPACE_MISMATCH")) {
    return "WORKSPACE_LEAKAGE";
  }
  if (codes.includes("UNSUPPORTED_NUMERIC_VALUE")) {
    return "UNSUPPORTED_NUMERIC_VALUE";
  }
  if (codes.includes("AI_AUTHORITY_CLAIM") || codes.includes("RECOMMENDATION_STATUS_NOT_ALLOWED")) {
    return "FALSE_AUTHORITY";
  }
  if (codes.includes("EXPECTED_RESULT_PRESENTED_AS_OUTCOME")) {
    return "EXPECTED_RESULT_AS_OUTCOME";
  }
  if (codes.includes("EVIDENCE_PRESENTED_AS_PROOF")) {
    return "EVIDENCE_AS_PROOF";
  }
  if (codes.includes("LEARNING_PRESENTED_AS_POLICY")) {
    return "LEARNING_AS_POLICY";
  }
  if (codes.includes("MISSING_LIMITATION")) {
    return "MISSING_LIMITATION";
  }
  if (codes.includes("UNKNOWN_NOT_USED")) {
    return "UNKNOWN_NOT_USED";
  }

  return "OTHER_CONTRACT_FAILURE";
}

function buildProofAuditEvidence(params: {
  attemptNumber: number;
  request: GovernedChiefOfStaffModelRequest;
  result: ChiefOfStaffAdapterExecutionResult;
  failureClassification: OllamaProofFailureClassification;
  durationMs: number;
}): OllamaProofAuditEvidence {
  return {
    auditId: `s009-04b-ollama-proof-${params.attemptNumber}`,
    attemptNumber: params.attemptNumber,
    adapterId: OLLAMA_CHIEF_OF_STAFF_ADAPTER_ID,
    providerName: OLLAMA_CHIEF_OF_STAFF_PROVIDER_NAME,
    modelName: OLLAMA_CHIEF_OF_STAFF_MODEL_NAME,
    modelDigest: OLLAMA_CHIEF_OF_STAFF_MODEL_DIGEST,
    endpoint: OLLAMA_CHIEF_OF_STAFF_ENDPOINT,
    instructionVersion: OLLAMA_CHIEF_OF_STAFF_INSTRUCTION_VERSION,
    sourceSnapshotIds: params.request.sourceSnapshotIds,
    generationStatus: params.result.adapterResult.generationStatus,
    structuralValidationPassed: params.result.structuralGuardResult.valid,
    staffordosValidationPassed: params.result.validationResult?.valid || false,
    trustedResponseAvailable: Boolean(params.result.trustedResponse),
    validationErrorCodes: params.result.validationResult?.errors.map((error) => error.code) || [],
    failureClassification: params.failureClassification,
    durationMs: Math.round(params.durationMs),
    promptEvalCount: typeof params.result.adapterResult.providerMetadata.promptEvalCount === "number"
      ? params.result.adapterResult.providerMetadata.promptEvalCount
      : null,
    evalCount: typeof params.result.adapterResult.providerMetadata.evalCount === "number"
      ? params.result.adapterResult.providerMetadata.evalCount
      : null,
    privacyClassification: params.request.privacyClassification,
    limitations: [
      "Static Stafford Media source snapshot only.",
      "No tools, retrieval, embeddings, production data, Professional data, or Personal data supplied.",
      "Local Ollama model output is untrusted until StaffordOS validation passes.",
      "No proof artifact is persisted by this harness.",
    ],
  };
}

export async function postOllamaGenerate(
  endpoint: typeof OLLAMA_CHIEF_OF_STAFF_ENDPOINT,
  payload: OllamaGeneratePayload,
): Promise<OllamaGenerateApiResponse> {
  assertLocalhostEndpoint(endpoint);
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), OLLAMA_CHIEF_OF_STAFF_TIMEOUT_MS);

  try {
    const response = await fetch(`${endpoint}/api/generate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama generate failed with HTTP ${response.status}.`);
    }

    return await response.json() as OllamaGenerateApiResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`MODEL_TIMEOUT: Ollama did not return within ${OLLAMA_CHIEF_OF_STAFF_TIMEOUT_MS} ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runOllamaChiefOfStaffProof(params: {
  request?: GovernedChiefOfStaffModelRequest;
  sources?: ChiefOfStaffSourceFixture[];
  endpoint?: typeof OLLAMA_CHIEF_OF_STAFF_ENDPOINT;
  transport?: OllamaGenerateTransport;
  attemptNumber?: number;
} = {}): Promise<OllamaProofResult> {
  const request = clone(params.request || STAFFORD_MEDIA_GOVERNED_CHIEF_OF_STAFF_MODEL_REQUEST);
  const sources = clone(params.sources || STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES);
  const endpoint = params.endpoint || OLLAMA_CHIEF_OF_STAFF_ENDPOINT;
  const transport = params.transport || postOllamaGenerate;
  const attemptNumber = params.attemptNumber || 1;
  const payload = buildOllamaGeneratePayload(request, sources);
  const inputInventory = buildOllamaProofInputInventory(request, sources);
  const startedAt = performance.now();

  assertLocalhostEndpoint(endpoint);

  let adapterResult: ChiefOfStaffAdapterResult;
  try {
    const apiResponse = await transport(endpoint, payload);
    if (!apiResponse.response || apiResponse.response.trim().length === 0) {
      adapterResult = adapterResultFromModel({
        request,
        proposedResponse: null,
        generationStatus: "Failed",
        warnings: ["MODEL_OUTPUT_EMPTY: Ollama returned no response text."],
        rawOutputAvailable: false,
        apiResponse,
      });
    } else {
      const proposedResponse = extractJsonObject(apiResponse.response);
      adapterResult = adapterResultFromModel({
        request,
        proposedResponse,
        generationStatus: "Proposed",
        warnings: [],
        rawOutputAvailable: true,
        apiResponse,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : CHIEF_OF_STAFF_ADAPTER_FALLBACK;
    adapterResult = adapterResultFromModel({
      request,
      proposedResponse: null,
      generationStatus: message.includes("JSON") ? "Invalid structured output" : "Failed",
      warnings: [message],
      rawOutputAvailable: false,
      apiResponse: null,
    });
  }

  const adapterExecutionResult = runChiefOfStaffAdapter({
    adapter: adapterForResult(adapterResult),
    governedRequest: request,
    authorizedSources: sources,
  });
  const failureClassification = classifyFailure(adapterExecutionResult);
  const durationMs = performance.now() - startedAt;
  const auditEvidence = buildProofAuditEvidence({
    attemptNumber,
    request,
    result: adapterExecutionResult,
    failureClassification,
    durationMs,
  });

  return {
    attemptNumber,
    endpoint,
    modelName: OLLAMA_CHIEF_OF_STAFF_MODEL_NAME,
    modelDigest: OLLAMA_CHIEF_OF_STAFF_MODEL_DIGEST,
    inputInventory,
    payload,
    adapterExecutionResult,
    auditEvidence,
    failureClassification,
  };
}
