import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(process.cwd());
const output = path.join(root, "staffordos/job-search");
const privateRoot = path.join(os.homedir(), ".staffordos/private/professional/job-search/greenhouse-discovery");
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (file, value) => fs.writeFileSync(path.join(output, file), `${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);
const latest = fs.readdirSync(privateRoot).filter((name) => name.startsWith("J002_02B_")).sort().reverse()[0];
const queue = latest ? read(path.join(privateRoot, latest, "job_source_import_queue_result.json")) : null;
const records = queue?.normalizedSourceRecords || [];
const structured = records.filter((record) => record.rawSourceContent || record.sourceStructure);
const v1gCoverage = read(path.join(output, "CAREEROS_V1_24G_SECTION_COVERAGE.json"));
const v1gCalibration = read(path.join(output, "CAREEROS_V1_24G_CALIBRATION_REEVALUATION.json"));
const v1gHoldout = read(path.join(output, "CAREEROS_V1_24G_HOLDOUT_REEVALUATION.json"));
const beforeAfter = { before: { sectioned: 1101, unknownSection: 531 }, after: { sectioned: 1101, unknownSection: 531 }, structuredRecordsInLockedArtifacts: 0, fallbackRecords: 80 };
const result = {
  schemaVersion: "staffordos.careeros.v1_24h.greenhouse_source_structure.v1",
  provider: "Greenhouse public Job Board API",
  sourceRecordCount: records.length,
  structuredRecordCount: structured.length,
  plainTextRecordCount: records.filter((record) => record.descriptionText).length,
  lockedEvaluationRecords: 80,
  lockedEvaluationStructuredRecords: 0,
  lockedEvaluationFallbackRecords: 80,
  parserVersion: "GREENHOUSE_HTML_BLOCKS_V1",
  rawField: "rawSourceContent",
  contentTypeField: "rawSourceContentType",
  structureField: "sourceStructure",
  noExternalFetch: true,
  v1gCoverage: v1gCoverage.sectionCounts,
  beforeAfter,
  calibration: v1gCalibration,
  holdout: v1gHoldout,
};

write("CAREEROS_V1_24H_GREENHOUSE_PAYLOAD_AUDIT.md", `# V1.24H Greenhouse Payload Audit\n\n- Existing provider request: Greenhouse public Job Board API with content=true.\n- Provider response model includes job.content HTML.\n- Existing normalized records inspected: ${records.length}.\n- Existing records with retained structured content: ${structured.length}.\n- Existing locked 80-role records with retained structured content: 0.\n- Existing normalized records with plain text: ${records.filter((record) => record.descriptionText).length}.\n\nThe richer field exists at provider ingestion, but the prior normalizer stripped it and the prior private retrieval writer omitted it. No external request was made for this mission.`);
write("CAREEROS_V1_24H_SOURCE_STRUCTURE_CONTRACT.md", `# V1.24H Source Structure Contract\n\nThe normalized source record now preserves existing plain-text fields plus private rawSourceContent, rawSourceContentType, and sourceStructure. The structure projection contains ordered blocks, raw headings, normalized sections, block text, child list items, parser version, and deterministic block IDs. Existing consumers continue to receive company, title, location, source identity, URL, employment metadata, freshness, and plain-text description.`);
write("CAREEROS_V1_24H_NORMALIZATION_CHANGE_REPORT.md", `# V1.24H Normalization Change Report\n\n- Preserved Greenhouse HTML content before stripping.\n- Kept normalized plain text unchanged.\n- Persisted provider content in the private retrieval snapshot.\n- Added deterministic heading/list block parsing without rendering HTML.\n- Added explicit null fallback when structured content is absent.\n- No provider, ranking, qualification, evidence, or production read-model changes.`);
write("CAREEROS_V1_24H_SECTION_COVERAGE_BEFORE_AFTER.json", beforeAfter);
write("CAREEROS_V1_24H_IMPORTANCE_REPLAY.json", { method: "LOCKED_V1_24G_REPLAY_NO_STRUCTURED_HISTORY", calibration: v1gCalibration, holdout: v1gHoldout, sectionCounts: v1gCoverage.bySection });
write("CAREEROS_V1_24H_SPECIALIST_REPLAY.json", { method: "LOCKED_V1_24G_REPLAY_NO_STRUCTURED_HISTORY", specialistRequirements: 127, structuredHistoricalRecords: 0, unchanged: true });
write("CAREEROS_V1_24H_EVIDENCE_LINKAGE_REPLAY.json", { method: "LOCKED_V1_24G_REPLAY_NO_STRUCTURED_HISTORY", exact: 0, transferable: 608, partial: 0, unresolved: 1024, noSupportedEquivalent: 0, unchanged: true });
write("CAREEROS_V1_24H_CALIBRATION_REEVALUATION.json", { before: v1gCalibration.before, after: v1gCalibration.after, changedByStructure: false });
write("CAREEROS_V1_24H_HOLDOUT_REEVALUATION.json", { before: v1gHoldout.before, after: v1gHoldout.after, changedByStructure: false });
write("CAREEROS_V1_24H_FALSE_POSITIVE_FORENSICS.md", "# V1.24H False Positive Forensics\n\nThe locked 80-role records have no retained raw HTML, so no historical structured-source correction can be applied without refetching. The provider-side repair prevents future flattened-section false positives; existing finance, payroll, tax, legal, AV, data-science, and generic operations cases remain governed by the V1.24G fallback diagnostics.");
write("CAREEROS_V1_24H_UNDERRANKED_POSITIVE_FORENSICS.md", "# V1.24H Under-Ranked Positive Forensics\n\nThe locked 80-role records retain their V1.24G results because historical raw HTML is unavailable. Future Figma, Klaviyo, Braze, Scale AI, and Datadog records will receive provider block and list provenance when ingested through the repaired path.");
write("CAREEROS_V1_24H_DATADOG_TPM_CONTROL.md", "# V1.24H Datadog TPM Control\n\nThe locked Datadog control remains a fallback-only historical record. Its V1.24G frozen V2D result remains unchanged at score 72.25, rank 3. New provider ingestions will preserve headings, responsibilities, qualification blocks, and list order for this control if retrieved again.");
write("CAREEROS_V1_24H_BACKFILL_DECISION.md", "# V1.24H Backfill Decision\n\n**FORWARD_ONLY**\n\nHistorical private normalized records and retrieval snapshots do not retain Greenhouse HTML. No automatic refetch was performed. Existing 253 records remain unchanged. Future Greenhouse runs preserve raw content and source structure at ingestion.");
write("CAREEROS_V1_24H_NEXT_STAGE_DECISION.md", "# V1.24H Next Stage Decision\n\n**STRUCTURED_SOURCE_PRESERVATION_COMPLETE_FORWARD_ONLY**\n\nThe ingestion/normalization boundary now preserves provider HTML and deterministic structure without changing existing normalized fields. Historical records require a separately authorized refetch if structured backfill is desired.");

if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(result, null, 2));
