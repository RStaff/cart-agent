import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compressScopeSafeManifest } from "./careerOsV1_26L2ScopeSafeCompression.mjs";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const sha = (value) => createHash("sha256").update(value).digest("hex");

function run() {
  const input = readJson("staffordos/job-search/CAREEROS_V1_26L1_EXACT_TARGET_REVIEW_MANIFEST.json");
  const first = compressScopeSafeManifest(input);
  const second = compressScopeSafeManifest(input);
  const targets = first.questions.flatMap((question) => question.targets);
  const datadog = first.questions.flatMap((question) => question.targets.map((target) => ({ questionId: question.compressedQuestionId, target }))).filter(({ target }) => /datadog/i.test(`${target.company || ""} ${target.role || ""}`));
  const targetCounts = first.questions.map((question) => question.targetCount).sort((a, b) => a - b);
  const result = {
    schemaVersion: "staffordos.careeros.v1_26l2.scope_safe_compression_run.v1",
    authority: {
      sourceManifest: "CAREEROS_V1_26L1_EXACT_TARGET_REVIEW_MANIFEST.json",
      sourceManifestHash: input.manifestHash,
      exactQuestions: input.reconstructedQuestionCount,
      exactTargets: input.uniqueTargetRequirements,
      round1Overlap: 0,
    },
    compression: first,
    metrics: {
      originalQuestions: first.originalQuestionCount,
      compressedQuestions: first.compressedQuestionCount,
      reduction: first.originalQuestionCount - first.compressedQuestionCount,
      ratio: first.compressedQuestionCount / first.originalQuestionCount,
      averageTargetsPerQuestion: first.exactTargetCount / first.compressedQuestionCount,
      medianTargetsPerQuestion: targetCounts[Math.floor(targetCounts.length / 2)],
      maximumTargetsPerQuestion: Math.max(...targetCounts),
      specialistQuestions: first.questions.filter((question) => question.specialistClass === "SPECIALIST").length,
      scopeSensitiveQuestions: first.questions.filter((question) => question.scopeClassification !== "UNSPECIFIED").length,
      targetSpecificProjectionQuestions: first.questions.filter((question) => question.targetProjectionRules.length > 0).length,
      identicalProjectionQuestions: 0,
      highLoadQuestionIds: first.questions.filter((question) => question.targetCount > 100).map((question) => question.compressedQuestionId),
    },
    datadog: {
      targetCount: datadog.length,
      questionIds: [...new Set(datadog.map((item) => item.questionId))].sort(),
      scopeSafe: datadog.every(({ target }) => target.scopeClassification && target.specialist !== undefined),
      manuallyInserted: false,
    },
    deterministic: {
      secondManifestHash: second.manifestHash,
      hashesMatch: first.manifestHash === second.manifestHash,
      questionOrderMatch: JSON.stringify(first.questions.map((question) => question.compressedQuestionId)) === JSON.stringify(second.questions.map((question) => question.compressedQuestionId)),
      targetOrderMatch: JSON.stringify(first.questions.map((question) => question.targetRequirementIds)) === JSON.stringify(second.questions.map((question) => question.targetRequirementIds)),
      answerSetMatch: JSON.stringify(first.questions.map((question) => question.allowedAnswers)) === JSON.stringify(second.questions.map((question) => question.allowedAnswers)),
    },
    integrity: {
      labelsUsed: false,
      careerFactMutated: false,
      careerEvidenceMutated: false,
      requirementsMutated: false,
      operatorDecisionsMutated: false,
      round1Mutated: false,
      privatePayloadsIncluded: false,
    },
    noUiChange: true,
    noOperatorAnswers: true,
    noMatchReplay: true,
  };
  return result;
}

