import assert from "node:assert/strict";
import test from "node:test";
import { buildCapabilityInventory, buildOfflineCapabilityGraphDesign, mappingCoverage } from "./careerOsV1_27OfflineCapabilityGraph.mjs";

const fact = (overrides = {}) => ({ statement: "Led cross-functional technical program delivery", normalizedStatement: "led cross functional technical program delivery", factType: "EMPLOYMENT", supportLevel: "DIRECT", verificationStatus: "VERIFIED", experienceClassification: "USED_IN_PRODUCTION", sourceEvidenceIds: ["private"], conflictingEvidenceIds: [], ...overrides });
const manifest = { questions: [{ targets: [{ requirementId: "r1", opportunityId: "o1", capabilityFamily: "PROGRAM_DELIVERY", specialist: false, scopeClassification: "LED_PROGRAM" }] }] };

test("capability IDs and clustering are deterministic and source-derived", () => {
  const first = buildCapabilityInventory([fact(), fact({ statement: "Led cross-functional technical program delivery" })]);
  const second = buildCapabilityInventory([fact(), fact({ statement: "Led cross-functional technical program delivery" })]);
  assert.deepEqual(first, second);
  assert.equal(first.canonicalCapabilities[0].derivedOnly, true);
});

test("scope, domain, and specialist boundaries are preserved", () => {
  const inventory = buildCapabilityInventory([
    fact({ statement: "Managed people in financial services operations", normalizedStatement: "managed people in financial services operations", classification: "finance" }),
    fact({ statement: "Contributed to software engineering discussions", normalizedStatement: "contributed to software engineering discussions", classification: "software engineering", supportLevel: "TRANSFERABLE", verificationStatus: "VERIFIED" }),
  ]);
  assert.ok(inventory.canonicalCapabilities.some((item) => item.scopeLevel === "LED_TEAM"));
  assert.ok(inventory.canonicalCapabilities.some((item) => item.specialistClassification === "SPECIALIST"));
  assert.ok(inventory.canonicalCapabilities.some((item) => item.domainContext === "FINANCIAL_SERVICES"));
});

test("conflicts do not become authority and generic capability cannot satisfy specialist requirements", () => {
  const inventory = buildCapabilityInventory([fact({ supportLevel: "DIRECT", verificationStatus: "CONFLICTING", conflictingEvidenceIds: ["conflict"] })]);
  assert.equal(inventory.canonicalCapabilities[0].authorityState.includes("CONFLICT_BLOCKED"), true);
  const coverage = mappingCoverage(inventory.canonicalCapabilities, [{ capabilityFamily: "PROGRAM_DELIVERY", specialistClassification: "SPECIALIST", scopeClassification: "LED_PROGRAM", targetCount: 3 }]);
  assert.equal(coverage.specialistLeakage, 0);
});

test("design is derived and does not use labels or create upstream authority", () => {
  const result = buildOfflineCapabilityGraphDesign({ facts: [fact()], evidence: [{ id: "private" }], manifest });
  assert.equal(result.prototypeOnly, true);
  assert.equal(result.labelsUsed, false);
  assert.ok(result.activeLearningQuestions.every((question) => question.labelsExcluded));
});
