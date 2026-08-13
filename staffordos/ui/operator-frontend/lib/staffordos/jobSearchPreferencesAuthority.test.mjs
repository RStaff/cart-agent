import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import Module from "node:module";
import test from "node:test";

const root = process.cwd();
const packagePath = path.join(root, "staffordos/ui/operator-frontend/package.json");
const authorityPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobSearchPreferencesAuthority.ts");
const careerPreferencesPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobSearchPreferences.ts");
const careerWorkflowPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/careerWorkflowActions.ts");
const careerFactPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/careerEvidenceContracts.ts");
const routePath = path.join(root, "staffordos/ui/operator-frontend/app/os/professional/jobs/page.tsx");
const surfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/JobCommandSurface.tsx");
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
const authority = requireFromFrontend(authorityPath);
const preferences = requireFromFrontend(careerPreferencesPath);
restore();

function validInput(overrides = {}) {
  return {
    preferredRegionIds: ["boston_eastern_massachusetts"],
    acceptableRegionIds: ["new_york_city_metro"],
    remote: "ACCEPT",
    hybrid: "ACCEPT",
    onsite: "DECLINE",
    relocation: "UNKNOWN",
    capturedAt: "2026-08-13T14:00:00.000Z",
    ...overrides,
  };
}

test("unresolved authority loads when no owner-private preference exists", () => {
  const jobSearchRoot = mkdtempSync(path.join(tmpdir(), "careeros-preferences-"));
  const loaded = authority.loadJobSearchPreferences({ jobSearchRoot });
  assert.equal(loaded.authority, "AWAITING_ROSS_CONFIRMATION");
  assert.equal(loaded.geography.resolution, "UNRESOLVED");
});

test("explicit save writes canonical authority and reload preserves it", () => {
  const jobSearchRoot = mkdtempSync(path.join(tmpdir(), "careeros-preferences-"));
  const result = authority.saveJobSearchPreferences({ ...validInput(), jobSearchRoot, operatorId: "ROSS" });
  assert.equal(result.ok, true);
  assert.equal(result.preference.authority, "ROSS_OPERATOR_EXPLICIT");
  assert.deepEqual(authority.loadJobSearchPreferences({ jobSearchRoot }), result.preference);
  const paths = authority.preferenceStoragePaths({ jobSearchRoot });
  assert.equal(JSON.parse(readFileSync(paths.current, "utf8")).geography.preferredRegions[0].label, "Boston / Eastern Massachusetts");
  assert.equal(readFileSync(paths.events, "utf8").trim().split(/\n+/).length, 1);
  assert.equal(statSync(paths.current).mode & 0o777, 0o600);
});

