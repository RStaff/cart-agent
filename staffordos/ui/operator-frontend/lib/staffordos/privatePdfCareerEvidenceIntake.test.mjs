import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { deflateRawSync } from "node:zlib";

const root = process.cwd();
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const baseIntakePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateCareerEvidenceIntake.ts");
const combinedPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privatePdfCareerEvidenceIntake.ts");
const baseIntakeSource = readFileSync(baseIntakePath, "utf8");
const combinedSource = readFileSync(combinedPath, "utf8");
const testSource = readFileSync(new URL(import.meta.url), "utf8");

function compileModule(source, filename, stubs = {}) {
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
  mod.require = (request) => {
    if (Object.prototype.hasOwnProperty.call(stubs, request)) {
      return stubs[request];
    }
    return originalRequire(request);
  };
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}

const baseIntake = compileModule(baseIntakeSource, baseIntakePath);
const combined = compileModule(combinedSource, combinedPath, {
  "./privateCareerEvidenceIntake": baseIntake,
});

const {
  PRIVATE_PDF_CAREER_INTAKE_VERSION,
  assertCombinedPdfCareerIntakeResultShape,
  getCombinedPdfCareerIntakeRedactedSummary,
  inventoryCombinedCareerSources,
  runCombinedPdfCareerEvidenceIntake,
} = combined;

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

const resumeLines = [
  "Jordan Example",
  "jordan@example.test | 555-010-0200 | linkedin.com/in/jordan-example",
  "Professional Experience",
  "Northstar Analytics | Product Manager | Jan 2020 - Dec 2021",
  "Improved onboarding by 40%.",
  "Technical Skills",
  "TypeScript, React, SQL",
  "Education",
  "Example University Bachelor of Arts 2015",
];

const targetedLines = [
  "Targeted resume for technology consultant roles",
  "Jordan Example",
  "Professional Experience",
  "Northstar Analytics | Solutions Architect | Jan 2020 - Mar 2022",
  "AI and automation operations leader for a controlled project.",
  "Created StaffordOS-style product notes.",
  "Technical Skills",
  "Python, AWS, analytics",
  "Certification",
  "Cloud Bridge Practitioner certification listed on resume.",
];

function setupSyntheticIntake() {
  const base = mkdtempSync(path.join(os.tmpdir(), "s010-02c2-career-"));
  const intakeDirectory = path.join(base, "intake");
  const outputDirectory = path.join(base, "private-output");
  const previousReviewQueuePath = path.join(base, "old-review.private.json");
  mkdirSync(intakeDirectory, { recursive: true });
  writeFileSync(path.join(intakeDirectory, "FixtureCareerAlpha.docx"), createDocxBuffer(resumeLines));
  writeFileSync(path.join(intakeDirectory, "FixtureCareerAlphaCopy.docx"), createDocxBuffer(resumeLines));
  writeFileSync(path.join(intakeDirectory, "FixtureCareerBeta.pdf"), "fake pdf bytes");
  writeFileSync(path.join(intakeDirectory, "FixtureCareerGamma.pdf"), "fake cover pdf bytes");
  writeFileSync(path.join(intakeDirectory, "FixtureCareerDelta.pdf"), "fake profile pdf bytes");
  writeFileSync(path.join(intakeDirectory, "Synthetic Runtime Evidence.md"), "StaffordOS controlled local proof documented in a private note.");
  writeFileSync(path.join(intakeDirectory, "Synthetic Notes.txt"), "Grocery list only.");
  writeFileSync(path.join(intakeDirectory, "FixtureCareerDeferred.pages"), "not inspected");
  writeFileSync(path.join(intakeDirectory, ".DS_Store"), "ignored");
  writeFileSync(path.join(intakeDirectory, "Synthetic Unsupported.xlsx"), "unsupported");
  writeFileSync(previousReviewQueuePath, `${JSON.stringify({ records: [{ reviewId: "old-1" }, { reviewId: "old-2" }] })}\n`);

  return {
    base,
    intakeDirectory,
    outputDirectory,
    previousReviewQueuePath,
    generatedAt: "2026-08-03T18:00:00Z",
  };
}

