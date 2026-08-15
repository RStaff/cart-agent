import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const frontendRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const repositoryRoot = path.resolve(frontendRoot, "../../..");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");
const modulePath = path.join(frontendRoot, "lib/staffordos/evidenceAdjudication.ts");
function loadModule() {
  const original = Module._extensions[".ts"];
  Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(requireFromFrontend("node:fs").readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename);
  try { return requireFromFrontend(modulePath); } finally { Module._extensions[".ts"] = original; }
}

const adjudication = loadModule();

function evidence(overrides = {}) {
  return {
    id: "evidence_official_1",
    evidenceType: "CERTIFICATION_RECORD",
    authorityClassification: "OFFICIAL_DOCUMENT",
    ...overrides,
  };
}

function fact(overrides = {}) {
  return {
    id: "fact_1",
    statement: "PMP certification is current.",
    factType: "CERTIFICATION",
    verificationStatus: "VERIFIED",
    supportLevel: "DIRECT",
    authorityClassification: "OFFICIAL_DOCUMENT",
    sourceEvidenceIds: ["evidence_official_1"],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    metricClassification: "NOT_APPLICABLE",
    deploymentClaim: null,
    customerUseClaim: null,
    ...overrides,
  };
}

test("verified narrow fact is auto-projectable without changing canonical records", () => {
  const result = adjudication.projectionEligibility(fact(), [evidence()]);
  assert.equal(result.state, "AUTO_PROJECTABLE");
});

test("proposed and conflicting facts are blocked from automatic projection", () => {
  assert.equal(adjudication.projectionEligibility(fact({ verificationStatus: "PROPOSED" }), [evidence()]).state, "OPERATOR_REVIEW_REQUIRED");
  assert.equal(adjudication.projectionEligibility(fact({ verificationStatus: "CONFLICTING" }), [evidence()]).state, "CONFLICT_BLOCKED");
});

test("candidate identity and priority are deterministic and exclude already projected facts", () => {
  const input = { facts: [fact(), fact({ id: "fact_2", sourceEvidenceIds: [] })], evidence: [evidence()] };
  const first = adjudication.buildEvidenceAdjudicationCandidates(input);
  const second = adjudication.buildEvidenceAdjudicationCandidates(input);
  assert.deepEqual(first.map((item) => item.candidateId), second.map((item) => item.candidateId));
  assert.equal(adjudication.reviewQueueCandidates(first).length, 2);
});

test("correction writes adjudication only and preserves source authority", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "career-evidence-adjudication-"));
  try {
    const candidate = adjudication.buildEvidenceAdjudicationCandidates({ facts: [fact({ sourceEvidenceIds: [] })], evidence: [] })[0];
    const decision = adjudication.appendEvidenceAdjudicationDecision({
      decisionRoot: directory,
      repositoryRoot,
      candidate,
      action: "CORRECT",
      operatorCorrection: "Keep the certification statement narrow.",
      createdAt: "2026-08-15T12:00:00.000Z",
    });
    assert.equal(decision.canonicalCareerFactMutated, false);
    assert.equal(decision.canonicalCareerEvidenceCreated, false);
    assert.match(readFileSync(path.join(directory, "decisions.ndjson"), "utf8"), /Keep the certification statement narrow/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("unsupported facts remain unresolved rather than becoming negative evidence", () => {
  const candidate = adjudication.buildEvidenceAdjudicationCandidates({ facts: [fact({ sourceEvidenceIds: [], verificationStatus: "PROPOSED", supportLevel: "UNKNOWN" })], evidence: [] })[0];
  assert.equal(candidate.eligibilityState, "INSUFFICIENT_PROVENANCE");
  assert.equal(candidate.conflictState, "UNKNOWN");
});
