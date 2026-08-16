import assert from "node:assert/strict";
import test from "node:test";
import { compatibility, projectScopeCompatibleRelationships } from "./careerOsV1_27A3ScopeCompatibility.mjs";

test("scope lattice supports lower/equal delivery scope without inflating people leadership", () => {
  assert.equal(compatibility("OWNERSHIP", "CONTRIBUTED").state, "SUPPORTED_LOWER_OR_EQUAL_SCOPE");
  assert.equal(compatibility("OWNERSHIP", "OWNERSHIP").state, "EXACT_SCOPE");
  assert.equal(compatibility("OWNERSHIP", "TEAM_LEADERSHIP").state, "INCOMPATIBLE_SCOPE");
  assert.equal(compatibility("OWNERSHIP", "PORTFOLIO_ENTERPRISE").state, "TRANSFERABLE_SCOPE");
});

test("contributor, program, portfolio, and enterprise firewalls remain distinct", () => {
  assert.equal(compatibility("CONTRIBUTED", "OWNERSHIP").state, "INCOMPATIBLE_SCOPE");
  assert.equal(compatibility("CONTRIBUTED", "COORDINATED").state, "TRANSFERABLE_SCOPE");
  assert.equal(compatibility("PORTFOLIO_ENTERPRISE", "TEAM_LEADERSHIP").state, "INCOMPATIBLE_SCOPE");
  assert.equal(compatibility("ENTERPRISE_GLOBAL", "PORTFOLIO_ENTERPRISE").state, "SUPPORTED_LOWER_OR_EQUAL_SCOPE");
});

test("authority state is preserved while adjacent scope becomes transferable", () => {
  const result = projectScopeCompatibleRelationships({
    capabilities: [{ capabilityId: "cap", canonicalName: "TECHNICAL_PROGRAM_LEADERSHIP", specialistClassification: "GENERAL", authorityState: "VERIFIED_DIRECT", scope: "UNRESOLVED_SCOPE" }],
    concepts: [
      { conceptId: "lower", capabilityFamily: "PROGRAM_DELIVERY", scope: "INDIVIDUAL_OR_CONTRIBUTOR", specialistClassification: "GENERAL", targetCount: 1 },
      { conceptId: "higher", capabilityFamily: "PROGRAM_DELIVERY", scope: "PORTFOLIO_ENTERPRISE", specialistClassification: "GENERAL", targetCount: 1 },
    ],
    adjudications: [{ questionId: "q", capabilityIds: ["cap"], authorityState: "VERIFIED_DIRECT", answer: "DIRECT_OWNER", superseded: false }],
    questions: [{ questionId: "q", scopeBeingResolved: "TECHNICAL_PROGRAM_OWNERSHIP" }],
  });
  assert.equal(result.counts.DIRECT, 1);
  assert.equal(result.counts.TRANSFERABLE, 1);
  assert.equal(result.counts.SCOPE_BLOCKED, 0);
  assert.equal(result.scopeViolations, 0);
});

test("specialist compatibility stays fail-closed and unresolved stays neutral", () => {
  const result = projectScopeCompatibleRelationships({
    capabilities: [{ capabilityId: "generic", canonicalName: "TECHNICAL_PROGRAM_LEADERSHIP", specialistClassification: "GENERAL", authorityState: "KEEP_UNRESOLVED", scope: "LED_PROGRAM" }],
    concepts: [
      { conceptId: "specialist", capabilityFamily: "PROGRAM_DELIVERY", scope: "OWNERSHIP", specialistClassification: "SPECIALIST", targetCount: 2 },
      { conceptId: "unknown", capabilityFamily: "PROGRAM_DELIVERY", scope: "OWNERSHIP", specialistClassification: "GENERAL", targetCount: 3 },
    ],
    questions: [],
  });
  assert.equal(result.counts.SPECIALIST_BLOCKED, 2);
  assert.equal(result.counts.UNRESOLVED, 3);
  assert.equal(result.specialistLeakage, 0);
});
