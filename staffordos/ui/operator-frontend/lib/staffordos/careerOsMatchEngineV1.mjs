export const MATCH_ENGINE_VERSION = "CAREEROS_V1.21_OFFLINE";
export const EXPERIMENTAL_WEIGHT_SET = "EXPERIMENTAL_WEIGHT_SET_V1";

export const MATCH_ENGINE_WEIGHTS = Object.freeze({
  requiredSkillsFit: 35,
  relevantExperienceFit: 20,
  roleFunctionFit: 15,
  responsibilitySimilarity: 10,
  seniority: 8,
  domain: 7,
  geographyWorkArrangement: 5,
  compensation: 0,
});

const evidenceValues = Object.freeze({ PROVEN: 100, PARTIAL: 70, TRANSFERABLE: 55, MISSING: 0, UNKNOWN: null });

function text(value) { return typeof value === "string" ? value.trim() : ""; }
function list(value) { return Array.isArray(value) ? value : []; }
function round(value) { return Math.round(value * 100) / 100; }
function average(values) { return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null; }
function statusFor(values) {
  if (!values.length) return "NOT_APPLICABLE";
  if (values.some((value) => value === null)) return values.some((value) => value !== null) ? "PARTIAL" : "UNKNOWN";
  return "CALCULATED";
}
function component(name, score, status, evidence, missingInputs, explanation) {
  return { name, score, status, evidence: [...evidence], missingInputs: [...missingInputs], explanation };
}
function requirementRequired(requirement) {
  return requirement?.requirementLevel === "REQUIRED" || requirement?.importanceClassification === "Required";
}
function requirementPreferred(requirement) {
  return requirement?.requirementLevel === "PREFERRED" || requirement?.importanceClassification === "Preferred";
}
function mappingFor(requirement, mappings) { return mappings.find((mapping) => mapping.requirementId === requirement.id) || null; }
function evidenceCounts(mappings) {
  return mappings.reduce((counts, mapping) => {
    if (mapping.classification === "PROVEN") counts.exactEvidenceCount += 1;
    else if (mapping.classification === "TRANSFERABLE") counts.transferableEvidenceCount += 1;
    else if (mapping.classification === "PARTIAL") counts.exactEvidenceCount += 1;
    else if (mapping.classification === "MISSING") counts.unsupportedCount += 1;
    else if (mapping.classification === "UNKNOWN") counts.unknownCount += 1;
    return counts;
  }, { exactEvidenceCount: 0, transferableEvidenceCount: 0, weakEvidenceCount: 0, unsupportedCount: 0, unknownCount: 0 });
}
function requirementSummary(requirements, mappings) {
  const summary = { mandatoryCount: 0, preferredCount: 0, supportedMandatoryCount: 0, unsupportedMandatoryCount: 0, supportedPreferredCount: 0, unsupportedPreferredCount: 0 };
  for (const requirement of requirements) {
    const required = requirementRequired(requirement);
    const preferred = requirementPreferred(requirement);
    const mapping = mappingFor(requirement, mappings);
    if (required) summary.mandatoryCount += 1;
    if (preferred) summary.preferredCount += 1;
    if (!required && !preferred) continue;
    if (mapping && ["PROVEN", "PARTIAL", "TRANSFERABLE"].includes(mapping.classification)) {
      if (required) summary.supportedMandatoryCount += 1;
      if (preferred) summary.supportedPreferredCount += 1;
    } else if (mapping?.classification === "MISSING") {
      if (required) summary.unsupportedMandatoryCount += 1;
      if (preferred) summary.unsupportedPreferredCount += 1;
    }
  }
  return summary;
}
function requirementComponent(requirements, mappings, preferred = false) {
  const selected = requirements.filter((requirement) => preferred ? requirementPreferred(requirement) : requirementRequired(requirement));
  if (!selected.length) return component(preferred ? "preferredSkillsFit" : "requiredSkillsFit", null, "NOT_APPLICABLE", [], [], "No explicitly classified requirements were available.");
  const values = selected.map((requirement) => evidenceValues[mappingFor(requirement, mappings)?.classification || "UNKNOWN"]);
  const evidence = selected.flatMap((requirement) => {
    const mapping = mappingFor(requirement, mappings);
    return mapping?.careerEvidenceIds || [];
  });
  const missingInputs = selected.filter((requirement) => !mappingFor(requirement, mappings) || mappingFor(requirement, mappings)?.classification === "UNKNOWN").map((requirement) => requirement.id);
  return component(preferred ? "preferredSkillsFit" : "requiredSkillsFit", average(values), statusFor(values), evidence, missingInputs, `${selected.length} ${preferred ? "preferred" : "mandatory"} requirements were evaluated from requirement-level evidence mappings.`);
}
function evidenceComponent(qualification, mappings) {
  const values = mappings.map((mapping) => evidenceValues[mapping.classification]).filter((value) => value !== null);
  const score = qualification?.state === "PLAUSIBLE_TARGET" ? 100 : qualification?.state === "TRANSFERABLE_BUT_NOT_DIRECT" ? 70 : qualification?.state === "INSUFFICIENT_EVIDENCE" ? 35 : qualification?.state === "HARD_MISMATCH" ? 0 : average(values);
  return component("relevantExperienceFit", score, values.length && mappings.some((mapping) => evidenceValues[mapping.classification] === null) ? "PARTIAL" : values.length ? "CALCULATED" : "UNKNOWN", mappings.flatMap((mapping) => mapping.careerEvidenceIds || []), mappings.filter((mapping) => mapping.classification === "UNKNOWN").map((mapping) => mapping.requirementId), `Qualification state ${qualification?.state || "UNKNOWN"} is reused as a categorical input; no new career fact is inferred.`);
}
function roleComponent(opportunity, qualification, queueItem) {
  const score = qualification?.state === "PLAUSIBLE_TARGET" ? 100 : qualification?.state === "TRANSFERABLE_BUT_NOT_DIRECT" ? 70 : qualification?.state === "INSUFFICIENT_EVIDENCE" ? 35 : qualification?.state === "HARD_MISMATCH" ? 0 : null;
  const evidence = list(queueItem?.rankingSummary?.categoryContributions).flatMap((item) => item.matchedTerms || []);
  return component("roleFunctionFit", score, score === null ? "UNKNOWN" : "CALCULATED", evidence, score === null ? ["qualification.state"] : [], `Role/function fit reuses J010 qualification and existing J002 matched terms for traceability.`);
}
function responsibilityComponent(requirements, mappings) {
  const selected = requirements.filter((requirement) => requirement.requirementCategory === "Responsibility");
  if (!selected.length) return component("responsibilitySimilarity", null, "NOT_APPLICABLE", [], [], "No responsibility-classified requirements were available.");
  const values = selected.map((requirement) => evidenceValues[mappingFor(requirement, mappings)?.classification || "UNKNOWN"]);
  return component("responsibilitySimilarity", average(values), statusFor(values), selected.flatMap((requirement) => mappingFor(requirement, mappings)?.careerEvidenceIds || []), selected.filter((requirement) => !mappingFor(requirement, mappings) || mappingFor(requirement, mappings)?.classification === "UNKNOWN").map((requirement) => requirement.id), "Responsibility similarity uses only requirement-level mappings; transferable support remains distinct from exact support.");
}
function unknownComponent(name, explanation) { return component(name, null, "UNKNOWN", [], [name], explanation); }
function preferenceComponent(compatibility) {
  const score = { MATCH: 100, PARTIAL_MATCH: 60, OUTSIDE_PREFERENCE: 0, UNKNOWN: null }[compatibility?.state || "UNKNOWN"];
  return component("geographyWorkArrangementFit", score, score === null ? "UNKNOWN" : "CALCULATED", [], score === null ? ["preferenceCompatibility"] : [], compatibility?.reason || "Preference compatibility is unknown.");
}
function scoreComponents(components) {
  const available = components.filter((item) => item.score !== null && MATCH_ENGINE_WEIGHTS[item.name] > 0);
  if (!available.length) return { score: null, status: "UNKNOWN" };
  const denominator = available.reduce((sum, item) => sum + MATCH_ENGINE_WEIGHTS[item.name], 0);
  const score = round(available.reduce((sum, item) => sum + item.score * MATCH_ENGINE_WEIGHTS[item.name], 0) / denominator);
  return { score, status: components.some((item) => ["UNKNOWN", "PARTIAL"].includes(item.status)) ? "PARTIAL" : "CALCULATED" };
}
function confidenceComponent(name, score, missingInputs, explanation) { return { name, score, status: score === null ? "UNKNOWN" : "CALCULATED", missingInputs, explanation }; }
function confidenceFor(input, components, requirements, mappings) {
  const description = text(input.opportunity.descriptionText);
  const extractionValues = requirements.map((requirement) => ({ High: 100, Moderate: 70, Low: 40, "Needs review": 20 }[requirement.extractionConfidence] ?? null)).filter((value) => value !== null);
  const evidenceTotal = mappings.length;
  const evidenceKnown = mappings.filter((mapping) => mapping.classification !== "UNKNOWN").length;
  const location = text(input.opportunity.location);
  const arrangement = text(input.opportunity.workArrangement);
  const freshness = input.opportunity.freshnessState || "UNKNOWN";
  const values = [
    confidenceComponent("jobDescriptionCompleteness", description ? Math.min(100, Math.round(description.length / 40)) : null, description ? [] : ["descriptionText"], description ? "Source description is present." : "Source description is unavailable."),
    confidenceComponent("requirementExtractionConfidence", average(extractionValues), extractionValues.length === requirements.length ? [] : ["requirementExtractionConfidence"], "Uses extractor-provided confidence values."),
    confidenceComponent("evidenceCoverage", evidenceTotal ? round((evidenceKnown / evidenceTotal) * 100) : null, evidenceTotal ? [] : ["evidenceMappings"], "Unknown mappings reduce confidence but are not treated as unsupported evidence."),
    confidenceComponent("locationCertainty", location ? 100 : null, location ? [] : ["location"], location ? "Normalized source location is present." : "Location is unknown."),
    confidenceComponent("workArrangementCertainty", arrangement ? 100 : null, arrangement ? [] : ["workArrangement"], arrangement ? "Normalized work arrangement is present." : "Work arrangement is unknown."),
    confidenceComponent("freshnessCertainty", freshness === "RECENT" || freshness === "CURRENT" ? 100 : freshness === "STALE" ? 0 : null, freshness === "UNKNOWN" ? ["freshnessState"] : [], `Source freshness is ${freshness}.`),
    confidenceComponent("authorityQuality", mappings.some((mapping) => mapping.conflictStatus === "CONFLICT_REQUIRES_REVIEW") ? 40 : mappings.length ? 85 : null, mappings.some((mapping) => mapping.conflictStatus === "CONFLICT_REQUIRES_REVIEW") ? ["conflicting evidence"] : mappings.length ? [] : ["career evidence mappings"], "Uses existing CareerEvidence mapping conflict/provenance state."),
  ];
  const known = values.filter((item) => item.score !== null);
  const score = known.length ? round(known.reduce((sum, item) => sum + item.score, 0) / known.length) : null;
  return { score, status: values.some((item) => item.score === null) ? (known.length ? "PARTIAL" : "NOT_IMPLEMENTED") : "CALCULATED", components: values, missingInputs: values.flatMap((item) => item.missingInputs), explanation: ["Confidence is separate from fit and reflects input reliability, completeness, and unresolved authority state."] };
}

