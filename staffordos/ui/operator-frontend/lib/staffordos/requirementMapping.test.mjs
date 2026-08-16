import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const requireFromFrontend = createRequire(path.join(path.dirname(new URL(import.meta.url).pathname), "../../package.json"));
const ts = requireFromFrontend("typescript");
const modulePath = path.join(path.dirname(new URL(import.meta.url).pathname), "requirementMapping.ts");
const original = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const authority = requireFromFrontend(modulePath);
Module._extensions[".ts"] = original;

function item(overrides = {}) {
  return { requirementId: "requirement_1", opportunityId: "job_1", sourceRecordId: "source_1", company: "Example", title: "Program role", requirementText: "Coordinate a cross-functional technical program", requirementType: "RESPONSIBILITY", importance: "CORE", section: "responsibilities", specialist: false, capabilityFamily: "PROGRAM_DELIVERY", careerFactIds: ["fact_1"], careerEvidenceIds: ["evidence_1"], currentMappingState: "UNKNOWN", priority: 10, priorityReason: "High information value", question: "Does the authority support this requirement?", whyAsked: "No relationship exists.", authoritySummary: "One fact and one evidence record.", decision: null, allowedStates: authority.REQUIREMENT_MAPPING_STATES, ...overrides };
}

test("mapping states are explicit and unanswered items are neutral", () => {
  assert.deepEqual(authority.REQUIREMENT_MAPPING_STATES, ["DIRECT", "TRANSFERABLE", "PARTIAL", "NO_SUPPORTED_EQUIVALENT", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"]);
  assert.deepEqual(authority.requirementMappingProgress([item()]), { decisionsCompleted: 0, decisionTotal: 1, requirementsAddressed: 0, requirementTotal: 1 });
});

test("all mapping outcomes persist with exact requirement and source references", () => {
  const directory = fs.mkdtempSync(path.join("/tmp", "career-requirement-mapping-"));
  try {
    let current = item();
    const first = authority.appendRequirementMappingDecision({ decisionRoot: directory, repositoryRoot: process.cwd(), item: current, state: "TRANSFERABLE", supportedPortion: "Program coordination", unresolvedPortion: "Specialist domain depth", createdAt: "2026-08-16T12:00:00.000Z" });
    current = { ...current, decision: first };
    const second = authority.appendRequirementMappingDecision({ decisionRoot: directory, repositoryRoot: process.cwd(), item: current, state: "PARTIAL", supportedPortion: "Cross-functional delivery", unresolvedPortion: "Technical implementation", createdAt: "2026-08-16T12:01:00.000Z" });
    const decisions = authority.loadRequirementMappingDecisions({ decisionRoot: directory, repositoryRoot: process.cwd() });
    assert.equal(decisions.length, 2);
    assert.equal(second.supersedesDecisionId, first.decisionId);
    assert.deepEqual(second.candidateCareerFactIds, ["fact_1"]);
    assert.deepEqual(second.candidateCareerEvidenceIds, ["evidence_1"]);
    assert.equal(authority.requirementMappingProgress([{ ...current, decision: second }]).decisionsCompleted, 1);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("specialist positive mappings require explicit specialist compatibility", () => {
  const directory = fs.mkdtempSync(path.join("/tmp", "career-requirement-specialist-"));
  try {
    assert.throws(() => authority.appendRequirementMappingDecision({ decisionRoot: directory, repositoryRoot: process.cwd(), item: item({ specialist: true }), state: "TRANSFERABLE" }), /SPECIALIST_COMPATIBILITY_REQUIRED/);
    const decision = authority.appendRequirementMappingDecision({ decisionRoot: directory, repositoryRoot: process.cwd(), item: item({ specialist: true }), state: "NO_SUPPORTED_EQUIVALENT" });
    assert.equal(decision.state, "NO_SUPPORTED_EQUIVALENT");
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("private root is required and workflow/source authorities remain immutable", () => {
  const directory = fs.mkdtempSync(path.join("/tmp", "career-requirement-private-"));
  try { assert.throws(() => authority.appendRequirementMappingDecision({ decisionRoot: process.cwd(), repositoryRoot: process.cwd(), item: item(), state: "KEEP_UNRESOLVED" }), /PRIVATE_DECISION_ROOT_REQUIRED/); } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