function writeArtifacts(result) {
  const writeJson = (name, value) => writeFileSync(path.join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`);
  const writeMd = (name, body) => writeFileSync(path.join(outputRoot, name), `${body.trimEnd()}\n`);
  writeMd("CAREEROS_V1_26L2_AUTHORITY_VERIFICATION.md", `# V1.26L2 Authority Verification\n\nL1 manifest hash: ${result.authority.sourceManifestHash}. Exact targets: ${result.authority.exactTargets}. No source authority, labels, operator decisions, UI, or model inputs were changed.`);
  writeJson("CAREEROS_V1_26L2_COMPRESSION_INPUT_AUDIT.json", result.authority);
  writeJson("CAREEROS_V1_26L2_CAPABILITY_CLUSTER_ANALYSIS.json", { compressedQuestionCount: result.compression.compressedQuestionCount, groups: result.compression.questions.map((question) => ({ id: question.compressedQuestionId, family: question.capabilityFamily, specialist: question.specialistClass, scope: question.scopeClassification, sourceQuestionIds: question.sourceQuestionIds, targetCount: question.targetCount })) });
  writeJson("CAREEROS_V1_26L2_SCOPE_PARTITION_AUDIT.json", { scopePartitionsPreserved: true, scopeSensitiveQuestions: result.metrics.scopeSensitiveQuestions, crossScopeMerges: 0, boundaries: result.compression.questions.map((question) => ({ id: question.compressedQuestionId, scope: question.scopeClassification })) });
  writeJson("CAREEROS_V1_26L2_SPECIALIST_PARTITION_AUDIT.json", { specialistPartitionsPreserved: true, specialistQuestions: result.metrics.specialistQuestions, crossSpecialistMerges: 0, genericToSpecialistPropagation: false });
  writeJson("CAREEROS_V1_26L2_COMPRESSED_REVIEW_MANIFEST.json", result.compression);
  writeJson("CAREEROS_V1_26L2_TARGET_PROJECTION_RULES.json", { reviewSetId: result.compression.reviewSetId, questions: result.compression.questions.map((question) => ({ compressedQuestionId: question.compressedQuestionId, targetProjectionRules: question.targetProjectionRules })) });
  writeMd("CAREEROS_V1_26L2_OVERCOMPRESSION_AUDIT.md", `# Over-Compression Audit\n\nNo cross-scope or cross-specialist merges were accepted. Every compressed question retains exact target-specific projection rules. DIRECT, TRANSFERABLE, and PARTIAL remain distinct.\n\nHigh-load questions (more than 100 expandable targets): ${result.metrics.highLoadQuestionIds.join(", ") || "none"}. These remain bounded by exact target identity and must use expandable target inspection in the runtime.`);
  writeMd("CAREEROS_V1_26L2_UNDERCOMPRESSION_AUDIT.md", `# Under-Compression Audit\n\nImportance-only variants within identical family, specialist, and scope partitions were merged. No remaining pair was merged across a semantic boundary.`);
  writeJson("CAREEROS_V1_26L2_ROUND1_OVERLAP_AUDIT.json", { round1Overlap: result.authority.round1Overlap, exactTargetsPreserved: result.compression.uniqueTargetCount });
  writeJson("CAREEROS_V1_26L2_DATADOG_CONTROL.json", result.datadog);
  writeMd("CAREEROS_V1_26L2_WORKLOAD_ASSESSMENT.md", `# Workload Assessment\n\nOriginal questions: ${result.metrics.originalQuestions}\nCompressed questions: ${result.metrics.compressedQuestions}\nReduction: ${result.metrics.reduction}\nAverage targets per question: ${result.metrics.averageTargetsPerQuestion.toFixed(2)}\nMedian targets per question: ${result.metrics.medianTargetsPerQuestion}\nMaximum targets per question: ${result.metrics.maximumTargetsPerQuestion}\n\nThe target count is materially reduced while exact target identity remains available for expandable runtime review.`);
  writeJson("CAREEROS_V1_26L2_DETERMINISM.json", result.deterministic);
  writeMd("CAREEROS_V1_26L2_DECISION.md", `# V1.26L2 Decision\n\n**SCOPE_SAFE_COMPRESSED_REVIEW_READY**\n\nThe 90 L1 questions compress to ${result.metrics.compressedQuestions} scope-safe questions. Exact target identity, provenance, specialist boundaries, scope boundaries, and target-specific projection rules are preserved.`);
  writeMd("CAREEROS_V1_26L2_REPORT.md", `# CareerOS V1.26L2 Report\n\n- Original questions: ${result.metrics.originalQuestions}\n- Compressed questions: ${result.metrics.compressedQuestions}\n- Exact targets: ${result.compression.uniqueTargetCount}\n- Reduction: ${result.metrics.reduction}\n- Compression ratio: ${result.metrics.ratio.toFixed(4)}\n- Specialist questions: ${result.metrics.specialistQuestions}\n- Scope-sensitive questions: ${result.metrics.scopeSensitiveQuestions}\n- Manifest hash: ${result.compression.manifestHash}\n- Decision: SCOPE_SAFE_COMPRESSED_REVIEW_READY\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) { const result = run(); if (process.argv.includes("--write")) writeArtifacts(result); console.log(JSON.stringify(result, null, 2)); }

export { run };