export function buildOpportunityMatchResult(input) {
  const opportunity = input.opportunity || {};
  const requirements = list(input.requirements);
  const mappings = list(input.mappings);
  const qualification = input.qualification || { state: "UNKNOWN", reasons: [], hardMismatchCategories: [] };
  const recommendation = input.recommendation || "UNKNOWN";
  const preferenceCompatibility = input.preferenceCompatibility || { state: "UNKNOWN", reason: "Preference compatibility is unknown." };
  const blockers = [];
  if (qualification.state === "HARD_MISMATCH") blockers.push(...(qualification.reasons || ["J010 qualification is a hard mismatch."]));
  if (["STALE", "DUPLICATE", "NEEDS_OPERATOR_REVIEW"].includes(input.queueItem?.state)) blockers.push(`Source queue state is ${input.queueItem.state}.`);
  const eligibility = qualification.state === "HARD_MISMATCH" ? "INELIGIBLE" : blockers.length ? "REVIEW_REQUIRED" : qualification.state === "INSUFFICIENT_EVIDENCE" || recommendation === "WAIT" ? "REVIEW_REQUIRED" : "ELIGIBLE";
  const components = [
    requirementComponent(requirements, mappings),
    evidenceComponent(qualification, mappings),
    roleComponent(opportunity, qualification, input.queueItem),
    responsibilityComponent(requirements, mappings),
    unknownComponent("seniorityFit", "No approved seniority comparison authority is available in the current input."),
    unknownComponent("domainFit", "No independent domain-fit authority is available; role-family evidence remains separate."),
    preferenceComponent(preferenceCompatibility),
    unknownComponent("compensationFit", "Compensation fit is not calculated without an explicit operator compensation preference."),
  ];
  const fit = scoreComponents(components);
  const confidence = confidenceFor(input, components, requirements, mappings);
  const counts = evidenceCounts(mappings);
  const workflow = input.workflow || {};
  const application = input.application || {};
  return {
    opportunityId: text(opportunity.opportunityId) || text(input.recommendationId),
    opportunityIdentity: {
      canonicalOpportunityId: text(opportunity.canonicalOpportunityId) || null,
      sourceRecordId: text(opportunity.sourceRecordId) || null,
      providerJobId: text(opportunity.providerJobId) || null,
      provenance: text(opportunity.sourceAuthority) || "Existing normalized source record",
    },
    sourceProvider: text(opportunity.providerName) || null,
    sourceJobId: text(opportunity.providerJobId) || null,
    canonicalUrl: text(opportunity.canonicalUrl || opportunity.sourceUrl) || null,
    company: text(opportunity.company),
    title: text(opportunity.title || opportunity.role),
    location: text(opportunity.location) || null,
    workArrangement: text(opportunity.workArrangement || opportunity.remoteState) || null,
    employmentType: text(opportunity.employmentType) || null,
    compensation: text(opportunity.compensationText) || null,
    capturedAt: text(opportunity.capturedAt || opportunity.observedAt) || null,
    freshnessState: opportunity.freshness === "RECENT" ? "RECENT" : opportunity.freshness === "STALE" ? "STALE" : opportunity.freshness === "CURRENT" ? "CURRENT" : "UNKNOWN",
    eligibility: { state: eligibility, blockingReasons: blockers },
    qualification: { state: qualification.state || "UNKNOWN", reasons: [...(qualification.reasons || [])], hardMismatchCategories: [...(qualification.hardMismatchCategories || [])] },
    requirementSummary: requirementSummary(requirements, mappings),
    evidenceSummary: { exactEvidenceCount: counts.exactEvidenceCount, transferableEvidenceCount: counts.transferableEvidenceCount, weakEvidenceCount: counts.weakEvidenceCount, unsupportedCount: counts.unsupportedCount },
    fit: { score: fit.score, scoreStatus: fit.status, components: components.map((item) => ({ name: item.name, value: item.score, status: item.status, evidence: item.evidence })), explanation: components.map((item) => item.explanation) },
    confidence: { score: confidence.score, scoreStatus: confidence.status, missingInputs: confidence.missingInputs, explanation: confidence.explanation, components: confidence.components },
    preferences: { compatibility: preferenceCompatibility.state || "UNKNOWN", reasons: [preferenceCompatibility.reason || "Preference compatibility is unknown."], authorityState: preferenceCompatibility.preferenceAuthority || input.preferenceAuthority || "UNKNOWN" },
    recommendation: { state: recommendation, reasons: [...(input.recommendationReasons || [])] },
    workflow: { rossDecision: workflow.rossDecision || "UNDECIDED", decidedAt: workflow.decidedAt || null },
    application: { state: application.state || "NOT_APPLIED", resumeStatus: application.resumeStatus || "UNKNOWN", submissionStatus: application.submissionStatus || "NOT_SUBMITTED" },
  };
}

export function canonicalizeMatchResults(results) {
  return JSON.stringify(results, Object.keys(results[0] || {}).sort());
}