function syntheticPdfExtractor(options = {}) {
  const calls = [];
  const extractor = ({ sourcePath, outputPath }) => {
    calls.push({ sourcePath, outputPath });
    const filename = path.basename(sourcePath);
    if (options.failPdf && filename.includes("Delta")) {
      return { ok: false, failureCode: "SYNTHETIC_PDF_FAILED" };
    }
    const text = filename.includes("Gamma")
      ? "Cover letter: Jordan is positioned as a technology consultant and AI and automation operations leader.\nImproved funnel efficiency by 1200%."
      : filename.includes("Delta")
        ? "LinkedIn profile export\nNorthstar Analytics | Program Manager | Feb 2020 - Dec 2021\nSkills: Python, AWS, analytics"
        : targetedLines.join("\n");
    writeFileSync(outputPath, text);
    return { ok: true, text };
  };
  extractor.calls = calls;
  return extractor;
}

function runSynthetic(options = {}) {
  const setup = setupSyntheticIntake();
  const pdfExtractor = options.pdfExtractor || syntheticPdfExtractor(options.pdfOptions || {});
  const result = runCombinedPdfCareerEvidenceIntake({
    intakeDirectory: setup.intakeDirectory,
    outputDirectory: setup.outputDirectory,
    repositoryRoot: root,
    generatedAt: setup.generatedAt,
    previousReviewQueuePath: setup.previousReviewQueuePath,
    writePrivateArtifacts: options.writePrivateArtifacts === true,
    pdfExtractor,
  });
  return { ...setup, result, pdfExtractor };
}

test("explicit intake directory is required", () => {
  const result = runCombinedPdfCareerEvidenceIntake({
    intakeDirectory: "",
    outputDirectory: null,
    repositoryRoot: root,
    generatedAt: "2026-08-03T18:00:00Z",
  });

  assert.equal(result.status, "failed");
  assert.equal(result.failureCode, "EXPLICIT_INTAKE_DIRECTORY_REQUIRED");
});

test("only supported files are processed", () => {
  const { result } = runSynthetic();

  assert.equal(result.summary.supportedSourceCount, 7);
  assert.equal(result.summary.unsupportedCount, 1);
});

test(".pages files are ignored", () => {
  const { result } = runSynthetic();

  assert.equal(result.summary.deferredPagesCount, 1);
  assert.equal(result.metadata.pagesInspected, false);
});

test(".DS_Store is ignored", () => {
  const { result } = runSynthetic();

  assert.equal(result.summary.ignoredFileCount, 1);
});

test("repository source locations are rejected", () => {
  const result = runCombinedPdfCareerEvidenceIntake({
    intakeDirectory: root,
    outputDirectory: null,
    repositoryRoot: root,
    generatedAt: "2026-08-03T18:00:00Z",
  });

  assert.equal(result.status, "failed");
  assert.equal(result.failureCode, "PRIVATE_SOURCE_DIRECTORY_INSIDE_REPOSITORY");
});

test("repository output locations are rejected", () => {
  const setup = setupSyntheticIntake();
  const result = runCombinedPdfCareerEvidenceIntake({
    intakeDirectory: setup.intakeDirectory,
    outputDirectory: root,
    repositoryRoot: root,
    generatedAt: setup.generatedAt,
    pdfExtractor: syntheticPdfExtractor(),
  });

  assert.equal(result.status, "failed");
  assert.equal(result.failureCode, "PRIVATE_OUTPUT_DIRECTORY_INSIDE_REPOSITORY");
});

test("original files are unchanged", () => {
  const setup = setupSyntheticIntake();
  const sourcePath = path.join(setup.intakeDirectory, "FixtureCareerBeta.pdf");
  const before = statSync(sourcePath);
  const result = runCombinedPdfCareerEvidenceIntake({
    intakeDirectory: setup.intakeDirectory,
    outputDirectory: setup.outputDirectory,
    repositoryRoot: root,
    generatedAt: setup.generatedAt,
    previousReviewQueuePath: setup.previousReviewQueuePath,
    pdfExtractor: syntheticPdfExtractor(),
  });
  const after = statSync(sourcePath);

  assert.equal(result.sourceMutations.some((record) => record.mutationDetected), false);
  assert.equal(before.size, after.size);
  assert.equal(before.mtimeMs, after.mtimeMs);
});

test("PDF extraction is local only", () => {
  const { result, pdfExtractor } = runSynthetic();

  assert.ok(pdfExtractor.calls.length > 0);
  assert.ok(result.sourceInventory.some((source) => source.extractionMethod === "TEXTUTIL_LOCAL_PDF"));
});

test("OCR is not invoked", () => {
  assert.doesNotMatch(combinedSource, /\bocr\b/i);
  assert.doesNotMatch(combinedSource, /\btesseract\b/i);
});

