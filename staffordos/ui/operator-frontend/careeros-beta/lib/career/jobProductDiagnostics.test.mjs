import test from "node:test";
import assert from "node:assert/strict";
import { parseJobDescription } from "./jobProduct.mjs";

function parse(description) {
  return parseJobDescription({ title: "Synthetic Program Manager", description, sourceType: "API_IMPORT" });
}

function assertPrivateDiagnostics(diagnostics, sourceText) {
  const serialized = JSON.stringify(diagnostics);
  assert.doesNotMatch(serialized, new RegExp(sourceText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(Object.prototype.hasOwnProperty.call(diagnostics, "description"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(diagnostics, "text"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(diagnostics, "heading"), false);
  assert.deepEqual(Object.keys(diagnostics).sort(), [
    "boundedLineCount", "bulletLikeLineCount", "continuationLineCount", "finalParsedRequirementCount",
    "hasPendingSegment", "inputCharacterCount", "inputLineCount", "nonEmptyLineCount",
    "proseLikeLineCount", "rawRequirementSegmentCount", "recognizedContextHeadingCount",
    "recognizedRequirementHeadingCount", "rejectionCounts", "requirementSegmentsAfterDeduplicationCount",
    "requirementSegmentsAfterJoinCount", "requirementSegmentsAfterLengthFilteringCount",
    "sawRecognizedSection", "terminalSection", "unrecognizedHeadingLikeLineCount"
  ].sort());
}

test("recognized requirement headings expose deterministic aggregate parser stages", () => {
  const description = "Requirements:\nLead delivery planning.\nQualifications:\nProgram management experience.";
  const result = parse(description);
  assert.equal(result.requirements.length, 2);
  assert.equal(result.diagnostics.recognizedRequirementHeadingCount, 2);
  assert.equal(result.diagnostics.rawRequirementSegmentCount, 2);
  assert.equal(result.diagnostics.requirementSegmentsAfterLengthFilteringCount, 2);
  assert.equal(result.diagnostics.finalParsedRequirementCount, 2);
  assertPrivateDiagnostics(result.diagnostics, description);
});

test("context followed by recognized Duties reports the transition without changing output", () => {
  const description = "Job Summary:\nContext only.\nDuties:\nLead cross-functional delivery.\nManage implementation planning.";
  const result = parse(description);
  assert.deepEqual(result.requirements.map((item) => item.text), ["Lead cross-functional delivery.", "Manage implementation planning."]);
  assert.equal(result.diagnostics.recognizedContextHeadingCount, 1);
  assert.equal(result.diagnostics.recognizedRequirementHeadingCount, 1);
  assert.equal(result.diagnostics.rejectionCounts.contextSuppressed, 1);
});

test("context followed by an unrecognized heading-like line reports structural loss", () => {
  const description = "Job Summary:\nContext only.\nDuties and Experience:\nLead cross-functional delivery.";
  const result = parse(description);
  assert.equal(result.requirements.length, 0);
  assert.equal(result.diagnostics.unrecognizedHeadingLikeLineCount, 1);
  assert.equal(result.diagnostics.rejectionCounts.contextSuppressed, 2);
  assert.equal(result.diagnostics.terminalSection, "CONTEXT");
  assertPrivateDiagnostics(result.diagnostics, description);
});

test("bullet requirements and prose requirements are counted separately", () => {
  const description = "Responsibilities:\n- Coordinate stakeholders.\n- Report program outcomes.\nLead delivery planning.";
  const result = parse(description);
  assert.equal(result.requirements.length, 2);
  assert.equal(result.diagnostics.bulletLikeLineCount, 2);
  assert.equal(result.diagnostics.proseLikeLineCount, 1);
  assert.equal(result.diagnostics.continuationLineCount, 1);
});

test("context-only and boilerplate content records suppression without promotion", () => {
  const description = "Job Summary:\nThis is general organizational context.\nOverview:\nThis explains the agency.";
  const result = parse(description);
  assert.equal(result.requirements.length, 0);
  assert.equal(result.diagnostics.recognizedContextHeadingCount, 2);
  assert.equal(result.diagnostics.rejectionCounts.contextSuppressed, 2);
  assert.equal(result.diagnostics.finalParsedRequirementCount, 0);
});

test("empty descriptions remain fail-closed", () => {
  assert.throws(() => parse(""), { code: "JOB_DESCRIPTION_REQUIRED" });
});
