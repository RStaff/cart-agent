import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/opportunityQualification.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");

function requireTypeScriptModule(targetPath) {
  const originalTsExtension = Module._extensions[".ts"];
  Module._extensions[".ts"] = function compileTypeScriptModule(mod, filename) {
    const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    });
    mod._compile(compiled.outputText, filename);
  };
  try {
    return requireFromFrontend(targetPath);
  } finally {
    if (originalTsExtension) Module._extensions[".ts"] = originalTsExtension;
    else delete Module._extensions[".ts"];
  }
}

const qualification = requireTypeScriptModule(modulePath);

function requirement(text, overrides = {}) {
  return {
    id: overrides.id || `requirement_${text.slice(0, 8)}`,
    requirementText: text,
    requirementLevel: overrides.level || "REQUIRED",
    importanceClassification: overrides.importance || "Required",
    requirementCategory: overrides.category || "Required skill",
  };
}

function mapping(requirementRecord, classification = "UNKNOWN", overrides = {}) {
  return {
    requirementId: requirementRecord.id,
    classification,
    explanation: overrides.explanation || "Synthetic evidence mapping.",
    safePositioning: overrides.safePositioning || "Use only supported experience.",
    matchedSignals: overrides.matchedSignals || [],
  };
}

function qualify(role, requirements, mappings = []) {
  return qualification.qualifyOpportunity({ role, totalScore: 10, requirements, mappings });
}

test("mandatory professional qualifications are hard mismatches", () => {
  const legal = requirement("A JD and active membership in a state bar.");
  const medical = requirement("Active medical license and board certification.");
  const certification = requirement("Required PMP certification.", { category: "Certification" });

  assert.equal(qualify("Commercial Counsel", [legal], [mapping(legal)]).state, "HARD_MISMATCH");
  assert.equal(qualify("Clinical Program Manager", [medical], [mapping(medical)]).state, "HARD_MISMATCH");
  assert.equal(qualify("Technical Program Manager", [certification], [mapping(certification)]).state, "HARD_MISMATCH");
});

test("security clearance and mandatory location fail closed when unsupported", () => {
  const clearance = requirement("Must hold an active Top Secret security clearance.");
  const location = requirement("Must be located in London and work onsite.", { category: "Location or work arrangement" });

  assert.equal(qualify("AI Governance Manager", [clearance], [mapping(clearance)]).state, "HARD_MISMATCH");
  assert.equal(qualify("Business Systems Analyst", [location], [mapping(location)]).state, "HARD_MISMATCH");
});

test("specialized and unrelated functions do not survive on generic keywords", () => {
  const infra = requirement("Deep experience with kernel, Firecracker, gVisor, and Kubernetes.");
  const treasury = requirement("Own global cash positioning, liquidity, and bank connectivity.");
  const genericTransfer = mapping(infra, "TRANSFERABLE", { matchedSignals: ["automation"] });

  assert.equal(qualify("AI Infrastructure Engineer, Sandbox Platform", [infra], [genericTransfer]).state, "HARD_MISMATCH");
  assert.equal(qualify("Cash Manager, Treasury", [treasury], [mapping(treasury, "TRANSFERABLE", { matchedSignals: ["automation"] })]).state, "HARD_MISMATCH");
});

test("unknown evidence remains uncertainty and transferable target lanes survive", () => {
  const requirementRecord = requirement("Experience partnering with business stakeholders on workflow automation.");
  const unknown = qualify("Business Systems Analyst", [requirementRecord], [mapping(requirementRecord)]);
  const transferable = qualify("Senior Manager, Marketing AI Operations", [requirementRecord], [mapping(requirementRecord, "TRANSFERABLE", { matchedSignals: ["workflow", "automation"] })]);

  assert.equal(unknown.state, "INSUFFICIENT_EVIDENCE");
  assert.notEqual(unknown.state, "HARD_MISMATCH");
  assert.equal(transferable.state, "TRANSFERABLE_BUT_NOT_DIRECT");
});

test("shortlist is a projection: WAIT is background and hard mismatches are excluded", () => {
  const target = { state: "PLAUSIBLE_TARGET", reasons: [], hardMismatchCategories: [], limitations: [] };
  const hard = { state: "HARD_MISMATCH", reasons: [], hardMismatchCategories: ["role family"], limitations: [] };

  assert.equal(qualification.shortlistOpportunity({ recommendation: "WAIT", qualification: target, totalScore: 80, supportingEvidenceCount: 5, role: "AI Product Manager" }), false);
  assert.equal(qualification.shortlistOpportunity({ recommendation: "REVIEW", qualification: hard, totalScore: 80, supportingEvidenceCount: 5, role: "Commercial Counsel" }), false);
  assert.equal(qualification.shortlistOpportunity({ recommendation: "REVIEW", qualification: target, totalScore: 18, supportingEvidenceCount: 3, role: "Business Systems Analyst" }), true);
});

test("qualification and shortlist never expose or mutate canonical evidence", () => {
  const record = requirement("Verified workflow automation experience.");
  const evidence = mapping(record, "PROVEN", { matchedSignals: ["workflow"] });
  const before = JSON.stringify({ record, evidence });
  qualify("Business Technology Manager", [record], [evidence]);
  assert.equal(JSON.stringify({ record, evidence }), before);
  assert.doesNotMatch(JSON.stringify(qualification), /fetch|axios|ollama|CareerFact|CareerEvidence/);
});
