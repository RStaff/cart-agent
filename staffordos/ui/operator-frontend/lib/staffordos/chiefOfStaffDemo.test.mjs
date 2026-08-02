import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const validatorPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts");
const demoPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffDemo.ts");
const surfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/ChiefOfStaffDemoSurface.tsx");
const homePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx");
const shellPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/StaffordOsShell.tsx");
const pagePath = path.join(root, "staffordos/ui/operator-frontend/app/os/chief-of-staff/page.tsx");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");

const validatorSource = readFileSync(validatorPath, "utf8");
const demoSource = readFileSync(demoPath, "utf8");
const surfaceSource = readFileSync(surfacePath, "utf8");
const homeSource = readFileSync(homePath, "utf8");
const shellSource = readFileSync(shellPath, "utf8");
const pageSource = readFileSync(pagePath, "utf8");

function compileModule(source, filename, overrides = {}) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = (id) => overrides[id] || originalRequire(id);
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}

const validatorModule = compileModule(validatorSource, validatorPath);
const workspaceRegistryModule = {
  DEFAULT_STAFFORDOS_WORKSPACE_ID: "stafford-media",
};
const demoModule = compileModule(demoSource, demoPath, {
  "./chiefOfStaffValidator": validatorModule,
  "./workspaceRegistry": workspaceRegistryModule,
});

const {
  CHIEF_OF_STAFF_BLOCKED_EXAMPLES,
  CHIEF_OF_STAFF_DEMO_PRESENTATIONS,
  CHIEF_OF_STAFF_TRUST_PANEL,
  CHIEF_OF_STAFF_UNKNOWN_DEMONSTRATION,
  STAFFORD_MEDIA_CHIEF_OF_STAFF_TRUSTED_DEMO,
  getChiefOfStaffDemoPresentation,
} = demoModule;

const allowedRecommendationStatuses = new Set([
  "Candidate",
  "Needs more information",
  "Needs authority",
  "Not recommended",
  "Ready for operator review",
]);

function trustedPresentation() {
  const presentation = getChiefOfStaffDemoPresentation("stafford-media");
  assert.equal(presentation.kind, "stafford-media-demo");
  assert.ok(presentation.trustedResponse, "trusted response should be present");
  return presentation.trustedResponse;
}

test("valid fixture passes the S009.01 validator", () => {
  const trusted = trustedPresentation();

  assert.equal(trusted.validationResult.valid, true);
  assert.equal(trusted.validationReport.trusted, true);
});

test("trusted response is available only when validator.valid is true", () => {
  const trusted = trustedPresentation();

  assert.equal(Boolean(STAFFORD_MEDIA_CHIEF_OF_STAFF_TRUSTED_DEMO), trusted.validationResult.valid);
});

test("invalid fixtures never enter the trusted response model", () => {
  const trusted = trustedPresentation();

  for (const example of CHIEF_OF_STAFF_BLOCKED_EXAMPLES) {
    assert.equal(example.validationResult.valid, false);
    assert.notEqual(example.proposedResponse.responseId, trusted.response.responseId);
    assert.equal(example.validationReport.trusted, false);
  }
});

test("trusted response includes only Stafford Media sources", () => {
  const trusted = trustedPresentation();

  assert.ok(trusted.displayedSources.length > 0);
  assert.ok(trusted.displayedSources.every((source) => source.workspaceId === "stafford-media"));
});

test("all material claims reference valid displayed source IDs", () => {
  const trusted = trustedPresentation();
  const displayedSourceIds = new Set(trusted.displayedSources.map((source) => source.sourceId));

  for (const claim of trusted.response.supportingClaims) {
    assert.ok(claim.supportingSourceIds.length > 0, `${claim.claimId} should have sources`);
    for (const sourceId of claim.supportingSourceIds) {
      assert.ok(displayedSourceIds.has(sourceId), `${claim.claimId} should display ${sourceId}`);
    }
  }
});

test("candidate recommendation remains ready for operator review", () => {
  const trusted = trustedPresentation();
  const recommendation = trusted.response.candidateActions[0];

  assert.ok(allowedRecommendationStatuses.has(recommendation.recommendationStatus));
  assert.equal(recommendation.recommendationStatus, "Ready for operator review");
  assert.equal(recommendation.authorityStatus, "Operator review required");
});

