import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const validatorPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts");
const adapterPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");

const validatorSource = readFileSync(validatorPath, "utf8");
const adapterSource = readFileSync(adapterPath, "utf8");

function compileModule(source, filename, overrides = {}) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = (id) => overrides[id] || originalRequire(id);
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}

const validatorModule = compileModule(validatorSource, validatorPath);
const adapterModule = compileModule(adapterSource, adapterPath, {
  "./chiefOfStaffValidator": validatorModule,
});

const {
  AdapterFailureAdapter,
  CHIEF_OF_STAFF_ADAPTER_FALLBACK,
  CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION,
  CrossWorkspaceLeakAdapter,
  DeterministicFixtureChiefOfStaffAdapter,
  InvalidShapeAdapter,
  PlannedAsAvailableAdapter,
  STAFFORD_MEDIA_GOVERNED_CHIEF_OF_STAFF_MODEL_REQUEST,
  UnauthorizedStatusAdapter,
  UnsourcedClaimAdapter,
  buildGovernedChiefOfStaffModelRequest,
  guardChiefOfStaffStructuredResponse,
  runChiefOfStaffAdapter,
} = adapterModule;

const {
  PERSONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE,
  STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE,
} = validatorModule;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function governedRequest() {
  return buildGovernedChiefOfStaffModelRequest(
    clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE),
    clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES),
  );
}

function run(adapter, request = governedRequest(), sources = STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES) {
  return runChiefOfStaffAdapter({
    adapter,
    governedRequest: clone(request),
    authorizedSources: clone(sources),
  });
}

function errorCodes(result) {
  return result.validationResult?.errors.map((error) => error.code) || [];
}

function expectBlocked(result) {
  assert.equal(result.trustedResponse, null);
  assert.equal(result.operatorSafeReport.trusted, false);
}

function adapterResult(adapter, request, response, overrides = {}) {
  return {
    adapterId: adapter.adapterId,
    adapterKind: adapter.adapterKind,
    providerName: adapter.providerName,
    modelName: adapter.modelName,
    contractVersion: request.contractVersion,
    requestId: request.requestId,
    proposedResponse: response,
    rawOutputAvailable: false,
    generationStatus: "Proposed",
    adapterWarnings: [],
    providerMetadata: {
      deterministicFixture: true,
    },
    generatedAt: request.currentTimeFixture,
    deterministicFixture: true,
    ...overrides,
  };
}

test("deterministic fixture adapter implements the provider-neutral contract", () => {
  assert.equal(DeterministicFixtureChiefOfStaffAdapter.adapterId, "deterministic-fixture-chief-of-staff-adapter");
  assert.equal(DeterministicFixtureChiefOfStaffAdapter.contractVersion, CHIEF_OF_STAFF_MODEL_CONTRACT_VERSION);
  assert.equal(DeterministicFixtureChiefOfStaffAdapter.capabilities.structuredOutput, true);
  assert.equal(DeterministicFixtureChiefOfStaffAdapter.capabilities.toolUse, false);
  assert.equal(DeterministicFixtureChiefOfStaffAdapter.capabilities.streaming, false);
  assert.equal(DeterministicFixtureChiefOfStaffAdapter.capabilities.localExecution, true);
  assert.equal(DeterministicFixtureChiefOfStaffAdapter.capabilities.externalNetwork, false);
});

test("same request produces the same proposed response", () => {
  const request = governedRequest();
  const first = DeterministicFixtureChiefOfStaffAdapter.generateStructuredResponse(clone(request));
  const second = DeterministicFixtureChiefOfStaffAdapter.generateStructuredResponse(clone(request));

  assert.deepEqual(first, second);
});

test("valid fixture adapter output passes structural checks", () => {
  const request = governedRequest();
  const adapterResultValue = DeterministicFixtureChiefOfStaffAdapter.generateStructuredResponse(request);
  const structural = guardChiefOfStaffStructuredResponse(adapterResultValue.proposedResponse);

  assert.equal(structural.valid, true);
  assert.deepEqual(structural.errors, []);
});

test("valid adapter output passes S009.01 validation", () => {
  const result = run(DeterministicFixtureChiefOfStaffAdapter);

  assert.equal(result.validationResult?.valid, true);
  assert.equal(result.validationResult?.validationStatus, "accepted");
});

test("trusted response exists only after validation passes", () => {
  const valid = run(DeterministicFixtureChiefOfStaffAdapter);
  const invalid = run(UnsourcedClaimAdapter);

  assert.ok(valid.trustedResponse);
  assert.equal(valid.operatorSafeReport.trusted, true);
  assert.equal(invalid.trustedResponse, null);
  assert.equal(invalid.operatorSafeReport.trusted, false);
});

