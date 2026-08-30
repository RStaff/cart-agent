import test from "node:test";
import assert from "node:assert/strict";
import { classifyRoleCompatibility, normalizeRoleIntent } from "./roleIntent.mjs";
import { evaluateRoleIntentTopTen } from "./discoveryQualityHarness.mjs";

test("AI Product Manager keeps title, family, specialization, and unspecified seniority explicit", () => {
  const intent = normalizeRoleIntent({ requestedTitle: "Senior AI Product Manager" });
  assert.equal(intent.requestedTitle, "Senior AI Product Manager");
  assert.equal(intent.normalizedTitle, "senior ai product manager");
  assert.equal(intent.roleFamily, "PRODUCT_TECHNICAL_PRODUCT");
  assert.ok(intent.specialization.includes("AI"));
  assert.equal(intent.seniority, "SENIOR");
});

test("near product titles are compatible while engineering and science roles are incompatible", () => {
  const intent = normalizeRoleIntent({ requestedTitle: "AI Product Manager" });
  assert.equal(classifyRoleCompatibility(intent, "Senior Product Manager, AI").classification, "EXACT_OR_NEAR_TITLE");
  assert.equal(classifyRoleCompatibility(intent, "Product Manager, Generative AI").classification, "EXACT_OR_NEAR_TITLE");
  assert.equal(classifyRoleCompatibility(intent, "AI Engineer").classification, "INCOMPATIBLE");
  assert.equal(classifyRoleCompatibility(intent, "Data Scientist").classification, "INCOMPATIBLE");
  assert.equal(classifyRoleCompatibility(intent, "Product Operations Lead").classification, "COMPATIBLE_ADJACENT");
});

test("role families do not make engineering and marketing roles equivalent", () => {
  assert.equal(classifyRoleCompatibility(normalizeRoleIntent({ requestedTitle: "Program Manager" }), "Software Engineer").classification, "INCOMPATIBLE");
  assert.equal(classifyRoleCompatibility(normalizeRoleIntent({ requestedTitle: "Marketing Technology Manager" }), "Software Engineer").classification, "INCOMPATIBLE");
  assert.equal(classifyRoleCompatibility(normalizeRoleIntent({ requestedTitle: "AI Automation Engineer" }), "AI Product Manager").classification, "INCOMPATIBLE");
});

test("top-ten harness counts role compatibility classes and mismatches", () => {
  const result = evaluateRoleIntentTopTen({
    roleIntent: { requestedTitle: "AI Product Manager" },
    rankedResults: [
      { roleCompatibility: { classification: "EXACT_OR_NEAR_TITLE", seniorityMatch: true, specializationMatch: true }, quality: { gates: { locationFit: true } } },
      { roleCompatibility: { classification: "COMPATIBLE_ADJACENT", seniorityMatch: false, specializationMatch: true }, quality: { gates: { locationFit: true } } },
      { roleCompatibility: { classification: "ROLE_FAMILY_ONLY", seniorityMatch: true, specializationMatch: false }, quality: { gates: { locationFit: false } } },
      { roleCompatibility: { classification: "INCOMPATIBLE", seniorityMatch: true, specializationMatch: true }, quality: { gates: { locationFit: true } } },
    ],
  });
  assert.equal(result.topTenRelevantCount, 2);
  assert.equal(result.incompatibleCount, 1);
  assert.equal(result.roleFamilyOnlyCount, 1);
  assert.equal(result.wrongSeniorityCount, 1);
  assert.equal(result.wrongSpecializationCount, 1);
  assert.equal(result.wrongLocationCount, 1);
});
