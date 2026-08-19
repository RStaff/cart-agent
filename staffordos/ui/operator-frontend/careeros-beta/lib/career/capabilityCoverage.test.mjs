import test from "node:test";
import assert from "node:assert/strict";
import { deriveCapabilityCandidates, decisionStateForAnswer, listCapabilities } from "./capabilityCatalog.mjs";
import { parseJobDescription } from "./jobProduct.mjs";

const evidenceFixtures = [
  ["TEACHING_TRAINING", "Designed and delivered training sessions for users adopting a new platform."],
  ["ANALYTICS_REPORTING", "Created dashboards tracking campaign performance and operational KPIs."],
  ["CONSULTING_CLIENT_DELIVERY", "Advised clients and coordinated delivery of technology implementations."],
  ["BUSINESS_PROCESS_OPERATIONS", "Improved intake workflows and coordinated vendors and internal stakeholders."],
  ["MARKETING_DIGITAL", "Managed digital marketing campaigns and marketing technology initiatives."],
];

test("new capability concepts derive only from confirmed fact-shaped evidence and retain provenance", () => {
  const facts = evidenceFixtures.map(([expectedKey, statement], index) => ({ id: `fact-${index}`, sourceId: `source-${index}`, factType: "OTHER", statement, expectedKey }));
  const derived = deriveCapabilityCandidates(facts);
  for (const [expectedKey, statement] of evidenceFixtures) {
    const capability = derived.find((item) => item.capabilityKey === expectedKey);
    assert.ok(capability, `derived ${expectedKey}`);
    const fact = facts.find((item) => item.statement === statement);
    assert.equal(capability.authorityState, "NEEDS_MORE_EVIDENCE");
    assert.ok(capability.factIds.includes(fact.id));
    assert.ok(capability.sourceIds.includes(fact.sourceId));
    assert.ok(capability.provenance.factIds.includes(fact.id));
    assert.ok(capability.provenance.sourceIds.includes(fact.sourceId));
  }
});

test("new requirement wording maps to the corresponding capability concepts", () => {
  const requirements = parseJobDescription({ title: "Synthetic role", description: [
    "Facilitate role-based workshops and office hours.",
    "Build reporting on usage, engagement, and business impact.",
    "Partner with customers to implement solutions.",
    "Optimize operational processes across teams.",
    "Lead digital acquisition and marketing operations programs.",
  ].join("\n") }).requirements;
  assert.deepEqual(requirements.map((item) => item.conceptKey), [
    "TEACHING_TRAINING",
    "ANALYTICS_REPORTING",
    "CONSULTING_CLIENT_DELIVERY",
    "BUSINESS_PROCESS_OPERATIONS",
    "MARKETING_DIGITAL",
  ]);
});

test("common client-relationship and process-improvement wording stays in the existing concepts", () => {
  const requirements = parseJobDescription({ title: "Synthetic role", description: [
    "Manage account relationships.",
    "Design process improvements.",
  ].join("\n") }).requirements;
  assert.deepEqual(requirements.map((item) => item.conceptKey), [
    "CONSULTING_CLIENT_DELIVERY",
    "BUSINESS_PROCESS_OPERATIONS",
  ]);
});

test("entrepreneurship remains an operations signal rather than a new authority concept", () => {
  const derived = deriveCapabilityCandidates([{ id: "fact-business", sourceId: "source-business", factType: "PROJECT", statement: "Built and operated a small business, managing vendors and revenue planning." }]);
  assert.ok(derived.some((item) => item.capabilityKey === "BUSINESS_PROCESS_OPERATIONS"));
  assert.ok(derived.some((item) => item.capabilityKey === "OUTCOME_DELIVERY"));
  assert.equal(derived.some((item) => item.capabilityKey === "ENTREPRENEURSHIP_BUSINESS_OWNERSHIP"), false);
});

test("specialist requirements remain specialist and unsupported evidence stays unresolved", () => {
  const requirement = parseJobDescription({ title: "Synthetic federal role", description: "Active Top Secret clearance required." }).requirements[0];
  assert.equal(requirement.conceptKey, "SPECIALIST_REQUIREMENT");
  assert.equal(requirement.specialist, true);
  assert.equal(deriveCapabilityCandidates([]).length, 0);
});

test("existing capability concepts and customer review states remain available", () => {
  const keys = listCapabilities().map((item) => item.key);
  for (const key of ["PROGRAM_DELIVERY", "CROSS_FUNCTIONAL_COORDINATION", "TECHNOLOGY_IMPLEMENTATION", "OUTCOME_DELIVERY", "PEOPLE_MANAGEMENT"]) assert.ok(keys.includes(key));
  for (const answer of ["DIRECT", "TRANSFERABLE", "PARTIAL", "KEEP_UNRESOLVED"]) assert.ok(decisionStateForAnswer(answer));
});
