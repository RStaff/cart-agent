import test from "node:test";
import assert from "node:assert/strict";
import { capabilityQuestionForEvidence, capabilityRationaleForEvidence, deriveCapabilityCandidates, decisionStateForAnswer, listCapabilities, normalizeCareerFactForCapabilityDerivation, refreshCapabilityAuthorityState } from "./capabilityCatalog.mjs";
import { reconcileCapabilityAuthority } from "./capabilityAuthorityReconciliation.mjs";
import { parseJobDescription } from "./jobProduct.mjs";
import { readFileSync } from "node:fs";

const evidenceFixtures = [
  ["TEACHING_TRAINING", "Designed and delivered training sessions for users adopting a new platform."],
  ["ANALYTICS_REPORTING", "Created dashboards tracking campaign performance and operational KPIs."],
  ["CONSULTING_CLIENT_DELIVERY", "Advised clients and coordinated delivery of technology implementations."],
  ["BUSINESS_PROCESS_OPERATIONS", "Improved intake workflows and coordinated vendors and internal stakeholders."],
  ["MARKETING_DIGITAL", "Managed digital marketing campaigns and marketing technology initiatives."],
];

test("canonical CareerFact rows preserve authorityState before capability derivation", () => {
  assert.match(readFileSync(new URL("./careerP0Product.mjs", import.meta.url), "utf8"), /f\."authorityState"/);
  const rows = [
    { id: "fact-project", sourceId: "source-project", statement: "Managed a cross-functional website migration.", factType: "PROJECT", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" },
    { id: "fact-technology", sourceId: "source-technology", statement: "Implemented a platform using a technology tool.", factType: "TECHNOLOGY", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" },
    { id: "fact-operations", sourceId: "source-operations", statement: "Operated a small business, managing vendors and process operations.", factType: "OTHER", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" },
  ];
  const normalized = rows.map(normalizeCareerFactForCapabilityDerivation);
  assert.deepEqual(normalized.map((fact) => fact.authorityState), rows.map((fact) => fact.authorityState));
  assert.deepEqual(
    deriveCapabilityCandidates(normalized).map((candidate) => candidate.capabilityKey).sort(),
    ["BUSINESS_PROCESS_OPERATIONS", "CROSS_FUNCTIONAL_COORDINATION", "PROGRAM_DELIVERY", "TECHNOLOGY_IMPLEMENTATION"],
  );
});

test("new capability concepts derive only from confirmed fact-shaped evidence and retain provenance", () => {
  const facts = evidenceFixtures.map(([expectedKey, statement], index) => ({ id: `fact-${index}`, sourceId: `source-${index}`, factType: "OTHER", statement, expectedKey, authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }));
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

test("change and product operations language uses bounded existing ownership", () => {
  const requirements = parseJobDescription({ title: "Synthetic role", description: [
    "Facilitate user adoption.",
    "Establish product operating rhythms.",
    "Manage product intake processes.",
  ].join("\n") }).requirements;
  assert.deepEqual(requirements.map((item) => item.conceptKey), [
    "TEACHING_TRAINING",
    "BUSINESS_PROCESS_OPERATIONS",
    "BUSINESS_PROCESS_OPERATIONS",
  ]);
});

test("planning and product-strategy wording does not become unsupported capability authority", () => {
  const requirements = parseJobDescription({ title: "Synthetic role", description: [
    "Facilitate planning and prioritization.",
    "Own product strategy and roadmap.",
    "Responsible for pricing and portfolio strategy.",
  ].join("\n") }).requirements;
  assert.deepEqual(requirements.map((item) => item.conceptKey), [
    "UNRESOLVED_REQUIREMENT",
    "UNRESOLVED_REQUIREMENT",
    "UNRESOLVED_REQUIREMENT",
  ]);
});

test("entrepreneurship remains an operations signal rather than a new authority concept", () => {
  const derived = deriveCapabilityCandidates([{ id: "fact-business", sourceId: "source-business", factType: "PROJECT", statement: "Built and operated a small business, managing vendors and revenue planning.", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }]);
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
  for (const answer of ["DIRECT", "TRANSFERABLE", "PARTIAL", "NOT_SUPPORTED", "KEEP_UNRESOLVED"]) assert.ok(decisionStateForAnswer(answer));
});

test("unconfirmed evidence cannot derive capability propositions", () => {
  const derived = deriveCapabilityCandidates([{ id: "candidate-1", sourceId: "source-1", factType: "PROJECT", statement: "Managed a cross-functional migration.", status: "PROPOSED" }]);
  assert.deepEqual(derived, []);
});

test("rejected and deferred candidates cannot derive capability propositions", () => {
  for (const status of ["REJECTED", "NEEDS_REVIEW"]) {
    assert.deepEqual(deriveCapabilityCandidates([{ id: `candidate-${status}`, sourceId: "source-1", factType: "PROJECT", statement: "Managed a cross-functional migration.", status }]), []);
  }
});

test("interviewer questions cannot derive capability propositions", () => {
  const derived = deriveCapabilityCandidates([{ id: "prompt-1", sourceId: "source-1", factType: "PROJECT", statement: "What did you personally do in this experience?", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }]);
  assert.deepEqual(derived, []);
});

test("capability questions explain themselves from confirmed evidence", () => {
  const prompt = capabilityQuestionForEvidence({ label: "Cross-functional coordination", question: { prompt: "Have you coordinated work?" } }, ["Coordinated developers, marketing, and senior team."]);
  assert.equal(prompt, "Have you coordinated work?");
  assert.doesNotMatch(prompt, /Coordinated developers/);
  assert.match(capabilityRationaleForEvidence({ label: "Cross-functional coordination" }, ["Coordinated developers, marketing, and senior team."]), /confirmed experience/i);
});

test("new confirmed fact provenance reopens prior capability authority without changing its decision", () => {
  const existing = { authorityState: "VERIFIED_DIRECT", provenance: { factIds: ["old-fact"] } };
  const candidate = { authorityState: "NEEDS_MORE_EVIDENCE", provenance: { factIds: ["old-fact", "new-fact"] } };
  assert.equal(refreshCapabilityAuthorityState(existing, candidate), "NEEDS_MORE_EVIDENCE");
});

test("canonical reconciliation persists new evidence without reopening unchanged capability", async () => {
  const queries = [];
  const pool = { query: async (sql, params) => {
    queries.push({ sql, params });
    if (sql.startsWith("UPDATE")) return { rowCount: 1, rows: [{ authorityState: "NEEDS_MORE_EVIDENCE" }] };
    if (sql.startsWith("SELECT")) return { rowCount: 1, rows: [{ authorityState: "NEEDS_MORE_EVIDENCE", provenance: { factIds: ["old-fact", "new-fact"] } }] };
    return { rowCount: 0, rows: [] };
  } };
  const candidate = { capabilityKey: "PROGRAM_DELIVERY", label: "Program delivery", domain: "delivery", scope: "project", authorityState: "NEEDS_MORE_EVIDENCE", taxonomyVersion: "test", provenance: { factIds: ["old-fact", "new-fact"] } };
  const result = await reconcileCapabilityAuthority(pool, { tenant: { id: "tenant-1" }, user: { id: "user-1" } }, "profile-1", candidate);
  assert.equal(result.authorityState, "NEEDS_MORE_EVIDENCE");
  assert.equal(queries.filter((item) => item.sql.startsWith("INSERT")).length, 0);
  assert.match(queries[0].sql, /IS DISTINCT FROM/);
});

test("reconciliation trace captures the canonical state transitions without evidence text", async () => {
  const trace = [];
  const pool = { query: async (sql) => {
    if (sql.startsWith("UPDATE")) return { rowCount: 1, rows: [] };
    if (sql.startsWith("SELECT")) return { rowCount: 1, rows: [{ authorityState: "NEEDS_MORE_EVIDENCE", provenance: { factIds: ["old-fact", "new-fact"] } }] };
    return { rowCount: 0, rows: [] };
  } };
  const candidate = { capabilityKey: "PROGRAM_DELIVERY", label: "Program delivery", domain: "delivery", scope: "project", authorityState: "NEEDS_MORE_EVIDENCE", taxonomyVersion: "test", provenance: { factIds: ["old-fact", "new-fact"], statements: ["private evidence must not be traced"] } };
  await reconcileCapabilityAuthority(pool, { tenant: { id: "tenant-1" }, user: { id: "user-1" } }, "profile-1", candidate, "NEEDS_MORE_EVIDENCE", trace);
  assert.deepEqual(trace, [{ capabilityKey: "PROGRAM_DELIVERY", expectedAuthorityState: "NEEDS_MORE_EVIDENCE", profileId: "profile-1", priorAuthorityState: null, existingAuthority: false, updateAttempted: true, updateRowCount: 1, insertAttempted: false, readbackAuthorityState: "NEEDS_MORE_EVIDENCE", returnedAuthorityState: "NEEDS_MORE_EVIDENCE", reconciliationSucceeded: true }]);
  assert.equal(JSON.stringify(trace).includes("private evidence"), false);
});

test("reconciliation trace preserves a persisted-state mismatch before failing closed", async () => {
  const trace = [];
  const pool = { query: async (sql) => {
    if (sql.startsWith("UPDATE")) return { rowCount: 1, rows: [] };
    if (sql.startsWith("SELECT")) return { rowCount: 1, rows: [{ authorityState: "VERIFIED_DIRECT", provenance: { factIds: ["old-fact"] } }] };
    return { rowCount: 0, rows: [] };
  } };
  const candidate = { capabilityKey: "PROGRAM_DELIVERY", label: "Program delivery", domain: "delivery", scope: "project", authorityState: "NEEDS_MORE_EVIDENCE", taxonomyVersion: "test", provenance: { factIds: ["old-fact", "new-fact"] } };
  await assert.rejects(() => reconcileCapabilityAuthority(pool, { tenant: { id: "tenant-1" }, user: { id: "user-1" } }, "profile-1", candidate, "NEEDS_MORE_EVIDENCE", trace), /CAPABILITY_AUTHORITY_RECONCILIATION_FAILED/);
  assert.equal(trace[0].updateRowCount, 1);
  assert.equal(trace[0].readbackAuthorityState, "VERIFIED_DIRECT");
  assert.equal(trace[0].reconciliationSucceeded, false);
});

test("canonical reconciliation preserves unchanged authority state", async () => {
  const queries = [];
  const pool = { query: async (sql) => {
    queries.push(sql);
    if (sql.startsWith("SELECT")) return { rowCount: 1, rows: [{ authorityState: "VERIFIED_DIRECT", provenance: { factIds: ["same-fact"] } }] };
    return { rowCount: 0, rows: [] };
  } };
  const candidate = { capabilityKey: "BUSINESS_PROCESS_OPERATIONS", label: "Business and process operations", domain: "operations", scope: "process", authorityState: "VERIFIED_DIRECT", taxonomyVersion: "test", provenance: { factIds: ["same-fact"] } };
  const result = await reconcileCapabilityAuthority(pool, { tenant: { id: "tenant-1" }, user: { id: "user-1" } }, "profile-1", candidate);
  assert.equal(result.authorityState, "VERIFIED_DIRECT");
  assert.equal(queries.filter((sql) => sql.startsWith("INSERT")).length, 1);
});
