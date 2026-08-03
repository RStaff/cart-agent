import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";

const root = process.cwd();
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");

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

const validatorPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts");
const modelAdapterPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.ts");
const ollamaAdapterPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffOllamaAdapter.ts");

const validatorModule = compileModule(readFileSync(validatorPath, "utf8"), validatorPath);
const modelAdapterModule = compileModule(readFileSync(modelAdapterPath, "utf8"), modelAdapterPath, {
  "./chiefOfStaffValidator": validatorModule,
});
const ollamaAdapterModule = compileModule(readFileSync(ollamaAdapterPath, "utf8"), ollamaAdapterPath, {
  "./chiefOfStaffValidator": validatorModule,
  "./chiefOfStaffModelAdapter": modelAdapterModule,
});

const { runOllamaChiefOfStaffProof } = ollamaAdapterModule;

try {
  const result = await runOllamaChiefOfStaffProof({ attemptNumber: 1 });
  const validationResult = result.adapterExecutionResult.validationResult;
  const trustedResponse = result.adapterExecutionResult.trustedResponse;
  const report = result.adapterExecutionResult.operatorSafeReport;

  const summary = {
    status: trustedResponse ? "LOCAL_PROVIDER_CERTIFIED" : "LOCAL_PROVIDER_FAILED_SAFE",
    attemptNumber: result.attemptNumber,
    endpoint: result.endpoint,
    modelName: result.modelName,
    modelDigest: result.modelDigest,
    inputInventory: result.inputInventory,
    generationStatus: result.adapterExecutionResult.adapterResult.generationStatus,
    structuralValidationPassed: result.adapterExecutionResult.structuralGuardResult.valid,
    staffordosValidationPassed: validationResult?.valid || false,
    trustedResponseAvailable: Boolean(trustedResponse),
    failureClassification: result.failureClassification,
    validationErrorCodes: validationResult?.errors.map((error) => error.code) || [],
    trustedResponseHeadline: trustedResponse?.headline || null,
    recommendationStatus: trustedResponse?.candidateActions[0]?.recommendationStatus || null,
    operatorSafeReport: {
      trusted: report.trusted,
      headline: report.headline,
      summary: report.summary,
      claimsChecked: report.claimsChecked,
      recommendationsChecked: report.recommendationsChecked,
      sourcesChecked: report.sourcesChecked,
      technicalDetails: report.technicalDetails,
    },
    auditEvidence: result.auditEvidence,
    runtimeBoundary: {
      localhostOnly: true,
      toolsSupplied: false,
      retrievalSupplied: false,
      persistenceSupplied: false,
      productionDataSupplied: false,
      professionalDataSupplied: false,
      personalDataSupplied: false,
      rawModelOutputPrinted: false,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
  process.exitCode = trustedResponse ? 0 : 1;
} catch (error) {
  console.log(JSON.stringify({
    status: "LOCAL_PROVIDER_BLOCKED",
    message: error instanceof Error ? error.message : "Unknown Ollama proof failure.",
    rawModelOutputPrinted: false,
  }, null, 2));
  process.exitCode = 1;
}
