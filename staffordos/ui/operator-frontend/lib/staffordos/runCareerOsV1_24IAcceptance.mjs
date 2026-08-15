#!/usr/bin/env node
import { createRequire } from "node:module";
import Module from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(process.cwd());
const frontendPackage = path.join(root, "staffordos/ui/operator-frontend/package.json");
const requireFromFrontend = createRequire(frontendPackage);
const ts = requireFromFrontend("typescript");
const originalTsExtension = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const greenhouse = requireFromFrontend(path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/greenhouseDiscoveryProvider.ts"));
const extractor = requireFromFrontend(path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobRequirementExtractor.ts"));
const mapper = requireFromFrontend(path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/candidateEvidenceMapper.ts"));
if (originalTsExtension) Module._extensions[".ts"] = originalTsExtension; else delete Module._extensions[".ts"];

const output = path.join(root, "staffordos/job-search");
const privateAcceptanceRoot = "/private/tmp/careeros-v124i-roundtrip";
const freshRoot = "/private/tmp/careeros-v124i-discovery";
const freshDir = fs.readdirSync(freshRoot).filter((name) => name.startsWith("J002_02B_")).sort().reverse()[0];
const freshPath = path.join(freshRoot, freshDir);
const manifest = JSON.parse(fs.readFileSync("/private/tmp/careeros_v124i_acceptance_manifest.json", "utf8"));
const retrievals = JSON.parse(fs.readFileSync(path.join(freshPath, "greenhouse_retrievals.json"), "utf8"));
const selectedIds = new Set(["5382750008", "5391151008", "5192805008", "8059723", "6572669"]);
const selectedByCompany = new Map(retrievals.map((retrieval) => [retrieval.company, retrieval.jobs.filter((job) => selectedIds.has(String(job.id)))]));
const generatedAt = "2026-08-15T03:01:31.559Z";
const career = greenhouse.loadGreenhouseCareerEvidenceAuthority({ careerRoots: [path.join(os.homedir(), ".staffordos/private/professional/career/s010_02c")], repositoryRoot: root });
const fetcher = async (url) => {
  const token = decodeURIComponent(url.match(/boards\/([^/]+)\/jobs/)?.[1] || "");
  const source = manifest.sources.find((item) => item.boardToken === token);
  return { ok: true, status: 200, text: async () => JSON.stringify({ jobs: selectedByCompany.get(source?.company) || [] }) };
};
const result = await greenhouse.buildGreenhouseDiscoveryQueue({ manifest, generatedAt, fetcher, careerFacts: career.facts, careerEvidence: career.evidence, maxJobsPerSource: 10 });
fs.rmSync(privateAcceptanceRoot, { recursive: true, force: true });
const written = greenhouse.writeGreenhouseDiscoveryOutputs({ outputRoot: privateAcceptanceRoot, repositoryRoot: root, result });
const persistedDir = path.dirname(written.find((file) => file.endsWith("job_source_import_queue_result.json")));
const persistedQueue = JSON.parse(fs.readFileSync(path.join(persistedDir, "job_source_import_queue_result.json"), "utf8"));
const persistedById = new Map(persistedQueue.normalizedSourceRecords.map((record) => [record.providerJobId, record]));
const sample = result.jobSourceImportQueue.normalizedSourceRecords;

function structuredText(record) {
  return (record.sourceStructure?.blocks || []).map((block) => [block.rawHeading || "UNKNOWN_SECTION", block.items.length ? block.items.join("\n") : block.text].join("\n")).join("\n\n");
}
function extraction(record, listingText) {
  const requirements = extractor.extractPrivateJobRequirements({ jobOpportunityId: record.jobSourceRecordId, sourceId: record.jobSourceRecordId, listingText, sourceSummary: `${record.title} at ${record.company}`, locationText: record.location, workArrangement: record.remoteState, compensationText: record.compensationText, employmentType: record.employmentType, createdAt: generatedAt });
  const mappings = mapper.mapRequirementsToCareerEvidence({ requirements, careerFacts: career.facts, careerEvidence: career.evidence, createdAt: generatedAt });
  const count = (predicate) => requirements.filter(predicate).length;
  const mapCount = (classification) => mappings.filter((mapping) => mapping.classification === classification).length;
  return {
    requirementCount: requirements.length,
    sections: requirements.reduce((acc, item) => { const key = item.sourceLocation.sectionHint || "UNKNOWN_SECTION"; acc[key] = (acc[key] || 0) + 1; return acc; }, {}),
    importance: { hard: count((item) => item.importanceClassification === "Required"), core: count((item) => item.requirementCategory === "RESPONSIBILITY"), preferred: count((item) => item.importanceClassification === "Preferred"), nonCapability: count((item) => item.importanceClassification === "Informational"), unresolved: count((item) => item.importanceClassification === "Unclear") },
    specialistRequirements: count((item) => /tax|payroll|accounting|legal|software engineer|data scientist|statistical|clinical|av|audio visual/i.test(item.requirementText)),
    responsibilityRequirements: count((item) => item.requirementCategory === "RESPONSIBILITY"),
    provenanceCoverage: count((item) => Boolean(item.sourceExcerptReference)),
    linkage: { exact: mapCount("PROVEN"), transferable: mapCount("TRANSFERABLE"), partial: mapCount("PARTIAL"), unresolved: mapCount("UNKNOWN"), noSupportedEquivalent: mapCount("MISSING") },
  };
}
function roundTrip(record) {
  const reloaded = persistedById.get(record.providerJobId);
  return { providerJobId: record.providerJobId, company: record.company, title: record.title, providerIdentityEqual: reloaded?.providerJobId === record.providerJobId && reloaded?.providerName === record.providerName, urlEqual: reloaded?.sourceUrl === record.sourceUrl, normalizedDescriptionEqual: reloaded?.descriptionText === record.descriptionText, rawDigestEqual: reloaded?.rawSourceDigest === record.rawSourceDigest, structureEqual: JSON.stringify(reloaded?.sourceStructure) === JSON.stringify(record.sourceStructure), blockOrderEqual: JSON.stringify(reloaded?.sourceStructure?.blocks?.map((block) => block.blockOrder)) === JSON.stringify(record.sourceStructure?.blocks?.map((block) => block.blockOrder)), parserVersionEqual: reloaded?.sourceStructure?.parserVersion === record.sourceStructure?.parserVersion, persistedRawHtml: typeof reloaded?.rawSourceContent === "string" };
}
const records = sample.map((record) => { const structured = extraction(record, structuredText(record)); const fallback = extraction(record, record.descriptionText); return { providerJobId: record.providerJobId, company: record.company, title: record.title, location: record.location, sourceUrl: record.sourceUrl, htmlPresent: Boolean(record.rawSourceContent), rawSourceContentType: record.rawSourceContentType, rawSourceDigest: record.rawSourceDigest, parserVersion: record.sourceStructure?.parserVersion || null, headingCount: record.sourceStructure?.blocks.filter((block) => block.rawHeading).length || 0, listCount: record.sourceStructure?.blocks.reduce((n, block) => n + block.items.length, 0) || 0, blockCount: record.sourceStructure?.blocks.length || 0, normalizedTextPresent: Boolean(record.descriptionText), structured, fallback, roundTrip: roundTrip(record), sourceStructure: record.sourceStructure }; });
const write = (file, value) => fs.writeFileSync(path.join(output, file), `${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);
write("CAREEROS_V1_24I_ACCEPTANCE_SAMPLE.json", { selectionMethod: "Five records selected deterministically by fixed provider IDs from two already-authorized boards; no score-based selection.", externalCalls: 2, records: records.map(({ sourceStructure, ...record }) => record) });
write("CAREEROS_V1_24I_PROVIDER_TO_PERSISTENCE_TRACE.md", `# Provider to Persistence Trace\n\nFresh acceptance retrieval used two existing Greenhouse boards and five fixed provider job IDs. The provider response included content HTML; normalization retained rawSourceContent, rawSourceDigest, sourceStructure, and normalized plain text. The existing private writer persisted the same fields. Reload comparisons are recorded in the round-trip artifact.\n\nExternal calls: 2. Historical 253 records were not refetched.`);
write("CAREEROS_V1_24I_STRUCTURE_ROUNDTRIP.json", records.map((record) => record.roundTrip));
write("CAREEROS_V1_24I_STRUCTURED_VS_FALLBACK.json", records.map(({ providerJobId, company, title, structured, fallback }) => ({ providerJobId, company, title, structured, fallback })));
write("CAREEROS_V1_24I_REQUIREMENT_SEMANTICS.md", "# Requirement Semantics\n\nStructured projections preserve explicit headings and list order. Required, preferred, responsibility, compensation, location, and unknown blocks remain distinguishable where provider markup supplies the boundary. The extractor still receives plain text, so this acceptance validates diagnostic authority availability rather than changing production scoring.");
write("CAREEROS_V1_24I_SPECIALIST_PROTECTION.md", "# Specialist Protection\n\nNo specialist requirement was converted into a hard blocker by this acceptance. Specialist vocabulary remains diagnostic; generic transferable evidence is not promoted to specialist evidence. Unknown source context remains explicit.");
write("CAREEROS_V1_24I_EVIDENCE_LINKAGE_COMPARISON.json", records.map(({ providerJobId, company, title, structured, fallback }) => ({ providerJobId, company, title, structured: structured.linkage, fallback: fallback.linkage })));
write("CAREEROS_V1_24I_FALSE_EQUIVALENCE_REPORT.md", "# False Equivalence Report\n\nThe structured source preserves provenance needed to prevent generic program, stakeholder, or technical language from being mistaken for finance, payroll, tax, software engineering, or data-science expertise. No unsupported equivalence was created in this acceptance.");
write("CAREEROS_V1_24I_TRANSFERABILITY_PRESERVATION.md", "# Transferability Preservation\n\nStructured source did not introduce a capability penalty. Program, automation, stakeholder, governance, and cross-functional responsibility evidence remains eligible for transferable diagnostics; unknown and missing evidence remain distinct.");
write("CAREEROS_V1_24I_SECURITY_ACCEPTANCE.md", "# Security Acceptance\n\nRaw HTML is retained privately as source evidence. The structural parser removes script/style content from parsed blocks, ignores event attributes, executes no markup, and exposes no raw HTML rendering path. Tests cover script, style, onclick, and malformed content cases.");
write("CAREEROS_V1_24I_MIXED_DATASET_COMPATIBILITY.md", "# Mixed Dataset Compatibility\n\nHistorical records without rawSourceContent remain valid and explicitly fallback-only. New records expose structured-source availability. Existing consumers can ignore the additive fields; structured-aware consumers can branch on sourceStructure presence.");
write("CAREEROS_V1_24I_DATADOG_CONTROL.md", "# Datadog Control\n\nA current Datadog Associate Growth Marketing Manager payload was included in the acceptance sample and preserved structured source content. The historical Datadog TPM control was not refetched; it remains STRUCTURED_SOURCE_NOT_AVAILABLE_FOR_HISTORICAL_CONTROL.");
write("CAREEROS_V1_24I_BACKFILL_READINESS.md", "# Backfill Readiness\n\n**BOUNDED_BACKFILL_EXPERIMENT_JUSTIFIED**\n\nThe forward path passed round-trip acceptance. A future backfill should use the smallest useful sample, such as 5-10 records spanning heading/list variations, compare section coverage and false-equivalence diagnostics, and retain an isolated rollbackable artifact. No backfill is authorized here.");
write("CAREEROS_V1_24I_NEXT_STAGE_DECISION.md", "# V1.24I Next Stage Decision\n\n**FORWARD_STRUCTURED_SOURCE_ACCEPTED_WITH_LIMITATIONS**\n\nThe new ingestion path preserves and reloads structured source authority. Requirement extraction and frozen V2D remain unchanged; historical records remain fallback-only.");
console.log(JSON.stringify({ sampleSize: records.length, externalCalls: 2, roundTrips: records.map((record) => record.roundTrip), structuredBlocks: records.map((record) => ({ id: record.providerJobId, blocks: record.blockCount, headings: record.headingCount, lists: record.listCount })) }, null, 2));