test("trusted model contains no approved executing or completed recommendation status", () => {
  const trustedText = JSON.stringify(trustedPresentation().response).toLowerCase();

  assert.doesNotMatch(trustedText, /"approved"/);
  assert.doesNotMatch(trustedText, /"executing"/);
  assert.doesNotMatch(trustedText, /"completed"/);
});

test("trust panel states that no live AI is connected", () => {
  assert.match(JSON.stringify(CHIEF_OF_STAFF_TRUST_PANEL).toLowerCase(), /external ai/);
  assert.match(JSON.stringify(CHIEF_OF_STAFF_TRUST_PANEL).toLowerCase(), /live ranking/);
});

test("trust panel states that no execution authority exists", () => {
  assert.match(JSON.stringify(CHIEF_OF_STAFF_TRUST_PANEL).toLowerCase(), /execution authority/);
});

test("safe UNKNOWN fallback is present", () => {
  assert.equal(
    CHIEF_OF_STAFF_UNKNOWN_DEMONSTRATION.statement,
    "I cannot verify that from the current StaffordOS sources.",
  );
});

test("Professional returns planned-state presentation only", () => {
  const presentation = getChiefOfStaffDemoPresentation("professional");

  assert.equal(presentation.kind, "planned");
  assert.equal(presentation.sources.length, 0);
  assert.match(presentation.summary, /Professional data is not connected/);
});

test("Personal returns planned-state presentation only", () => {
  const presentation = getChiefOfStaffDemoPresentation("personal");

  assert.equal(presentation.kind, "planned");
  assert.equal(presentation.sources.length, 0);
  assert.match(presentation.summary, /Personal data is not connected/);
});

test("Professional presentation contains no Stafford Media source IDs", () => {
  assert.doesNotMatch(JSON.stringify(getChiefOfStaffDemoPresentation("professional")), /source-/);
  assert.doesNotMatch(JSON.stringify(getChiefOfStaffDemoPresentation("professional")), /stafford-media/);
});

test("Personal presentation contains no Stafford Media source IDs", () => {
  assert.doesNotMatch(JSON.stringify(getChiefOfStaffDemoPresentation("personal")), /source-/);
  assert.doesNotMatch(JSON.stringify(getChiefOfStaffDemoPresentation("personal")), /stafford-media/);
});

test("demo data is deterministic across repeated evaluation", () => {
  assert.deepEqual(
    getChiefOfStaffDemoPresentation("stafford-media"),
    CHIEF_OF_STAFF_DEMO_PRESENTATIONS["stafford-media"],
  );
  assert.deepEqual(
    getChiefOfStaffDemoPresentation("stafford-media"),
    getChiefOfStaffDemoPresentation("stafford-media"),
  );
});

test("no network API database persistence provider prompt or operator-loader path exists", () => {
  const combinedSource = `${demoSource}\n${surfaceSource}`.toLowerCase();

  for (const forbidden of [
    "fetch(",
    "xmlhttprequest",
    "/api/",
    "prisma",
    "localstorage",
    "sessionstorage",
    "openai",
    "anthropic",
    "googleai",
    "embedding",
    "vector",
    "prompttemplate",
    "chatcompletion",
    "regenerate",
    "model selector",
    "provider selector",
    "execute button",
    "approval button",
    "completion button",
    "../operator",
    "../../operator",
  ]) {
    assert.doesNotMatch(combinedSource, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("/os/chief-of-staff route uses the read-only demo surface", () => {
  assert.match(pageSource, /ChiefOfStaffDemoSurface/);
  assert.doesNotMatch(pageSource, /WorkspacePage/);
});

test("Home and shell include one Chief of Staff demonstration path", () => {
  assert.match(homeSource, /href="\/os\/chief-of-staff"/);
  assert.match(shellSource, /href="\/os\/chief-of-staff"/);
  assert.match(homeSource, /Open Chief of Staff/);
  assert.match(shellSource, /Chief of Staff/);
});