test("UnsourcedClaimAdapter is blocked", () => {
  const result = run(UnsourcedClaimAdapter);

  expectBlocked(result);
  assert.ok(errorCodes(result).includes("CLAIM_WITHOUT_SOURCE"));
});

test("CrossWorkspaceLeakAdapter is blocked", () => {
  const result = run(CrossWorkspaceLeakAdapter);

  expectBlocked(result);
  assert.ok(errorCodes(result).includes("SOURCE_NOT_FOUND"));
});

test("UnauthorizedStatusAdapter is blocked", () => {
  const result = run(UnauthorizedStatusAdapter);

  expectBlocked(result);
  assert.equal(result.structuralGuardResult.valid, false);
  assert.ok(result.structuralGuardResult.errors.some((error) => error.code === "UNSUPPORTED_RECOMMENDATION_STATUS"));
});

test("InvalidShapeAdapter is blocked before semantic validation", () => {
  const result = run(InvalidShapeAdapter);

  expectBlocked(result);
  assert.equal(result.structuralGuardResult.valid, false);
  assert.equal(result.validationResult, null);
  assert.ok(result.structuralGuardResult.errors.some((error) => error.code === "MISSING_RESPONSE_FIELD"));
});

test("AdapterFailureAdapter fails closed", () => {
  const result = run(AdapterFailureAdapter);

  expectBlocked(result);
  assert.equal(result.adapterResult.generationStatus, "Failed");
  assert.equal(result.validationResult, null);
  assert.equal(result.operatorSafeReport.summary, CHIEF_OF_STAFF_ADAPTER_FALLBACK);
});

test("PlannedAsAvailableAdapter is blocked", () => {
  const result = run(PlannedAsAvailableAdapter);

  expectBlocked(result);
  assert.ok(errorCodes(result).includes("SOURCE_NOT_FOUND"));
});

test("adapter success alone does not create trustedResponse", () => {
  const result = run(UnsourcedClaimAdapter);

  assert.equal(result.generationSucceeded, true);
  assert.equal(result.adapterResult.generationStatus, "Proposed");
  assert.equal(result.trustedResponse, null);
});

test("provider name does not affect trust", () => {
  const renamedAdapter = {
    ...DeterministicFixtureChiefOfStaffAdapter,
    adapterId: "renamed-provider-fixture-adapter",
    providerName: "Different local fixture provider",
  };

  const result = run(renamedAdapter);

  assert.equal(result.validationResult?.valid, true);
  assert.ok(result.trustedResponse);
  assert.equal(result.auditEnvelope.providerName, "Different local fixture provider");
});

test("model name does not affect trust", () => {
  const renamedAdapter = {
    ...UnsourcedClaimAdapter,
    adapterId: "renamed-model-invalid-fixture-adapter",
    modelName: "Different local fixture model",
  };

  const result = run(renamedAdapter);

  expectBlocked(result);
  assert.ok(errorCodes(result).includes("CLAIM_WITHOUT_SOURCE"));
  assert.equal(result.auditEnvelope.modelName, "Different local fixture model");
});

test("no bypass flag exists", () => {
  assert.doesNotMatch(adapterSource.toLowerCase(), /bypass|skipvalidation|trustedbyprovider|trustbasedonprovider|trustbasedonmodel/);
});

test("adapter cannot modify request workspace", () => {
  const request = governedRequest();
  const mutatingAdapter = {
    ...DeterministicFixtureChiefOfStaffAdapter,
    adapterId: "workspace-mutating-fixture-adapter",
    generateStructuredResponse(governed) {
      governed.workspaceId = "professional";
      return adapterResult(this, governed, clone(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE), {
        requestId: request.requestId,
      });
    },
  };

  const result = runChiefOfStaffAdapter({
    adapter: mutatingAdapter,
    governedRequest: request,
    authorizedSources: clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES),
  });

  assert.equal(request.workspaceId, "stafford-media");
  assert.equal(result.auditEnvelope.workspaceId, "stafford-media");
  assert.ok(result.trustedResponse);
});