test("invalid values fail closed without writing authority", () => {
  const jobSearchRoot = mkdtempSync(path.join(tmpdir(), "careeros-preferences-"));
  const result = authority.saveJobSearchPreferences({
    ...validInput({ preferredRegionIds: ["not-a-region"], remote: "MAYBE" }),
    jobSearchRoot,
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.length >= 2);
  assert.equal(authority.preferenceStoragePaths({ jobSearchRoot }).current.includes("job_search_preferences.json"), true);
  assert.equal(authority.loadJobSearchPreferences({ jobSearchRoot }).authority, "AWAITING_ROSS_CONFIRMATION");
});

test("save audit records operator authority and no cross-authority mutation", () => {
  const jobSearchRoot = mkdtempSync(path.join(tmpdir(), "careeros-preferences-"));
  authority.saveJobSearchPreferences({ ...validInput(), jobSearchRoot });
  const event = JSON.parse(readFileSync(authority.preferenceStoragePaths({ jobSearchRoot }).events, "utf8"));
  assert.equal(event.operatorAuthority, "ROSS_OPERATOR_EXPLICIT");
  assert.equal(event.careerFactMutated, false);
  assert.equal(event.careerEvidenceMutated, false);
  assert.equal(event.workflowDecisionMutated, false);
  assert.equal(event.opportunityTruthMutated, false);
});

test("preference authority remains separate from CareerFact, CareerEvidence, and workflow code", () => {
  const workflowSource = readFileSync(careerWorkflowPath, "utf8");
  const careerFactSource = readFileSync(careerFactPath, "utf8");
  assert.doesNotMatch(workflowSource, /saveJobSearchPreferences|JOB_SEARCH_PREFERENCES/);
  assert.doesNotMatch(careerFactSource, /saveJobSearchPreferences|JOB_SEARCH_PREFERENCES/);
  assert.match(readFileSync(careerPreferencesPath, "utf8"), /careerFactAndEvidenceSeparate: true/);
});

test("Professional Job Search exposes human controls without private authority data", () => {
  const routeSource = readFileSync(routePath, "utf8");
  const surfaceSource = readFileSync(surfacePath, "utf8");
  assert.match(routeSource, /saveJobSearchPreferencesAction/);
  assert.match(routeSource, /preferencesErrorMessage/);
  assert.match(surfaceSource, /Preferred working regions/);
  assert.match(surfaceSource, /Save job-search preferences/);
  assert.match(surfaceSource, /preferenceSaveErrorMessage/);
  assert.doesNotMatch(surfaceSource, /privatePath|sourceDigest|authorityId|job_search_preferences\.json/);
});

test("server-form style multi-value serialization preserves explicit selections", () => {
  const jobSearchRoot = mkdtempSync(path.join(tmpdir(), "careeros-preferences-"));
  const formData = new FormData();
  formData.append("preferredRegionIds", "boston_eastern_massachusetts");
  formData.append("preferredRegionIds", "northern_new_jersey");
  formData.append("acceptableRegionIds", "new_york_city_metro");
  const result = authority.saveJobSearchPreferences({
    preferredRegionIds: formData.getAll("preferredRegionIds").map(String),
    acceptableRegionIds: formData.getAll("acceptableRegionIds").map(String),
    remote: "ACCEPT",
    hybrid: "ACCEPT",
    onsite: "DECLINE",
    relocation: "UNKNOWN",
    jobSearchRoot,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(authority.loadJobSearchPreferences({ jobSearchRoot }).geography.preferredRegions.map((region) => region.regionId), [
    "boston_eastern_massachusetts",
    "northern_new_jersey",
  ]);
});

test("multiple regions, remote, and all work arrangements are valid selections", () => {
  const jobSearchRoot = mkdtempSync(path.join(tmpdir(), "careeros-preferences-"));
  const result = authority.saveJobSearchPreferences({
    ...validInput({
      preferredRegionIds: ["boston_eastern_massachusetts", "new_york_city_metro", "northern_new_jersey"],
      acceptableRegionIds: ["remote_united_states"],
      remote: "ACCEPT",
      hybrid: "ACCEPT",
      onsite: "ACCEPT",
    }),
    jobSearchRoot,
  });
  assert.equal(result.ok, true);
  const loaded = authority.loadJobSearchPreferences({ jobSearchRoot });
  assert.equal(loaded.geography.preferredRegions.length, 3);
  assert.equal(loaded.geography.acceptableRegions[0].regionId, "remote_united_states");
});

test("duplicate preferred and acceptable region is rejected with a useful safe error", () => {
  const jobSearchRoot = mkdtempSync(path.join(tmpdir(), "careeros-preferences-"));
  const result = authority.saveJobSearchPreferences({
    ...validInput({ acceptableRegionIds: ["boston_eastern_massachusetts"] }),
    jobSearchRoot,
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ["A region cannot be both preferred and additionally acceptable."]);
  assert.equal(authority.loadJobSearchPreferences({ jobSearchRoot }).authority, "AWAITING_ROSS_CONFIRMATION");
});

test("explicit saved authority feeds compatibility without changing qualification", () => {
  const jobSearchRoot = mkdtempSync(path.join(tmpdir(), "careeros-preferences-"));
  const saved = authority.saveJobSearchPreferences({ ...validInput(), jobSearchRoot });
  const loaded = authority.loadJobSearchPreferences({ jobSearchRoot });
  const match = preferences.projectJobSearchCompatibility({
    preferences: loaded,
    location: "Boston, MA",
    workArrangement: "Hybrid",
    relocationRequired: false,
    qualification: { state: "TRANSFERABLE_BUT_NOT_DIRECT", reasons: [], hardMismatchCategories: [] },
  });
  assert.equal(saved.ok, true);
  assert.equal(loaded.authority, "ROSS_OPERATOR_EXPLICIT");
  assert.equal(match.state, "MATCH");
  assert.equal(match.qualificationState, "TRANSFERABLE_BUT_NOT_DIRECT");
  assert.equal(match.qualificationBlocks, false);
});
