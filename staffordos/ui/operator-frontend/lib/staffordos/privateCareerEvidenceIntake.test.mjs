import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { deflateRawSync } from "node:zlib";

const root = process.cwd();
const contractPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateCareerEvidenceIntake.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const contractSource = readFileSync(contractPath, "utf8");
const testSource = readFileSync(new URL(import.meta.url), "utf8");

function compileModule(source, filename) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}

const intake = compileModule(contractSource, contractPath);

const {
  PRIVATE_CAREER_INTAKE_VERSION,
  assertPrivateIntakeResultShape,
  digestPrivateCareerFile,
  extractDocxTextSections,
  getPrivateCareerIntakeRedactedSummary,
  identifyPrivateCareerConflicts,
  runPrivateCareerEvidenceIntake,
} = intake;

function le16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function le32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
}

function xmlEscape(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildMinimalZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const content = Buffer.from(entry.content, "utf8");
    const compressed = deflateRawSync(content);
    const localHeader = Buffer.concat([
      le32(0x04034b50),
      le16(20),
      le16(0),
      le16(8),
      le16(0),
      le16(0),
      le32(0),
      le32(compressed.length),
      le32(content.length),
      le16(name.length),
      le16(0),
      name,
    ]);
    localParts.push(localHeader, compressed);
    centralParts.push(
      Buffer.concat([
        le32(0x02014b50),
        le16(20),
        le16(20),
        le16(0),
        le16(8),
        le16(0),
        le16(0),
        le32(0),
        le32(compressed.length),
        le32(content.length),
        le16(name.length),
        le16(0),
        le16(0),
        le16(0),
        le16(0),
        le32(0),
        le32(offset),
        name,
      ]),
    );
    offset += localHeader.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.concat([
    le32(0x06054b50),
    le16(0),
    le16(0),
    le16(entries.length),
    le16(entries.length),
    le32(centralDirectory.length),
    le32(offset),
    le16(0),
  ]);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function createDocxBuffer(lines) {
  const paragraphs = lines
    .map((line) => `<w:p><w:r><w:t>${xmlEscape(line)}</w:t></w:r></w:p>`)
    .join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}</w:body></w:document>`;

  return buildMinimalZip([
    {
      name: "[Content_Types].xml",
      content: '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
    },
    {
      name: "word/document.xml",
      content: documentXml,
    },
  ]);
}

function setupSyntheticIntake() {
  const base = mkdtempSync(path.join(os.tmpdir(), "s010-02c-career-"));
  const intakeDir = path.join(base, "intake");
  const outputDir = path.join(base, "private-output");
  const generatedAt = "2026-08-03T12:00:00Z";
  const linesA = [
    "Jordan Example",
    "jordan@example.test | 555-010-0200 | linkedin.com/in/jordan-example",
    "Professional Experience",
    "Northstar Analytics | Product Manager | Jan 2020 - Dec 2021",
    "Built StaffordOS-style governance workflow for a controlled project.",
    "Improved onboarding by 40%.",
    "Technical Skills",
    "TypeScript, React, SQL",
    "Education",
    "Example University Bachelor of Arts 2015",
  ];
  const linesB = [
    "Jordan Example",
    "Professional Experience",
    "Northstar Analytics | Program Manager | Jan 2020 - Mar 2022",
    "Led a private operations project.",
    "Skills",
    "Python, AWS, analytics",
    "Certification",
    "Cloud Bridge Practitioner certification listed on resume.",
  ];
  const linesC = [
    "Jordan Example",
    "Professional Experience",
    "Southstar Analytics | Product Manager | Feb 2020 - Dec 2021",
    "Created CI/CD and DevOps reporting workflow.",
  ];
  const { mkdirSync } = requireFromFrontend("node:fs");
  mkdirSync(intakeDir, { recursive: true });
  writeFileSync(path.join(intakeDir, "Synthetic Product Resume.docx"), createDocxBuffer(linesA));
  writeFileSync(path.join(intakeDir, "Synthetic Program Resume.docx"), createDocxBuffer(linesB));
  writeFileSync(path.join(intakeDir, "Synthetic Program Resume Copy.docx"), createDocxBuffer(linesB));
  writeFileSync(path.join(intakeDir, "Synthetic Alternate Resume.docx"), createDocxBuffer(linesC));
  writeFileSync(path.join(intakeDir, "Synthetic Deferred.pages"), "not inspected");
  writeFileSync(path.join(intakeDir, ".DS_Store"), "ignored");
  writeFileSync(path.join(intakeDir, "Synthetic Unsupported.xlsx"), "unsupported");

  return { base, intakeDir, outputDir, generatedAt };
}

function runSynthetic(options = {}) {
  const setup = setupSyntheticIntake();
  const result = runPrivateCareerEvidenceIntake({
    intakeDirectory: setup.intakeDir,
    outputDirectory: setup.outputDir,
    repositoryRoot: root,
    generatedAt: setup.generatedAt,
    writePrivateArtifacts: options.writePrivateArtifacts === true,
  });
  return { ...setup, result };
}

test("explicit intake directory is required", () => {
  const result = runPrivateCareerEvidenceIntake({
    intakeDirectory: "",
    outputDirectory: null,
    repositoryRoot: root,
    generatedAt: "2026-08-03T12:00:00Z",
  });

  assert.equal(result.status, "failed");
  assert.equal(result.failureCode, "EXPLICIT_INTAKE_DIRECTORY_REQUIRED");
});

test("repository paths are rejected as private intake destinations", () => {
  const result = runPrivateCareerEvidenceIntake({
    intakeDirectory: root,
    outputDirectory: null,
    repositoryRoot: root,
    generatedAt: "2026-08-03T12:00:00Z",
  });

  assert.equal(result.status, "failed");
  assert.equal(result.failureCode, "PRIVATE_DIRECTORY_INSIDE_REPOSITORY");
});

test("unsupported file types are rejected safely and Pages files are deferred", () => {
  const { result } = runSynthetic();

  assert.equal(result.summary.unsupportedFileCount, 1);
  assert.equal(result.summary.deferredPagesCount, 1);
  assert.equal(result.deferredSources[0].extractionSupportStatus, "DEFERRED_UNSUPPORTED_SOURCE_FILE");
  assert.equal(result.deferredSources[0].contentInspected, false);
  assert.equal(result.deferredSources[0].contentDigest, null);
});

test("source files are never modified", () => {
  const setup = setupSyntheticIntake();
  const before = statSync(path.join(setup.intakeDir, "Synthetic Product Resume.docx"));

  const result = runPrivateCareerEvidenceIntake({
    intakeDirectory: setup.intakeDir,
    outputDirectory: setup.outputDir,
    repositoryRoot: root,
    generatedAt: setup.generatedAt,
  });
  const after = statSync(path.join(setup.intakeDir, "Synthetic Product Resume.docx"));

  assert.equal(result.sourceFilesModified, false);
  assert.equal(before.size, after.size);
  assert.equal(before.mtimeMs, after.mtimeMs);
});

test("content digests are deterministic", () => {
  const { intakeDir } = setupSyntheticIntake();
  const filePath = path.join(intakeDir, "Synthetic Product Resume.docx");

  assert.equal(digestPrivateCareerFile(filePath), digestPrivateCareerFile(filePath));
});

test("DOCX extraction preserves paragraph-level provenance", () => {
  const { intakeDir } = setupSyntheticIntake();
  const filePath = path.join(intakeDir, "Synthetic Product Resume.docx");
  const sections = extractDocxTextSections(filePath);

  assert.ok(sections.length >= 4);
  assert.equal(sections[0].sectionId, "paragraph-0001");
  assert.ok(sections.some((section) => section.sectionHeading === "Professional Experience"));
});

test("every extracted fact has a source reference", () => {
  const { result } = runSynthetic();

  assert.ok(result.candidateFacts.length > 0);
  assert.ok(result.candidateFacts.every((fact) => fact.sourceDocumentId));
  assert.ok(result.candidateFacts.every((fact) => fact.sourceEvidenceId));
  assert.ok(result.candidateFacts.every((fact) => fact.sourceSectionReference.includes("private-career-source://")));
});

test("extracted facts begin unverified", () => {
  const { result } = runSynthetic();

  assert.ok(result.candidateFacts.every((fact) => fact.verificationStatus !== "VERIFIED"));
});

test("conflicting titles are preserved", () => {
  const { result } = runSynthetic();
  const titleConflict = result.conflicts.find((conflict) => conflict.conflictType === "TITLE_CONFLICT" || conflict.conflictType === "START_DATE_CONFLICT");

  assert.ok(titleConflict);
  assert.equal(titleConflict.selectedWinner, null);
  assert.ok(titleConflict.differingValueCount > 1);
});

test("conflicting dates are preserved", () => {
  const { result } = runSynthetic();
  const dateConflict = result.conflicts.find((conflict) => conflict.conflictType === "START_DATE_CONFLICT");

  assert.ok(dateConflict);
  assert.equal(dateConflict.selectedWinner, null);
});

test("conflicting employers are preserved as unresolved differing values", () => {
  const { result } = runSynthetic();
  const employmentConflict = result.conflicts.find((conflict) => conflict.category === "EMPLOYMENT");

  assert.ok(employmentConflict);
  assert.ok(employmentConflict.differingValueCount >= 2);
  assert.equal(employmentConflict.selectedWinner, null);
});

test("contact information is excluded from redacted summaries", () => {
  const { result } = runSynthetic();
  const summaryText = JSON.stringify(getPrivateCareerIntakeRedactedSummary(result));

  assert.doesNotMatch(summaryText, /jordan@example\.test/);
  assert.doesNotMatch(summaryText, /555-010-0200/);
  assert.ok(result.contactBoundary.some((record) => record.contactType === "email"));
});

test("unsupported metrics remain unsupported", () => {
  const { result } = runSynthetic();
  const metricFact = result.candidateFacts.find((fact) => fact.metricReviewClassification === "NEEDS_REVIEW");

  assert.ok(metricFact);
  assert.equal(metricFact.metricClassification, "UNSUPPORTED");
  assert.notEqual(metricFact.verificationStatus, "VERIFIED");
});

test("skill-list appearance does not prove production use", () => {
  const { result } = runSynthetic();
  const technologyFacts = result.candidateFacts.filter((fact) => fact.factType === "TECHNOLOGY");

  assert.ok(technologyFacts.length > 0);
  assert.ok(technologyFacts.every((fact) => fact.experienceClassification === "NEEDS_VERIFICATION"));
});

test("generated resume wording does not verify a fact", () => {
  const { result } = runSynthetic();

  assert.ok(result.evidence.every((record) => record.authorityClassification === "GENERATED_DOCUMENT"));
  assert.ok(result.candidateFacts.every((fact) => fact.authorityClassification !== "GENERATED_DOCUMENT" || fact.verificationStatus !== "VERIFIED"));
});

test("repository evidence remains cross-workspace candidate evidence", () => {
  const { result } = runSynthetic();

  assert.ok(result.businessEvidenceReferences.length > 0);
  assert.ok(result.businessEvidenceReferences.every((record) => record.status === "CROSS_WORKSPACE_CANDIDATE_REQUIRES_APPROVAL"));
  assert.ok(result.businessEvidenceReferences.every((record) => record.modelUseAuthorized === false));
});

test("duplicate documents are detected without silent merging", () => {
  const { result } = runSynthetic();
  const duplicateSources = result.sourceInventory.filter((source) => source.duplicateDocumentStatus === "EXACT_DUPLICATE");

  assert.ok(duplicateSources.length >= 2);
  assert.equal(result.summary.supportedDocxCount, 4);
  assert.equal(result.summary.extractedDocumentCount, 4);
});

test("review queue is deterministic", () => {
  const first = runSynthetic().result.reviewQueue.map((item) => item.reviewId);
  const second = runSynthetic().result.reviewQueue.map((item) => item.reviewId);

  assert.deepEqual(first, second);
});

test("private outputs are marked noncanonical", () => {
  const { result } = runSynthetic({ writePrivateArtifacts: true });

  assert.equal(result.metadata.canonical, false);
  assert.ok(result.privateArtifacts.length > 0);
  for (const artifactPath of result.privateArtifacts) {
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    assert.equal(artifact.metadata.schemaVersion, PRIVATE_CAREER_INTAKE_VERSION);
    assert.equal(artifact.metadata.canonical, false);
  }
});

test("private outputs are outside Git", () => {
  const { result } = runSynthetic({ writePrivateArtifacts: true });

  assert.ok(result.privateArtifacts.length > 0);
  assert.ok(result.privateArtifacts.every((artifactPath) => !path.resolve(artifactPath).startsWith(`${root}${path.sep}`)));
  assert.ok(result.privateArtifacts.every((artifactPath) => existsSync(artifactPath)));
});

test("no private fixture data appears in source tests", () => {
  assert.doesNotMatch(testSource, new RegExp(["Ross", " Stafford"].join("")));
  assert.doesNotMatch(testSource, new RegExp(["Ross", "_Stafford", "_Resume"].join("")));
  assert.doesNotMatch(testSource, new RegExp(["Point", "72"].join("")));
});

test("conflict detection does not mutate source records", () => {
  const { result } = runSynthetic();
  const facts = JSON.parse(JSON.stringify(result.candidateFacts));
  const before = JSON.stringify(facts);

  identifyPrivateCareerConflicts(facts);

  assert.equal(JSON.stringify(facts), before);
});

test("private intake result shape is explicit", () => {
  const { result } = runSynthetic();

  assert.equal(assertPrivateIntakeResultShape(result), true);
});

test("no network model database route or persistence dependency is present", () => {
  assert.doesNotMatch(contractSource, /\bfetch\s*\(/);
  assert.doesNotMatch(contractSource, /\bXMLHttpRequest\b/);
  assert.doesNotMatch(contractSource, /\bollama\b/i);
  assert.doesNotMatch(contractSource, /\bopenai\b/i);
  assert.doesNotMatch(contractSource, /\banthropic\b/i);
  assert.doesNotMatch(contractSource, /\bprisma\b/i);
  assert.doesNotMatch(contractSource, /from ["'].*\/app\//);
  assert.doesNotMatch(contractSource, /\bcreateServer\b|\blisten\s*\(/);
});
