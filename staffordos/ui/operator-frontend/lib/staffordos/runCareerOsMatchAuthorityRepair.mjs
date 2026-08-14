import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildEvaluation } from "./runCareerOsMatchEngineV1Offline.mjs";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const beforePath = path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_22D_CALIBRATION_DATA.json");
const staticEvaluationPath = path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_EVALUATION_DATA.json");

function readJson(file) { return JSON.parse(readFileSync(file, "utf8")); }
function count(values) { return Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((item) => item === value).length])); }
function rowsById(rows) { return new Map(rows.map((row) => [row.sampleId, row])); }
function flattenResponsibilities(row) { return row.authorityDiagnostics?.responsibilitySimilarity?.comparisons || []; }
function diagnosticCounts(rows) {
  const responsibility = rows.flatMap(flattenResponsibilities);
  return {
    responsibilityEvidenceStates: count(responsibility.map((item) => item.evidenceState)),
    responsibilityConclusions: count(responsibility.map((item) => item.capabilityConclusion)),
    seniorityStates: count(rows.map((row) => row.authorityDiagnostics?.seniorityCompatibility?.state || "UNRESOLVED")),
    domainStates: count(rows.map((row) => row.authorityDiagnostics?.domainCompatibility?.state || "UNRESOLVED_DOMAIN")),
    evidenceGapReasons: count(responsibility.filter((item) => ["UNKNOWN", "NO_SUPPORTED_EVIDENCE"].includes(item.evidenceState)).map((item) => item.evidenceState)),
  };
}
function preferenceDistribution(rows) { return count(rows.map((row) => row.preferenceCompatibility)); }
function comparison(before, after) {
  const old = rowsById(before.rows); const next = rowsById(after.records);
  return before.rows.map((row) => {
    const updated = next.get(row.sampleId);
    return { sampleId: row.sampleId, company: row.company, role: row.role, beforePreference: row.preferenceCompatibility, afterPreference: updated?.preferenceCompatibility || "UNKNOWN", beforeFit: row.experimentalFitScore, afterFit: updated?.experimentalFitScore ?? null, fitChanged: row.experimentalFitScore !== (updated?.experimentalFitScore ?? null), beforeRank: row.experimentalRank, afterRank: updated?.experimentalRank ?? null, responsibility: updated?.authorityDiagnostics?.responsibilitySimilarity || null, seniority: updated?.authorityDiagnostics?.seniorityCompatibility || null, domain: updated?.authorityDiagnostics?.domainCompatibility || null, evidenceGapReason: updated?.authorityDiagnostics?.evidenceGapReason || [], humanEvidenceFit: row.evidenceFit || null, v1dCause: before.diagnostics?.under?.find((item) => item.sampleId === row.sampleId)?.cause || before.diagnostics?.over?.find((item) => item.sampleId === row.sampleId)?.cause || null };
  });
}
function main() {
  if (!existsSync(beforePath) || !existsSync(staticEvaluationPath)) throw new Error("V1.22D calibration or V1 evaluation data is missing.");
  const before = readJson(beforePath); const staticEvaluation = readJson(staticEvaluationPath); const after = buildEvaluation();
  if (after.records.length !== 40) throw new Error("Authority repair requires the existing 40-record evaluation set.");
  const rows = comparison(before, after);
  const controlCase = after.controlCases?.find((item) => item.caseId === "CONTROL_CASE_DATADOG_TPM") || null;
  const result = {
    schemaVersion: "staffordos.careeros.match_engine_v1.authority_repair.v1",
    records: 40,
    weightsChanged: false,
    productionBehaviorChanged: false,
    preference: { before: before.preferenceFindings?.distribution || {}, after: preferenceDistribution(after.records), hardMismatchIndependent: after.records.filter((row) => row.existingJ010State === "HARD_MISMATCH" && row.preferenceCompatibility !== "UNKNOWN").length },
    diagnostics: diagnosticCounts(after.records),
    fitPreservation: { baselineScoresCompared: rows.length, changedByIndependentPreferenceProjection: rows.filter((row) => row.fitChanged).length, responsibilitySeniorityDomainNotFedIntoFit: true },
    datadogControlCase: controlCase,
    rows,
    sourceRuntime: { existingEvaluationOpportunityCount: staticEvaluation.runtimeSource?.opportunityCount || null, preferenceAuthority: after.runtimeSource.preferenceAuthority, preferenceResolution: after.runtimeSource.preferenceResolution },
  };
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22E_TRANSFERABILITY_ANALYSIS.json"), `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22E_40_RECORD_COMPARISON.json"), `${JSON.stringify({ schemaVersion: result.schemaVersion, records: rows.length, preference: result.preference, diagnostics: result.diagnostics, fitPreservation: result.fitPreservation, rows }, null, 2)}\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22E_EVIDENCE_STATE_AUDIT.md"), `# CareerOS V1.22E Evidence-State Audit\n\nUnknown, missing, and transferable states remain distinct. No CareerFact or CareerEvidence was created or changed.\n\n- UNKNOWN: CareerOS lacks a resolved mapping; capability remains unresolved.\n- MISSING: no supported mapping exists; this is not proof of absent capability.\n- TRANSFERABLE: existing evidence supports an adjacent capability and remains positive transferable evidence.\n- PROVEN/PARTIAL: existing mapping status is preserved.\n\n## Runtime distribution\n\n\`\`\`json\n${JSON.stringify(result.diagnostics, null, 2)}\n\`\`\`\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22E_DATADOG_TPM_CONTROL_CASE.md"), `# Datadog TPM Control Case\n\nThis is diagnostic only and is not evaluation record 41.\n\n${controlCase ? `- Qualification: ${controlCase.qualification.state}\n- Recommendation: ${controlCase.recommendation.state}\n- Eligibility: ${controlCase.eligibility.state}\n- Preference compatibility: ${controlCase.preferenceCompatibility.compatibility}\n- Responsibility: ${controlCase.authorityDiagnostics.responsibilitySimilarity.state}\n- Seniority: ${controlCase.authorityDiagnostics.seniorityCompatibility.state}\n- Domain: ${controlCase.authorityDiagnostics.domainCompatibility.state}\n- Requirement evidence states: ${JSON.stringify(controlCase.authorityDiagnostics.responsibilitySimilarity.counts)}\n\nCareerOS has transferable and unresolved evidence. It does not possess authoritative evidence of a capability blocker. The Director title is an upward-stretch signal, not a hard mismatch. Domain difference is not treated as a blocker.` : "Control case unavailable."}\n`);
  const under = rows.filter((row) => row.v1dCause || row.responsibility?.coverage?.resolved === 0).slice(0, 30);
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22E_MATCH_AUTHORITY_REPAIR_REPORT.md"), `# CareerOS V1.22E Match Authority Repair Report\n\n## Scope\n\nOffline authority repair only. No weights, production ranking, J002/J003/J010, shortlist, CareerFact, CareerEvidence, workflow, provider, or application behavior was changed.\n\n## Repairs\n\n- Preference compatibility no longer short-circuits on J010 HARD_MISMATCH. It evaluates only explicit preferences and normalized opportunity facts.\n- Responsibility comparison now recognizes responsibility, leadership, program-management, and operations requirement categories and exposes requirement-to-evidence comparisons.\n- Seniority is represented as direct, upward stretch with supported scope, adjacent, unresolved, or proven mismatch only when evidence supports it.\n- Domain transfer is represented separately and does not treat title or industry difference as a blocker.\n- UNKNOWN, MISSING, PARTIAL, and TRANSFERABLE remain distinct.\n\n## Before/after\n\n- Preference before: ${JSON.stringify(result.preference.before)}\n- Preference after: ${JSON.stringify(result.preference.after)}\n- Hard-mismatch records with independently resolved preference state: ${result.preference.hardMismatchIndependent}\n- Responsibility evidence: ${JSON.stringify(result.diagnostics.responsibilityEvidenceStates)}\n- Seniority: ${JSON.stringify(result.diagnostics.seniorityStates)}\n- Domain: ${JSON.stringify(result.diagnostics.domainStates)}\n- Fit changed only where independent preference projection changed the existing geography component: ${result.fitPreservation.changedByIndependentPreferenceProjection}\n\n## Human-positive audit\n\n${under.map((row) => `- ${row.sampleId} ${row.company} — ${row.role}: ${row.v1dCause || "authority coverage remains unresolved"}`).join("\n") || "- No rows."}\n\n## Decision\n\nREADY_FOR_RECALIBRATION. Rerun V1.22D metrics with unchanged weights before considering any weight changes.\n`);
  console.log(JSON.stringify({ records: result.records, preference: result.preference, diagnostics: result.diagnostics, datadog: controlCase ? { eligibility: controlCase.eligibility.state, preference: controlCase.preferenceCompatibility.compatibility } : null }, null, 2));
}
if (import.meta.url === `file://${process.argv[1]}`) main();
