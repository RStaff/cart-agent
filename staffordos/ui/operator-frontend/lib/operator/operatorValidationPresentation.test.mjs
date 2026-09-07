import assert from "node:assert/strict";
import test from "node:test";
import {
  validationAttentionCount,
  validationEntries,
  validationExplanation,
  validationSummary,
} from "./operatorValidationPresentation.mjs";

test("empty validation input is unavailable", () => {
  assert.deepEqual(validationEntries(""), []);
  assert.equal(validationAttentionCount(""), 0);
  assert.equal(validationSummary(""), "System checks unavailable");
  assert.equal(validationExplanation(""), "System checks are unavailable.");
});

test("PASS-only validation input is available without attention", () => {
  assert.equal(validationAttentionCount("PASS"), 0);
  assert.equal(validationSummary("PASS"), "System checks available");
  assert.equal(validationExplanation("PASS"), "Current system checks are available.");
});

test("failure statuses require attention case-insensitively", () => {
  for (const value of ["BLOCKED", "PARTIAL", "FAILED", "FAIL", "ERROR", "MISSING", "UNAVAILABLE", "blocked", "Blocked", "partial"]) {
    assert.equal(validationAttentionCount(value), 1, `${value} should require attention`);
  }
  assert.equal(validationSummary("BLOCKED"), "1 system check needs attention");
});

test("mixed validation entries require attention and pluralize correctly", () => {
  assert.equal(validationAttentionCount("PASS / BLOCKED"), 1);
  assert.equal(validationAttentionCount("PASS / PARTIAL"), 1);
  assert.equal(validationSummary("PASS / BLOCKED"), "1 system check needs attention");
  assert.equal(validationSummary("BLOCKED / PARTIAL"), "2 system checks need attention");
  assert.equal(validationExplanation("PASS / BLOCKED"), "One or more system checks require attention.");
});

test("status matching uses word boundaries", () => {
  assert.equal(validationAttentionCount("unblocked"), 0);
  assert.equal(validationSummary("unblocked"), "System checks available");
});

test("validation entries preserve raw evidence", () => {
  const raw = "preflight: BLOCKED / qa: PARTIAL / path: staffordos/validation/record.json";
  assert.deepEqual(validationEntries(raw).join(" / "), raw);
  assert.equal(validationSummary(raw), "2 system checks need attention");
});