test("adapter cannot add unauthorized sources", () => {
  const sourceAddingAdapter = {
    ...DeterministicFixtureChiefOfStaffAdapter,
    adapterId: "source-adding-fixture-adapter",
    generateStructuredResponse(governed) {
      const response = clone(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE);
      response.responseId = "s009-03-source-adding";
      response.supportingClaims.push({
        claimId: "claim-source-added-by-adapter",
        claimType: "SOURCE_FACT",
        statement: "An adapter-added source is available now.",
        supportingSourceIds: ["source-added-by-adapter"],
        confidenceClassification: "High confidence",
        limitation: "Static validation fixture only.",
        workspaceId: "stafford-media",
        authorityStatus: "Informational only",
      });
      response.sources.push({
        sourceId: "source-added-by-adapter",
        exactSourceReference: "s009-03-adapter-added-source",
      });
      return adapterResult(this, governed, response);
    },
  };

  const result = run(sourceAddingAdapter);

  expectBlocked(result);
  assert.ok(errorCodes(result).includes("SOURCE_NOT_FOUND"));
});

test("Professional and Personal sources remain unavailable to Stafford Media request", () => {
  const request = buildGovernedChiefOfStaffModelRequest(
    clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE),
    [
      ...clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES),
      ...clone(PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES),
      ...clone(PERSONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES),
    ],
  );

  assert.ok(request.authorizedSources.length > 0);
  assert.ok(request.authorizedSources.every((source) => source.workspaceId === "stafford-media"));
  assert.doesNotMatch(JSON.stringify(request), /source-professional-planned|source-personal-planned/);
});

test("adapter metadata cannot override workspace authority", () => {
  const metadataAdapter = {
    ...DeterministicFixtureChiefOfStaffAdapter,
    adapterId: "metadata-override-fixture-adapter",
    generateStructuredResponse(governed) {
      return adapterResult(this, governed, clone(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE), {
        providerMetadata: {
          workspaceId: "professional",
          trusted: true,
        },
      });
    },
  };

  const result = run(metadataAdapter);

  assert.equal(result.auditEnvelope.workspaceId, "stafford-media");
  assert.ok(result.trustedResponse);
});

test("unsupported contract fails closed", () => {
  const unsupportedAdapter = {
    ...DeterministicFixtureChiefOfStaffAdapter,
    adapterId: "unsupported-contract-fixture-adapter",
    contractVersion: "S009.99",
  };

  const result = run(unsupportedAdapter);

  expectBlocked(result);
  assert.equal(result.adapterResult.generationStatus, "Unsupported request");
  assert.equal(result.validationResult, null);
});

test("audit envelope records generation and validation status", () => {
  const valid = run(DeterministicFixtureChiefOfStaffAdapter);
  const invalid = run(UnsourcedClaimAdapter);

  assert.equal(valid.auditEnvelope.generationStatus, "Proposed");
  assert.equal(valid.auditEnvelope.validationStatus, "accepted");
  assert.equal(valid.auditEnvelope.trustedResponseAvailable, true);
  assert.equal(invalid.auditEnvelope.generationStatus, "Proposed");
  assert.equal(invalid.auditEnvelope.validationStatus, "rejected");
  assert.equal(invalid.auditEnvelope.trustedResponseAvailable, false);
  assert.ok(invalid.auditEnvelope.validationErrorCodes.includes("CLAIM_WITHOUT_SOURCE"));
});

test("audit envelope contains no secrets", () => {
  const auditText = JSON.stringify(run(DeterministicFixtureChiefOfStaffAdapter).auditEnvelope).toLowerCase();

  assert.doesNotMatch(auditText, /secret|token|credential|password|private key|api key|oauth|kms|jwt/);
});

test("pipeline does not mutate inputs", () => {
  const request = governedRequest();
  const sources = clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES);
  const before = JSON.stringify({ request, sources });

  runChiefOfStaffAdapter({
    adapter: DeterministicFixtureChiefOfStaffAdapter,
    governedRequest: request,
    authorizedSources: sources,
  });

  assert.equal(JSON.stringify({ request, sources }), before);
});

test("constant Stafford Media request is deterministic", () => {
  assert.deepEqual(STAFFORD_MEDIA_GOVERNED_CHIEF_OF_STAFF_MODEL_REQUEST, governedRequest());
  assert.deepEqual(governedRequest(), governedRequest());
});

test("source contains no network API database persistence provider SDK prompt or operator-loader imports", () => {
  const combinedSource = adapterSource.toLowerCase();

  for (const forbidden of [
    "fetch(",
    "xmlhttprequest",
    "/api/",
    "prisma",
    "localstorage",
    "sessionstorage",
    "openai",
    "anthropic",
    "googleai",
    "embedding",
    "vector",
    "chat",
    "prompt",
    "writefile",
    "readfilesync",
    "../operator",
    "../../operator",
  ]) {
    assert.doesNotMatch(combinedSource, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
