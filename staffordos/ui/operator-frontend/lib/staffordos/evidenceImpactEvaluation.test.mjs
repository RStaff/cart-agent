import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
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

test("V1.26C high-value adjudication is complete and addresses a distinct candidate union", () => {
  const runtime = compression.loadCompressedReviewRuntime({ repositoryRoot });
  const progress = compression.compressionProgress(runtime);
  assert.equal(progress.operatorDecisions, 16);
  assert.equal(progress.operatorDecisionTotal, 16);
  assert.equal(progress.underlyingCandidatesAddressed, 203);
  assert.equal(progress.underlyingCandidateTotal, 890);
  assert.equal(runtime.highValueClusters.every((cluster) => cluster.operatorAnswer), true);
  assert.equal(runtime.highValueClusters.every((cluster) => cluster.allowedAnswers.includes(cluster.operatorAnswer)), true);
  assert.equal(runtime.decisions.every((decision) => decision.canonicalCareerFactMutated === false), true);
  assert.equal(runtime.decisions.every((decision) => decision.canonicalCareerEvidenceCreated === false), true);
});

test("operator answers remain bounded to the declared vocabulary", () => {
  const runtime = compression.loadCompressedReviewRuntime({ repositoryRoot });
  const answers = new Set(runtime.highValueClusters.map((cluster) => cluster.operatorAnswer));
  assert.deepEqual([...answers].sort(), ["DIRECT", "KEEP_UNRESOLVED", "TRANSFERABLE"].sort());
});
