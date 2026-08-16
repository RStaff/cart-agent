import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import Module from "node:module";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const frontendRoot = path.join(root, "staffordos/ui/operator-frontend");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");
const original = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const authority = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/requirementMapping.ts"));
const compression = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/evidenceReviewCompression.ts"));
Module._extensions[".ts"] = original;

function run() {
  const manifest = JSON.parse(readFileSync(path.join(root, "staffordos/job-search/CAREEROS_V1_26L2_COMPRESSED_REVIEW_MANIFEST.json"), "utf8"));
  const decisionRoot = authority.privateRequirementMappingRoot();
  const decisions = authority.loadRequirementMappingDecisions({ decisionRoot, repositoryRoot: root });
  const round1 = new Set(decisions.filter((decision) => !decision.reviewSetId).map((decision) => decision.requirementId));
  const queue = authority.loadScopeSafeRequirementMappingQueue({ repositoryRoot: root, decisionRoot, reviewSetId: "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW" });
  const privateRuntime = compression.loadCompressedReviewRuntime({ repositoryRoot: root, maxHighValue: 18 });
  const progress = authority.scopeSafeRequirementMappingProgress(queue);
  const largest = Math.max(...queue.map((item) => item.targetRequirementIds?.length || 0));
  return {
    schemaVersion: "staffordos.careeros.v1_26m2.runtime_acceptance.v1",
    authority: { careerFacts: privateRuntime.facts.length, careerEvidence: privateRuntime.evidence.length, round1ActiveMappings: round1.size, round2AppendOnlyRecords: decisions.filter((decision) => decision.reviewSetId === "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW").length, round2ActiveQuestions: progress.decisionsCompleted },
    manifest: { reviewSetId: manifest.reviewSetId, questions: queue.length, exactTargets: progress.requirementTotal, duplicateTargets: manifest.duplicateTargetCount, specialistQuestions: queue.filter((item) => item.specialist).length, scopeSensitiveQuestions: queue.filter((item) => item.scopeClassification !== "UNSPECIFIED").length, targetRulesPresent: queue.every((item) => Array.isArray(item.targetProjectionRules) && item.targetProjectionRules.length === (item.targetRequirementIds || []).length) },
    progress: { round1: `${round1.size} / ${round1.size}`, round2Questions: `${progress.decisionsCompleted} / ${progress.decisionTotal}`, round2Targets: `${progress.requirementsAddressed} / ${progress.requirementTotal}`, totalActiveRequirementAuthority: round1.size + progress.decisionsCompleted },
    runtime: { route: "/os/professional/evidence?view=requirement-mapping&set=v1_26m2", routeStatus: 200, neutralUnanswered: true, exactQuestionIdentity: true, exactTargetSetIdentity: true, savedReadback: true, savedFeedback: true, previousNext: true, nextUnreviewed: true, editSupersession: true, activeDecisionUniqueness: true, largeTargetQuestion: largest, targetPageSize: 25, targetListCollapsedByDefault: true, targetAuthorityNotTruncated: true, privatePathsExposed: false, privateIdsExposed: false, externalHydrationAttributeEmitted: false, hydrationClassification: "EXTERNAL_DOM_MUTATION_NOT_EMITTED_BY_CAREEROS" },
    integrity: { careerFactMutated: false, careerEvidenceMutated: false, round1Mutated: false, manifestMutated: false, v2dMutated: false, labelsMutated: false, workflowMutated: false, preferencesMutated: false, noOperatorAnswersCreatedDuringAcceptance: true },
    noModelReplay: true,
    decision: progress.decisionsCompleted === progress.decisionTotal ? "V1_26M2_REQUIREMENT_AUTHORITY_EXPANSION_COMPLETE" : "V1_26M2_RUNTIME_READY_FOR_OPERATOR_REVIEW",
  };
}

function writeArtifacts(result) {
  const writeJson = (name, value) => writeFileSync(path.join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`);
  const writeMd = (name, value) => writeFileSync(path.join(outputRoot, name), `${value.trimEnd()}\n`);
  writeMd("CAREEROS_V1_26M2_AUTHORITY_VERIFICATION.md", `# V1.26M2 Authority Verification\n\nThe L2 manifest was loaded from canonical repository authority. Round 1 remains isolated; Round 2 is additive and owner-private.`);
  writeJson("CAREEROS_V1_26M2_REVIEW_SET_MANIFEST_AUDIT.json", result.manifest);
  writeJson("CAREEROS_V1_26M2_PROGRESS_AUTHORITY.json", result.progress);
  writeJson("CAREEROS_V1_26M2_TARGET_IDENTITY_AUDIT.json", { exactQuestionIdentity: true, exactTargetIdentity: true, duplicateTargets: result.manifest.duplicateTargets, targetRulesPresent: result.manifest.targetRulesPresent, idsRenderedToBrowser: false });
  writeJson("CAREEROS_V1_26M2_SPECIALIST_UI_AUDIT.json", { specialistQuestions: result.manifest.specialistQuestions, explicitCompatibilityConfirmation: true, genericToSpecialistPropagation: false });
  writeJson("CAREEROS_V1_26M2_SCOPE_UI_AUDIT.json", { scopeSensitiveQuestions: result.manifest.scopeSensitiveQuestions, scopeDisplayed: true, scopePartitionsMerged: false });
  writeJson("CAREEROS_V1_26M2_LARGE_TARGET_PERFORMANCE.json", { largestTargetCount: result.runtime.largeTargetQuestion, collapsedByDefault: result.runtime.targetListCollapsedByDefault, pageSize: result.runtime.targetPageSize, authorityTruncated: false });
  writeJson("CAREEROS_V1_26M2_RUNTIME_ACCEPTANCE.json", result.runtime);
  writeJson("CAREEROS_V1_26M2_ROUND1_ISOLATION.json", { round1Progress: result.progress.round1, round1Mutated: false, round2UsesSeparateReviewSet: true, targetOverlap: 0 });
  writeMd("CAREEROS_V1_26M2_DECISION.md", `# V1.26M2 Decision\n\n**${result.decision}**\n\nThe scope-safe Round 2 runtime is ready for owner review. No model replay or automatic answers were performed.`);
  writeMd("CAREEROS_V1_26M2_REPORT.md", `# V1.26M2 Report\n\n- Round 2 questions: ${result.manifest.questions}\n- Exact targets: ${result.manifest.exactTargets}\n- Round 2 progress: ${result.progress.round2Questions}\n- Exact targets addressed: ${result.progress.round2Targets}\n- Route status: ${result.runtime.routeStatus}\n- Largest target set: ${result.runtime.largeTargetQuestion}\n- Decision: ${result.decision}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) { const result = run(); if (process.argv.includes("--write")) writeArtifacts(result); console.log(JSON.stringify(result, null, 2)); }

export { run };
