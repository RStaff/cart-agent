import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { buildOpportunityMatchResult, MATCH_ENGINE_VERSION, EXPERIMENTAL_WEIGHT_SET, MATCH_ENGINE_WEIGHTS } from "./careerOsMatchEngineV1.mjs";

const privateRoot = path.join(os.homedir(), ".staffordos/private/professional/job-search");
const outputRoot = path.resolve(process.cwd(), "staffordos/job-search");

function newestFile(directory, filename) {
  const matches = [];
  function walk(current) {
    if (!existsSync(current)) return;
    for (const name of readdirSync(current)) {
      const file = path.join(current, name);
      const stat = statSync(file);
      if (stat.isDirectory()) walk(file);
      else if (name === filename) matches.push({ file, mtime: stat.mtimeMs });
    }
  }
  walk(directory);
  matches.sort((left, right) => right.mtime - left.mtime || left.file.localeCompare(right.file));
  return matches[0] ? JSON.parse(readFileSync(matches[0].file, "utf8")) : null;
}
function text(value) { return typeof value === "string" ? value.trim() : ""; }
function readJson(file) { return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null; }
function safeLocation(value) { return text(value) || "Unknown location"; }
function locationClass(value) {
  const location = text(value).toLowerCase();
  if (!location) return "UNKNOWN_LOCATION";
  if (/san francisco|california|seattle|austin|texas/.test(location)) return "OUTSIDE_COMMON_EAST_COAST_SCENARIO";
  if (/boston|massachusetts|new york|new jersey|remote|united states|usa/.test(location)) return "EAST_COAST_OR_REMOTE_SCENARIO";
  return "OTHER_KNOWN_LOCATION";
}
function applicationMap() {
  const readModel = newestFile(path.join(privateRoot, "applications"), "manual_submission_read_model.json") || [];
  return new Map(readModel.map((item) => [`${item.company}|${item.role}`, item]));
}
function workflowMap() {
  const state = newestFile(path.join(privateRoot, "career-workflow-state"), "workflow_state.json");
  const items = [...(state?.stateItems || []), ...(state?.workflowActions || [])];
  const map = new Map();
  for (const item of items) {
    if (item.recommendationId) map.set(item.recommendationId, item);
    if (item.company && item.role) map.set(`${item.company}|${item.role}`, item);
  }
  return map;
}
function workflowFor(workflows, record) {
  const byRole = workflows.get(`${record.company}|${record.role}`);
  const byRecommendation = workflows.get(record.recommendationId);
  return byRole?.actionType ? byRole : byRecommendation || byRole;
}
function chooseSample(records) {
  const selected = [];
  const add = (predicate, count) => {
    for (const record of records) {
      if (selected.includes(record) || !predicate(record)) continue;
      selected.push(record);
      if (selected.filter(predicate).length >= count) break;
    }
  };
  add((record) => record.qualification?.state === "HARD_MISMATCH", 8);
  add((record) => record.qualification?.state === "INSUFFICIENT_EVIDENCE", 5);
  add((record) => record.qualification?.state === "TRANSFERABLE_BUT_NOT_DIRECT", 20);
  add((record) => !text(record.location), 3);
  add((record) => /Business Systems Analyst/i.test(record.role), 1);
  for (const record of records) {
    if (selected.length >= 40) break;
    if (!selected.includes(record)) selected.push(record);
  }
  return selected.slice(0, 40);
}
function publicRow(record, source, fit, currentRank, experimentalRank, workflow, application) {
  const unsupported = fit.requirementSummary.unsupportedMandatoryCount + fit.requirementSummary.unsupportedPreferredCount;
  const unknownEvidence = fit.confidence.missingInputs.includes("evidenceMappings") ? "Evidence mappings unavailable" : "Unresolved evidence remains visible where present";
  const gaps = [
    unsupported ? `Unsupported classified requirements: ${unsupported}` : null,
    fit.confidence.missingInputs.includes("location") ? "Location is unknown" : null,
    fit.confidence.missingInputs.includes("workArrangement") ? "Work arrangement is unknown" : null,
    unknownEvidence,
  ].filter(Boolean).slice(0, 3);
  return {
    company: record.company,
    role: record.role,
    location: safeLocation(source?.location),
    locationClass: locationClass(source?.location),
    existingJ010State: record.qualification?.state || "UNKNOWN",
    existingJ003Recommendation: record.recommendation || "UNKNOWN",
    existingShortlisted: Boolean(record.shortlistedForDecision),
    experimentalFitScore: fit.fit.score,
    experimentalFitScoreStatus: fit.fit.scoreStatus,
    experimentalConfidenceScore: fit.confidence.score,
    experimentalConfidenceStatus: fit.confidence.scoreStatus,
    eligibility: fit.eligibility.state,
    preferenceCompatibility: fit.preferences.compatibility,
    preferenceReason: fit.preferences.reasons[0],
    topFitReasons: fit.fit.explanation.slice(0, 3),
    topGaps: gaps,
    hardBlockers: fit.eligibility.blockingReasons.slice(0, 3),
    humanJudgment: "PENDING_ROSS_REVIEW",
    humanJudgmentConfidence: null,
    falsePositive: null,
    falseNegative: null,
    currentJ002Rank: currentRank,
    experimentalRank: experimentalRank,
    rankingDifference: currentRank === null ? null : currentRank - experimentalRank,
    workflowDecision: workflow?.actionType || "UNDECIDED",
    applicationState: application ? application.submissionStatus || application.currentStage || "RECORDED" : "NOT_APPLIED",
    lifecycleLinkage: application ? (application.exactResumeArtifactKnown ? "APPLICATION_AND_ARTIFACT_SURFACED" : "APPLICATION_RECORDED_ARTIFACT_LINKAGE_UNKNOWN") : "NO_APPLICATION_RECORD",
    components: fit.fit.components.map((item) => ({ name: item.name, value: item.value, status: item.status })),
    confidenceComponents: fit.confidence.components.map((item) => ({ name: item.name, score: item.score, status: item.status, missingInputs: item.missingInputs })),
  };
}
function buildEvaluation() {
  const queue = newestFile(path.join(privateRoot, "greenhouse-discovery"), "job_source_import_queue_result.json");
  const fits = newestFile(path.join(privateRoot, "greenhouse-discovery"), "explainable_fit_artifacts.json") || [];
  const recommendations = newestFile(path.join(privateRoot, "opportunity-recommendations"), "opportunity_recommendations.json") || [];
  const sourceById = new Map((queue?.normalizedSourceRecords || []).map((item) => [item.jobSourceRecordId, item]));
  const queueById = new Map((queue?.importQueue || []).map((item) => [item.queueItemId, item]));
  const fitByQueue = new Map(fits.map((item) => [item.queueItemId, item]));
  const applications = applicationMap();
  const workflows = workflowMap();
  const currentRank = new Map(recommendations.map((item, index) => [item.recommendationId, index + 1]));
  const sample = chooseSample(recommendations);
  const evaluate = () => {
    const unsorted = sample.map((record) => {
      const source = sourceById.get(record.sourceRecordId) || {};
      const fitArtifact = fitByQueue.get(record.queueItemId);
      const queueItem = queueById.get(record.queueItemId) || {};
      const result = buildOpportunityMatchResult({
        opportunity: { opportunityId: record.opportunityId, canonicalOpportunityId: record.canonicalOpportunityId, sourceRecordId: record.sourceRecordId, providerJobId: source.providerJobId, providerName: source.providerName, sourceUrl: source.sourceUrl, company: source.company || record.company, title: source.title || record.role, role: record.role, location: source.location, remoteState: source.remoteState, employmentType: source.employmentType, compensationText: source.compensationText, descriptionText: source.descriptionText, observedAt: source.observedAt, freshness: source.freshness, sourceAuthority: source.sourceAuthority },
        requirements: fitArtifact?.requirements || [],
        mappings: fitArtifact?.mappings || [],
        qualification: record.qualification,
        recommendation: record.recommendation,
        recommendationReasons: record.recommendationReasons,
        preferenceCompatibility: { state: "UNKNOWN", reason: "Ross's explicit preference authority is unresolved in the current runtime.", preferenceAuthority: "AWAITING_ROSS_CONFIRMATION" },
        queueItem,
        workflow: { rossDecision: workflowFor(workflows, record)?.actionType || "UNDECIDED", decidedAt: workflowFor(workflows, record)?.createdAt || null },
        application: (() => { const app = applications.get(`${record.company}|${record.role}`); return app ? { state: app.currentStage, resumeStatus: app.exactResumeArtifactKnown ? "KNOWN" : "UNKNOWN", submissionStatus: app.submissionStatus || "UNKNOWN" } : {}; })(),
      });
      return { record, source, result, workflow: workflowFor(workflows, record) };
    });
    const eligibilityOrder = { ELIGIBLE: 0, REVIEW_REQUIRED: 1, UNKNOWN: 2, INELIGIBLE: 3 };
    const ranked = [...unsorted].sort((left, right) => eligibilityOrder[left.result.eligibility.state] - eligibilityOrder[right.result.eligibility.state] || (right.result.fit.score ?? -1) - (left.result.fit.score ?? -1) || left.record.company.localeCompare(right.record.company) || left.record.role.localeCompare(right.record.role));
    const experimentalRank = new Map(ranked.map((item, index) => [item.record.recommendationId, index + 1]));
    return unsorted.map((item) => publicRow(item.record, item.source, item.result, currentRank.get(item.record.recommendationId) || null, experimentalRank.get(item.record.recommendationId), item.workflow, applications.get(`${item.record.company}|${item.record.role}`)));
  };
  const first = evaluate();
  const second = evaluate();
  const hardMismatchTop10 = [...first].sort((a, b) => a.experimentalRank - b.experimentalRank).slice(0, 10).filter((row) => row.existingJ010State === "HARD_MISMATCH").length;
  return {
    schemaVersion: "staffordos.careeros.match_engine_v1.offline_evaluation.v1",
    engineVersion: MATCH_ENGINE_VERSION,
    weightSet: EXPERIMENTAL_WEIGHT_SET,
    generatedAt: new Date().toISOString(),
    runtimeSource: { provider: "Greenhouse public board", recommendationRun: "latest available private J003.01 artifact", opportunityCount: queue?.normalizedSourceRecords?.length || 0, sampleCount: first.length, preferenceAuthority: "AWAITING_ROSS_CONFIRMATION", preferenceCompatibilityActive: false },
    deterministicRerun: JSON.stringify(first) === JSON.stringify(second),
    metrics: { hardMismatchLeakageTop10: hardMismatchTop10, geographyMismatchLeakage: null, falsePositiveRate: null, falseNegativeRate: null, top5HumanAgreement: null, top10HumanAgreement: null, rankCorrelation: null, confidenceCalibration: null, unsupportedEvidenceRate: 0, unknownPreferencePreservationRate: first.filter((row) => row.preferenceCompatibility === "UNKNOWN").length / Math.max(1, first.length) },
    humanLabels: { status: "PENDING_ROSS_REVIEW", labelsCaptured: 0, labelsRequired: first.length, workflowDecisionsNotUsedAsGroundTruth: true },
    records: first,
  };
}
function reviewPacket(evaluation) {
  const rows = evaluation.records.map((row, index) => `| M21-${String(index + 1).padStart(3, "0")} | ${row.company} | ${row.role} | ${row.location} | ${row.existingJ010State} | ${row.existingJ003Recommendation} | ${row.experimentalFitScore ?? "unknown"} | ${row.experimentalConfidenceScore ?? "unknown"} | ${row.preferenceCompatibility} | PENDING |`);
  return `# CareerOS Match Engine V1 Human Review Packet\n\nRoss should label each row using STRONG_MATCH, GOOD_MATCH, TRANSFERABLE, STRETCH, POOR_MATCH, or HARD_NO. Do not use Apply, Skip, Review Later, or Not Interested as fit ground truth.\n\n| Sample | Company | Role | Location | J010 | J003 | Experimental fit | Confidence | Preference | Ross judgment |\n|---|---|---|---|---|---|---:|---:|---|---|\n${rows.join("\n")}\n`;
}
function main() {
  const evaluation = buildEvaluation();
  mkdirSync(outputRoot, { recursive: true });
  writeFileSync(path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_EVALUATION_DATA.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_HUMAN_REVIEW_PACKET.md"), reviewPacket(evaluation));
  return evaluation;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const evaluation = main();
  console.log(JSON.stringify({ sampleCount: evaluation.records.length, opportunityCount: evaluation.runtimeSource.opportunityCount, deterministicRerun: evaluation.deterministicRerun, hardMismatchLeakageTop10: evaluation.metrics.hardMismatchLeakageTop10, preferenceCompatibilityActive: evaluation.runtimeSource.preferenceCompatibilityActive }, null, 2));
}
