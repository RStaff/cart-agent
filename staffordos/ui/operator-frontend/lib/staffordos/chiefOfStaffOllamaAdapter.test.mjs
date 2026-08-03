import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const validatorPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts");
const modelAdapterPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.ts");
const ollamaAdapterPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffOllamaAdapter.ts");
const proofCommandPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runOllamaChiefOfStaffProof.mjs");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");

const validatorSource = readFileSync(validatorPath, "utf8");
const modelAdapterSource = readFileSync(modelAdapterPath, "utf8");
const ollamaAdapterSource = readFileSync(ollamaAdapterPath, "utf8");
const proofCommandSource = readFileSync(proofCommandPath, "utf8");

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
const modelAdapterModule = compileModule(modelAdapterSource, modelAdapterPath, {
  "./chiefOfStaffValidator": validatorModule,
});
const ollamaAdapterModule = compileModule(ollamaAdapterSource, ollamaAdapterPath, {
  "./chiefOfStaffValidator": validatorModule,
  "./chiefOfStaffModelAdapter": modelAdapterModule,
});

const {
  OLLAMA_CHIEF_OF_STAFF_ADAPTER_ID,
  OLLAMA_CHIEF_OF_STAFF_CAPABILITIES,
  OLLAMA_CHIEF_OF_STAFF_ENDPOINT,
  OLLAMA_CHIEF_OF_STAFF_MODEL_DIGEST,
  OLLAMA_CHIEF_OF_STAFF_MODEL_NAME,
  buildOllamaGeneratePayload,
  buildOllamaProofInputInventory,
  runOllamaChiefOfStaffProof,
} = ollamaAdapterModule;

const {
  PERSONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE,
} = validatorModule;

const {
  STAFFORD_MEDIA_GOVERNED_CHIEF_OF_STAFF_MODEL_REQUEST,
} = modelAdapterModule;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validTransport(response = clone(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE)) {
  return async (endpoint, payload) => {
    assert.equal(endpoint, OLLAMA_CHIEF_OF_STAFF_ENDPOINT);
    assert.equal(payload.model, OLLAMA_CHIEF_OF_STAFF_MODEL_NAME);
    return {
      model: OLLAMA_CHIEF_OF_STAFF_MODEL_NAME,
      created_at: "2026-08-02T11:30:00Z",
      response: JSON.stringify(response),
      done: true,
      total_duration: 1000000,
      prompt_eval_count: 120,
      eval_count: 240,
    };
  };
}

function invalidApprovedResponse() {
  const response = clone(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE);
  response.candidateActions[0].recommendationStatus = "Approved";
  return response;
}

test("Ollama adapter metadata declares the bounded local provider", () => {
  assert.equal(OLLAMA_CHIEF_OF_STAFF_ADAPTER_ID, "ollama-local-chief-of-staff-adapter");
  assert.equal(OLLAMA_CHIEF_OF_STAFF_MODEL_NAME, "qwen2.5:1.5b");
  assert.equal(
    OLLAMA_CHIEF_OF_STAFF_MODEL_DIGEST,
    "65ec06548149b04c096a120e4a6da9d4017ea809c91734ea5631e89f96ddc57b",
  );
  assert.equal(OLLAMA_CHIEF_OF_STAFF_CAPABILITIES.structuredOutput, true);
  assert.equal(OLLAMA_CHIEF_OF_STAFF_CAPABILITIES.toolUse, false);
  assert.equal(OLLAMA_CHIEF_OF_STAFF_CAPABILITIES.streaming, false);
  assert.equal(OLLAMA_CHIEF_OF_STAFF_CAPABILITIES.localExecution, true);
  assert.equal(OLLAMA_CHIEF_OF_STAFF_CAPABILITIES.externalNetwork, false);
});

test("Ollama payload uses only the governed Stafford Media fixture", () => {
  const payload = buildOllamaGeneratePayload();
  const payloadText = JSON.stringify(payload);

  assert.equal(payload.model, "qwen2.5:1.5b");
  assert.equal(payload.stream, false);
  assert.equal(payload.format, "json");
  assert.equal(payload.keep_alive, "0");
  assert.equal(payload.options.temperature, 0);
  assert.equal(payload.options.num_ctx, 4096);
  assert.equal(Object.prototype.hasOwnProperty.call(payload, "tools"), false);
  assert.doesNotMatch(payloadText, /source-professional-planned|source-personal-planned/);
  assert.doesNotMatch(payloadText, /GMAIL_APP_PASSWORD|OPENAI_API_KEY|DATABASE_URL|CF_API_TOKEN|SERPER_API_KEY/);
});

test("source inventory is redacted and workspace bounded", () => {
  const inventory = buildOllamaProofInputInventory();

  assert.equal(inventory.workspaceId, "stafford-media");
  assert.ok(inventory.sourceIds.length > 0);
  assert.ok(inventory.privacyClassifications.every((classification) => classification === "owner_private_stafford_media_fixture"));
  assert.ok(inventory.prohibitedInformationConfirmedAbsent.includes("production data"));
  assert.ok(inventory.prohibitedInformationConfirmedAbsent.includes("Professional workspace data"));
  assert.ok(inventory.prohibitedInformationConfirmedAbsent.includes("Personal workspace data"));
});