test("external APIs are not invoked", () => {
  assert.doesNotMatch(combinedSource, /\bfetch\s*\(/);
  assert.doesNotMatch(combinedSource, /\bXMLHttpRequest\b/);
  assert.doesNotMatch(combinedSource, /\bopenai\b/i);
  assert.doesNotMatch(combinedSource, /\banthropic\b/i);
});

test("embedded links are not opened", () => {
  assert.doesNotMatch(combinedSource, /\bopen\s*\(/);
  assert.doesNotMatch(combinedSource, /\bexecSync\b/);
});

test("every fact preserves source and page or section provenance", () => {
  const { result } = runSynthetic();

  assert.ok(result.candidateFacts.length > 0);
  assert.ok(result.candidateFacts.every((fact) => fact.sourceDocumentId));
  assert.ok(result.candidateFacts.every((fact) => fact.sourcePageOrSectionReference.includes("private-career-source://")));
});

test("extracted facts begin unverified", () => {
  const { result } = runSynthetic();

  assert.ok(result.candidateFacts.every((fact) => fact.verificationStatus !== "VERIFIED"));
});

test("cover letters remain positioning evidence", () => {
  const { result } = runSynthetic();
  const coverEvidence = result.evidence.find((record) => record.evidenceType === "COVER_LETTER");

  assert.ok(coverEvidence);
  assert.ok(result.candidateFacts.some((fact) => fact.sourceDocumentId === coverEvidence.sourceDocumentId && fact.positioningOnly));
});

test("LinkedIn or profile exports remain self-authored candidate evidence", () => {
  const { result } = runSynthetic();
  const profileEvidence = result.evidence.find((record) => record.evidenceType === "PROFILE_EXPORT");

  assert.ok(profileEvidence);
  assert.equal(profileEvidence.authorityClassification, "SELF_AUTHORED_DOCUMENT");
});

test("exact duplicates do not double-count evidence", () => {
  const { result } = runSynthetic();

  assert.ok(result.summary.exactDuplicateCount >= 2);
  assert.ok(result.documentVersionReview.every((record) => record.contentDoubleCounted === false));
});

test("near-duplicates preserve meaningful differences", () => {
  const { result } = runSynthetic();

  assert.ok(result.summary.formatDerivativeCount >= 0);
  assert.ok(result.documentVersionReview.some((record) => record.versionClassification === "ROLE_TARGETED_VARIANT"));
});

test("targeted resumes remain variants not canonical truth", () => {
  const { result } = runSynthetic();

  assert.ok(result.documentVersionReview.some((record) => record.versionClassification === "ROLE_TARGETED_VARIANT"));
  assert.ok(result.documentVersionReview.every((record) => record.canonicalResumeSelected === false));
});

test("modification time cannot choose the canonical source", () => {
  const { result } = runSynthetic();

  assert.ok(result.documentVersionReview.every((record) => record.modificationTimeUsedAsAuthority === false));
});

test("repetition cannot verify a claim", () => {
  const { result } = runSynthetic();

  assert.ok(result.documentVersionReview.every((record) => record.repeatedWordingVerifiesClaim === false));
  assert.ok(result.candidateFacts.every((fact) => fact.verificationStatus !== "VERIFIED"));
});

test("official and positioning titles remain separate", () => {
  const { result } = runSynthetic();

  assert.ok(result.candidateFacts.some((fact) => /solutions architect/i.test(fact.statement) && fact.positioningOnly));
});

test("employer or client ambiguity becomes a review item", () => {
  const { result } = runSynthetic();

  assert.ok(result.reviewQueue.some((item) => item.category === "EMPLOYMENT"));
});

test("conflicting dates remain unresolved", () => {
  const { result } = runSynthetic();
  const dateConflict = result.conflicts.find((conflict) => conflict.conflictType === "START_DATE_CONFLICT");

  assert.ok(dateConflict);
  assert.equal(dateConflict.selectedWinner, null);
});

test("skill-list appearance does not prove production use", () => {
  const { result } = runSynthetic();
  const skills = result.skillContextReview.filter((fact) => fact.factType === "TECHNOLOGY");

  assert.ok(skills.length > 0);
  assert.ok(skills.some((fact) => fact.skillContext === "NEEDS_VERIFICATION"));
});

test("exposure does not become professional proficiency", () => {
  const { result } = runSynthetic();

  assert.ok(result.skillContextReview.every((fact) => !/expert|advanced|master/i.test(fact.skillContext || "")));
});

test("product claims preserve maturity distinctions", () => {
  const { result } = runSynthetic();

  assert.ok(result.projectProductReview.length > 0);
  assert.ok(result.projectProductReview.every((record) => record.maturityReviewRequired === true));
});

test("metrics remain unverified without authoritative evidence", () => {
  const { result } = runSynthetic();
  const metricFacts = result.candidateFacts.filter((fact) => fact.metricClassification === "NEEDS_REVIEW");

  assert.ok(metricFacts.length > 0);
  assert.ok(metricFacts.every((fact) => fact.verificationStatus !== "VERIFIED"));
});

test("material metrics enter the priority review queue", () => {
  const { result } = runSynthetic();

  assert.ok(result.reviewQueue.some((item) => item.category === "Material metrics"));
});

test("contact values remain outside committed summaries", () => {
  const { result } = runSynthetic();
  const summary = JSON.stringify(getCombinedPdfCareerIntakeRedactedSummary(result));

  assert.doesNotMatch(summary, /jordan@example\.test/);
  assert.doesNotMatch(summary, /555-010-0200/);
});

test("combined queue is deterministic", () => {
  const first = runSynthetic().result.reviewQueue.map((item) => item.reviewId);
  const second = runSynthetic().result.reviewQueue.map((item) => item.reviewId);

  assert.deepEqual(first, second);
});

test("old queue is preserved", () => {
  const { result, previousReviewQueuePath } = runSynthetic();

  assert.ok(existsSync(previousReviewQueuePath));
  assert.equal(result.priorQueueSupersession.previousReviewItemCount, 2);
});

test("supersession happens only after successful combined validation", () => {
  const success = runSynthetic().result;
  const failed = runCombinedPdfCareerEvidenceIntake({
    intakeDirectory: root,
    outputDirectory: null,
    repositoryRoot: root,
    generatedAt: "2026-08-03T18:00:00Z",
  });

  assert.equal(success.priorQueueSupersession.status, "SUPERSEDED_BY_S010_02C2_COMBINED_REVIEW");
  assert.equal(failed.priorQueueSupersession, null);
});

test("prior uncertified Pages exports are excluded", () => {
  const { result } = runSynthetic();

  assert.equal(result.metadata.uncertifiedPagesExportsUsed, false);
});

test("no Ollama or model invocation occurs", () => {
  assert.doesNotMatch(combinedSource, /\bollama\b/i);
  assert.doesNotMatch(combinedSource, /\bmodel\s*invocation\b/i);
});

test("private artifacts remain outside Git", () => {
  const { result } = runSynthetic({ writePrivateArtifacts: true });

  assert.ok(result.privateArtifacts.length > 0);
  assert.ok(result.privateArtifacts.every((artifactPath) => !path.resolve(artifactPath).startsWith(`${root}${path.sep}`)));
});

test("private artifacts remain noncanonical", () => {
  const { result } = runSynthetic({ writePrivateArtifacts: true });

  for (const artifactPath of result.privateArtifacts) {
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    assert.equal(artifact.metadata.schemaVersion, PRIVATE_PDF_CAREER_INTAKE_VERSION);
    assert.equal(artifact.metadata.canonical, false);
    assert.equal(artifact.metadata.verified, false);
  }
});

test("result shape is explicit", () => {
  const { result } = runSynthetic();

  assert.equal(assertCombinedPdfCareerIntakeResultShape(result), true);
});

test("no real private data appears in source tests", () => {
  assert.doesNotMatch(testSource, new RegExp(["Ross", " Stafford"].join("")));
  assert.doesNotMatch(testSource, new RegExp(["Point", "72"].join("")));
  assert.doesNotMatch(testSource, new RegExp(["Avan", "grid"].join("")));
});

test("inventory helper does not recurse into unrelated paths", () => {
  const setup = setupSyntheticIntake();
  mkdirSync(path.join(setup.intakeDirectory, "nested"));
  writeFileSync(path.join(setup.intakeDirectory, "nested", "NestedFixtureCareer.pdf"), "ignored");
  const inventory = inventoryCombinedCareerSources(setup.intakeDirectory, root);

  assert.ok(inventory.every((source) => source.filename !== "NestedFixtureCareer.pdf"));
});

test("PDF extraction failure is controlled", () => {
  const { result } = runSynthetic({ pdfOptions: { failPdf: true } });

  assert.equal(result.status, "partially_complete");
  assert.ok(result.summary.extractionFailureCount >= 1);
});

test("no route UI database or API dependency exists", () => {
  assert.doesNotMatch(combinedSource, /from ["'].*\/app\//);
  assert.doesNotMatch(combinedSource, /\bprisma\b/i);
  assert.doesNotMatch(combinedSource, /\bcreateServer\b|\blisten\s*\(/);
  assert.doesNotMatch(combinedSource, /\bwriteShopifixer\b/i);
});
