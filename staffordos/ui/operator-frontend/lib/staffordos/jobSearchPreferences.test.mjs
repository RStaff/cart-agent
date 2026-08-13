import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const packagePath = path.join(root, "staffordos/ui/operator-frontend/package.json");
const preferencesPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobSearchPreferences.ts");
const qualificationPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/opportunityQualification.ts");
const workflowPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/careerWorkflowActions.ts");
const requireFromFrontend = createRequire(packagePath);
const ts = requireFromFrontend("typescript");

function registerTypeScriptRequire() {
  const original = Module._extensions[".ts"];
  Module._extensions[".ts"] = function compile(mod, filename) {
    const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    });
    mod._compile(compiled.outputText, filename);
  };
  return () => {
    if (original) Module._extensions[".ts"] = original;
    else delete Module._extensions[".ts"];
  };
}

const restore = registerTypeScriptRequire();
const preferences = requireFromFrontend(preferencesPath);
restore();

const explicitPreferences = {
  ...preferences.EMPTY_JOB_SEARCH_PREFERENCES,
  authority: "ROSS_OPERATOR_EXPLICIT",
  capturedAt: "2026-08-13T12:00:00.000Z",
  geography: {
    resolution: "EXPLICIT",
    preferredRegions: [{ regionId: "boston-metro", label: "Boston", aliases: ["Braintree", "Boston, MA"], preference: "PREFERRED" }],
    acceptableRegions: [{ regionId: "new-york-metro", label: "New York", aliases: ["New York, NY"], preference: "ACCEPTABLE" }],
    remote: "ACCEPT",
    hybrid: "ACCEPT",
    onsite: "DECLINE",
    relocation: "NOT_REQUIRED",
  },
};

const qualification = { state: "PLAUSIBLE_TARGET", reasons: ["supported"], hardMismatchCategories: [], limitations: [] };

test("explicit preference authority is separate from career authority", () => {
  assert.equal(preferences.EMPTY_JOB_SEARCH_PREFERENCES.workspaceId, "professional");
  assert.equal(preferences.EMPTY_JOB_SEARCH_PREFERENCES.careerFactAndEvidenceSeparate, true);
  assert.equal(preferences.EMPTY_JOB_SEARCH_PREFERENCES.authority, "AWAITING_ROSS_CONFIRMATION");
  assert.equal(preferences.EMPTY_JOB_SEARCH_PREFERENCES.geography.resolution, "UNRESOLVED");
});

test("unresolved operator preference and unknown location remain UNKNOWN", () => {
  const result = preferences.projectJobSearchCompatibility({
    location: null,
    workArrangement: null,
    qualification,
  });
  assert.equal(result.state, "UNKNOWN");
  assert.match(result.reason, /not.*confirmed|unknown/i);
});

test("explicit preferences do not treat a remote listing without location as acceptable", () => {
  const result = preferences.projectJobSearchCompatibility({
    preferences: explicitPreferences,
    location: null,
    workArrangement: "Remote",
    qualification,
  });
  assert.equal(result.state, "UNKNOWN");
  assert.match(result.reason, /location/i);
});

test("compatible Boston hybrid location projects as MATCH", () => {
  const result = preferences.projectJobSearchCompatibility({
    preferences: explicitPreferences,
    location: "Boston, MA",
    workArrangement: "Hybrid",
    qualification,
  });
  assert.equal(result.state, "MATCH");
  assert.equal(result.inspectable, true);
});

test("clearly incompatible on-site location projects as OUTSIDE_PREFERENCE", () => {
  const result = preferences.projectJobSearchCompatibility({
    preferences: explicitPreferences,
    location: "San Francisco, CA",
    workArrangement: "On-site",
    qualification,
  });
  assert.equal(result.state, "OUTSIDE_PREFERENCE");
  assert.match(result.reason, /arrangement|region/i);
});

test("hard qualification mismatch cannot be rescued by geography match", () => {
  const result = preferences.projectJobSearchCompatibility({
    preferences: explicitPreferences,
    location: "Boston, MA",
    workArrangement: "Hybrid",
    qualification: { ...qualification, state: "HARD_MISMATCH" },
  });
  assert.equal(result.qualificationBlocks, true);
  assert.equal(result.qualificationState, "HARD_MISMATCH");
  assert.equal(result.state, "UNKNOWN");
});

test("workflow actions do not contain a durable preference mutation path", () => {
  const workflowSource = readFileSync(workflowPath, "utf8");
  assert.doesNotMatch(workflowSource, /jobSearchPreferences|preferenceAuthority|mutate.*preference/i);
  assert.match(workflowSource, /sourceAuthority: "ROSS_OPERATOR_DECISION"/);
});

test("qualification remains an independent authority", () => {
  const qualificationSource = readFileSync(qualificationPath, "utf8");
  assert.match(qualificationSource, /export function qualifyOpportunity/);
  assert.doesNotMatch(qualificationSource, /jobSearchPreferences|projectJobSearchCompatibility/);
});