test("Professional and Personal sources cannot be supplied", () => {
  assert.throws(() => buildOllamaGeneratePayload(
    clone(STAFFORD_MEDIA_GOVERNED_CHIEF_OF_STAFF_MODEL_REQUEST),
    [
      ...clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES),
      ...clone(PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES),
      ...clone(PERSONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES),
    ],
  ), /only static Stafford Media fixture sources/);
});

test("non-localhost endpoint is rejected before transport", async () => {
  await assert.rejects(
    () => runOllamaChiefOfStaffProof({
      endpoint: "http://localhost:11434",
      transport: validTransport(),
    }),
    /127\.0\.0\.1:11434/,
  );
});

test("mocked valid Ollama output passes structural and StaffordOS validation", async () => {
  const result = await runOllamaChiefOfStaffProof({ transport: validTransport() });

  assert.equal(result.adapterExecutionResult.structuralGuardResult.valid, true);
  assert.equal(result.adapterExecutionResult.validationResult?.valid, true);
  assert.ok(result.adapterExecutionResult.trustedResponse);
  assert.equal(result.auditEvidence.trustedResponseAvailable, true);
  assert.equal(result.failureClassification, "NONE");
});

test("trustedResponse exists only after StaffordOS validation passes", async () => {
  const result = await runOllamaChiefOfStaffProof({ transport: validTransport(invalidApprovedResponse()) });

  assert.equal(result.adapterExecutionResult.structuralGuardResult.valid, false);
  assert.equal(result.adapterExecutionResult.validationResult, null);
  assert.equal(result.adapterExecutionResult.trustedResponse, null);
  assert.equal(result.auditEvidence.trustedResponseAvailable, false);
});

test("malformed model output fails closed", async () => {
  const result = await runOllamaChiefOfStaffProof({
    transport: async () => ({
      model: OLLAMA_CHIEF_OF_STAFF_MODEL_NAME,
      response: "not-json",
      done: true,
    }),
  });

  assert.equal(result.adapterExecutionResult.trustedResponse, null);
  assert.equal(result.adapterExecutionResult.adapterResult.generationStatus, "Invalid structured output");
  assert.equal(result.failureClassification, "INVALID_STRUCTURE");
});

test("empty model output fails closed", async () => {
  const result = await runOllamaChiefOfStaffProof({
    transport: async () => ({
      model: OLLAMA_CHIEF_OF_STAFF_MODEL_NAME,
      response: "",
      done: true,
    }),
  });

  assert.equal(result.adapterExecutionResult.trustedResponse, null);
  assert.equal(result.adapterExecutionResult.adapterResult.generationStatus, "Failed");
  assert.equal(result.failureClassification, "MODEL_OUTPUT_EMPTY");
});

test("transport failure fails closed", async () => {
  const result = await runOllamaChiefOfStaffProof({
    transport: async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:11434");
    },
  });

  assert.equal(result.adapterExecutionResult.trustedResponse, null);
  assert.equal(result.adapterExecutionResult.adapterResult.generationStatus, "Failed");
  assert.equal(result.failureClassification, "MODEL_UNAVAILABLE");
});

test("transport timeout fails closed", async () => {
  const result = await runOllamaChiefOfStaffProof({
    transport: async () => {
      throw new Error("MODEL_TIMEOUT: Ollama did not return within 60000 ms.");
    },
  });

  assert.equal(result.adapterExecutionResult.trustedResponse, null);
  assert.equal(result.adapterExecutionResult.adapterResult.generationStatus, "Failed");
  assert.equal(result.failureClassification, "MODEL_TIMEOUT");
});

test("audit evidence records bounded generation without secrets", async () => {
  const result = await runOllamaChiefOfStaffProof({ transport: validTransport() });
  const auditText = JSON.stringify(result.auditEvidence);

  assert.equal(result.auditEvidence.adapterId, OLLAMA_CHIEF_OF_STAFF_ADAPTER_ID);
  assert.equal(result.auditEvidence.endpoint, OLLAMA_CHIEF_OF_STAFF_ENDPOINT);
  assert.equal(result.auditEvidence.modelName, OLLAMA_CHIEF_OF_STAFF_MODEL_NAME);
  assert.equal(result.auditEvidence.promptEvalCount, 120);
  assert.equal(result.auditEvidence.evalCount, 240);
  assert.doesNotMatch(auditText, /OPENAI_API_KEY|DATABASE_URL|GMAIL_APP_PASSWORD|CF_API_TOKEN|SERPER_API_KEY/);
});

test("proof harness does not mutate request, sources, or response", async () => {
  const request = clone(STAFFORD_MEDIA_GOVERNED_CHIEF_OF_STAFF_MODEL_REQUEST);
  const sources = clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES);
  const response = clone(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE);
  const before = JSON.stringify({ request, sources, response });

  await runOllamaChiefOfStaffProof({
    request,
    sources,
    transport: validTransport(response),
  });

  assert.equal(JSON.stringify({ request, sources, response }), before);
});

test("adapter source does not start servers pull models or import operator runtime", () => {
  const combinedSource = `${ollamaAdapterSource}\n${proofCommandSource}`;

  for (const forbidden of [
    "ollama serve",
    "ollama pull",
    "brew install",
    "../operator",
    "../../operator",
    "prisma",
    "openai",
    "anthropic",
    "googleai",
    "ross-llm",
  ]) {
    assert.doesNotMatch(combinedSource.toLowerCase(), new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
