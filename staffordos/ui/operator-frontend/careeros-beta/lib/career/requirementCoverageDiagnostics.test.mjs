import test from "node:test";
import assert from "node:assert/strict";
import { buildRequirementCoverageDiagnostics } from "./requirementCoverageDiagnostics.mjs";

test("empty description produces zero aggregate coverage diagnostics", () => {
  assert.deepEqual(buildRequirementCoverageDiagnostics({ sourceType: "API_IMPORT", description: "", parsedRequirementCount: 0, evaluationRequirementCount: 0 }), {
    sourceType: "API_IMPORT",
    descriptionPresent: false,
    descriptionCharacterCount: 0,
    parsedRequirementCount: 0,
    evaluationRequirementCount: 0,
  });
});

test("rich description reports content and parsed/evaluated counts without text", () => {
  const diagnostics = buildRequirementCoverageDiagnostics({ sourceType: "API_IMPORT", description: "Requirements: Lead delivery planning.\nQualifications: Program experience.", parsedRequirementCount: 2, evaluationRequirementCount: 2 });
  assert.equal(diagnostics.descriptionPresent, true);
  assert.equal(diagnostics.descriptionCharacterCount, 73);
  assert.equal(diagnostics.parsedRequirementCount, 2);
  assert.equal(diagnostics.evaluationRequirementCount, 2);
  assert.equal(Object.prototype.hasOwnProperty.call(diagnostics, "description"), false);
  assert.doesNotMatch(JSON.stringify(diagnostics), /Lead delivery|Program experience/);
});

test("diagnostics contain only aggregate analysis metadata", () => {
  const diagnostics = buildRequirementCoverageDiagnostics({ sourceType: "USER_SUPPLIED_SOURCE", description: "private customer text", parsedRequirementCount: 1, evaluationRequirementCount: 1 });
  assert.deepEqual(Object.keys(diagnostics).sort(), ["descriptionCharacterCount", "descriptionPresent", "evaluationRequirementCount", "parsedRequirementCount", "sourceType"]);
});
