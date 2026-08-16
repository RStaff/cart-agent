import { createHash } from "node:crypto";

const ANSWERS = ["DIRECT", "TRANSFERABLE", "PARTIAL", "NO_SUPPORTED_EQUIVALENT", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"];

const scopeExplanation = {
  INDIVIDUAL_OR_CONTRIBUTOR: "individual contribution and supported participation",
  OWNERSHIP: "bounded ownership or accountability",
  PROGRAM_LEADERSHIP: "program leadership and cross-functional delivery",
  TEAM_LEADERSHIP: "team leadership and people-management scope",
  PORTFOLIO_ENTERPRISE: "portfolio, enterprise, or global scope",
  UNSPECIFIED: "the exact responsibility scope stated by each requirement",
};

const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

function projectionRules(target) {
  const specialistGuard = target.specialist
    ? "requires explicit specialist-compatible authority; generic authority is blocked"
    : "specialist firewall passed for this target";
  const scopeGuard = `target scope is ${target.scopeClassification}; no broader scope is inferred`;
  return ANSWERS.map((answer) => ({
    answer,
    relationship: answer,
    consumable: ["DIRECT", "TRANSFERABLE", "PARTIAL"].includes(answer) && !(target.specialist && answer !== "DIRECT"),
    guard: `${specialistGuard}; ${scopeGuard}`,
    boundedToRequirementId: target.requirementId,
    boundedToOpportunityId: target.opportunityId,
  }));
}

export function compressScopeSafeManifest(manifest, { reviewSetId = "V1_26L2_SCOPE_SAFE_COMPRESSED_REVIEW", validateInput = true } = {}) {
  if (!manifest || (validateInput && manifest.reconstructedQuestionCount !== 90)) throw new Error("V1.26L1 manifest must contain 90 questions");
  const allTargets = manifest.questions.flatMap((question) => question.targetRequirements);
  const targetIds = allTargets.map((target) => target.requirementId);
  if (new Set(targetIds).size !== targetIds.length) throw new Error("V1.26L1 manifest contains duplicate targets");

  const groups = new Map();
  for (const question of manifest.questions) {
    const key = [question.capabilityFamily, question.specialistClass, question.scopeClassification].join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(question);
  }

  const questions = [...groups.entries()].map(([key, members], index) => {
    const [capabilityFamily, specialistClass, scopeClassification] = key.split("|");
    const targets = members.flatMap((member) => member.targetRequirements).sort((a, b) => a.requirementId.localeCompare(b.requirementId));
    const importanceClasses = [...new Set(members.map((member) => member.importance))].sort();
    const targetProjectionRules = targets.map((target) => ({
      requirementId: target.requirementId,
      opportunityId: target.opportunityId,
      specialist: target.specialist,
      scopeClassification: target.scopeClassification,
      importance: target.importance,
      rules: projectionRules(target),
    }));
    return {
      reviewSetId,
      compressedQuestionId: `compressed_${String(index + 1).padStart(2, "0")}`,
      questionOrder: index + 1,
      operatorQuestion: `What level of ${scopeExplanation[scopeClassification] || "capability"} does your existing authority support for the exact ${capabilityFamily.toLowerCase().replaceAll("_", " ")} requirements listed here?`,
      explanation: `These targets share the same governed capability family, specialist boundary, and structural scope. Requirement importance remains target-specific and is preserved in each target record.`,
      capabilityFamily,
      specialistClass,
      scopeClassification,
      sourceQuestionIds: members.map((member) => member.questionId).sort(),
      mergedImportanceClasses: importanceClasses,
      allowedAnswers: ANSWERS,
      targetCount: targets.length,
      targetRequirementIds: targets.map((target) => target.requirementId),
      targetOpportunityIds: [...new Set(targets.map((target) => target.opportunityId))].sort(),
      targets,
      targetProjectionRules,
      compressionReason: "Merged only V1.26L1 questions with identical capability-family, specialist, and scope partitions; importance variants remain target-specific.",
      safetyBoundaries: {
        specialist: "generic and specialist targets are never merged",
        scope: "V1.26L1 scope partitions are never merged",
        relationship: "DIRECT, TRANSFERABLE, and PARTIAL remain distinct",
        provenance: "each target retains its exact requirement and opportunity identity",
      },
    };
  });
  const ordered = questions.sort((a, b) => a.compressedQuestionId.localeCompare(b.compressedQuestionId));
  const compressedTargets = ordered.flatMap((question) => question.targetRequirementIds);
  return {
    schemaVersion: "staffordos.careeros.v1_26l2.scope_safe_compressed_review.v1",
    offlineOnly: true,
    reviewSetId,
    sourceManifestHash: manifest.manifestHash,
    originalQuestionCount: manifest.reconstructedQuestionCount,
    compressedQuestionCount: ordered.length,
    questions: ordered,
    exactTargetCount: compressedTargets.length,
    uniqueTargetCount: new Set(compressedTargets).size,
    duplicateTargetCount: compressedTargets.length - new Set(compressedTargets).size,
    manifestHash: hash(ordered),
    noLabelsUsed: true,
  };
}

export { ANSWERS, projectionRules };
