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
const modulePath = path.join(frontendRoot, "lib/staffordos/evidenceReviewCompression.ts");
const original = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(requireFromFrontend("node:fs").readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const compression = requireFromFrontend(modulePath);
Module._extensions[".ts"] = original;

function candidate(overrides = {}) {
  return {
    candidateId: "candidate_1",
    sourceFactId: "fact_1",
    statement: "Led cross-functional program delivery and stakeholder coordination.",
    factType: "LEADERSHIP",
    organization: "Example",
    roleOrTitle: "Program Lead",
    capabilityFamily: "PROGRAM_AND_LEADERSHIP",
    directOrTransferable: "DIRECT",
    verificationStatus: "CONFLICTING",
    authorityClassification: "REPOSITORY_BACKED",
    supportLevel: "UNKNOWN",
    conflictState: "CONFLICTING",
    conflictReason: "UNRESOLVED_VERIFICATION",
    eligibilityState: "CONFLICT_BLOCKED",
    eligibilityReasons: ["Review required"],
    sourceEvidenceCount: 0,
    sourceEvidenceTypes: [],
    alreadyProjected: false,
    operatorDecision: null,
    operatorCorrection: null,
    priority: 1,
    ...overrides,
  };
}

test("clustering is deterministic and preserves direct/transferable separation", () => {
  const input = [candidate(), candidate({ candidateId: "candidate_2", sourceFactId: "fact_2" }), candidate({ candidateId: "candidate_3", directOrTransferable: "TRANSFERABLE", statement: "Transferable cross-functional program delivery." })];
  const first = compression.buildReviewClusters({ candidates: input });
  const second = compression.buildReviewClusters({ candidates: input });
  assert.deepEqual(first.allClusters.map((item) => item.clusterId), second.allClusters.map((item) => item.clusterId));
  assert.ok(first.allClusters.some((item) => item.underlyingCandidateCount === 2));
  assert.ok(first.allClusters.every((item) => new Set(input.filter((candidateItem) => item.underlyingCandidateIds.includes(candidateItem.candidateId)).map((candidateItem) => candidateItem.directOrTransferable)).size === 1));
});

test("specialist and incompatible family candidates do not enter generic clusters", () => {
  const result = compression.buildReviewClusters({ candidates: [
    candidate(),
    candidate({ candidateId: "specialist", capabilityFamily: "CREDENTIAL_AND_EDUCATION", statement: "International tax compliance expertise." }),
  ] });
  assert.ok(result.allClusters.every((item) => !item.underlyingCandidateIds.includes("specialist")));
});

test("cluster propagation only includes compatible candidates and is reversible by superseding append", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "career-review-cluster-"));
  try {
    const cluster = compression.buildReviewClusters({ candidates: [candidate({ directOrTransferable: "UNRESOLVED" })] }).allClusters[0];
    const first = compression.appendReviewClusterDecision({ decisionRoot: directory, repositoryRoot, cluster, answer: "TRANSFERABLE", createdAt: "2026-08-15T12:00:00.000Z" });
    const second = compression.appendReviewClusterDecision({ decisionRoot: directory, repositoryRoot, cluster, answer: "KEEP_UNRESOLVED", createdAt: "2026-08-15T12:01:00.000Z" });
    assert.equal(first.canonicalCareerFactMutated, false);
    assert.equal(second.canonicalCareerEvidenceCreated, false);
    assert.equal(readFileSync(path.join(directory, "cluster-decisions.ndjson"), "utf8").trim().split(/\r?\n/).length, 2);
    const decisions = compression.loadReviewClusterDecisions({ decisionRoot: directory, repositoryRoot });
    const reread = compression.buildReviewClusters({ candidates: [candidate({ directOrTransferable: "UNRESOLVED" })], decisions }).allClusters[0];
    assert.equal(reread.operatorAnswer, "KEEP_UNRESOLVED");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
