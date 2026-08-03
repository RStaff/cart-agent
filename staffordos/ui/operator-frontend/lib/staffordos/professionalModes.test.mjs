import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/professionalModes.ts");
const registryPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.ts");
const capabilityPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts");
const contextPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/WorkspaceContext.tsx");
const shellPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/StaffordOsShell.tsx");
const jobSearchPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobSearchCommandPresentation.ts");
const careerHomeRoutePath = path.join(root, "staffordos/ui/operator-frontend/app/os/professional/page.tsx");
const jobCommandRoutePath = path.join(root, "staffordos/ui/operator-frontend/app/os/professional/jobs/page.tsx");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");

const modeSource = readFileSync(modePath, "utf8");
const registrySource = readFileSync(registryPath, "utf8");
const capabilitySource = readFileSync(capabilityPath, "utf8");
const contextSource = readFileSync(contextPath, "utf8");
const shellSource = readFileSync(shellPath, "utf8");
const jobSearchSource = readFileSync(jobSearchPath, "utf8");
const careerHomeRouteSource = readFileSync(careerHomeRoutePath, "utf8");
const jobCommandRouteSource = readFileSync(jobCommandRoutePath, "utf8");

function compileModule(source, filename) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}

const professionalModes = compileModule(modeSource, modePath);

const {
  JOB_SEARCH_SPECIFIC_RECORDS,
  MY_JOB_FUTURE_RECORDS,
  PROFESSIONAL_CAREER_HOME_ROUTE,
  PROFESSIONAL_JOB_COMMAND_ROUTE,
  PROFESSIONAL_MODE_TRANSITION_RULES,
  PROFESSIONAL_MODES,
  PROFESSIONAL_NAVIGATION,
  PROFESSIONAL_RETAINED_RECORDS,
  permittedProfessionalTransitions,
  professionalModeById,
  professionalModeTransitionDeletesRecords,
  professionalModesForWorkspace,
  professionalNavigationForWorkspace,
  transitionRequiresRossConfirmation,
} = professionalModes;

function serializedModes() {
  return JSON.stringify({
    PROFESSIONAL_MODES,
    PROFESSIONAL_NAVIGATION,
    PROFESSIONAL_RETAINED_RECORDS,
    JOB_SEARCH_SPECIFIC_RECORDS,
    MY_JOB_FUTURE_RECORDS,
    PROFESSIONAL_MODE_TRANSITION_RULES,
  });
}

test("top-level workspace IDs remain exactly Stafford Media, Professional, and Personal", () => {
  const ids = [...registrySource.matchAll(/id: "(stafford-media|professional|personal)"/g)].map((match) => match[1]);
  assert.deepEqual(ids, ["stafford-media", "professional", "personal"]);
});

test("Family, Media, and Creative are not added as top-level workspaces", () => {
  assert.doesNotMatch(registrySource, /id: "family"|id: "media"|id: "creative"/);
});

test("Professional contains CAREER_HOME, JOB_SEARCH, and MY_JOB modes", () => {
  assert.deepEqual(PROFESSIONAL_MODES.map((mode) => mode.modeId), ["CAREER_HOME", "JOB_SEARCH", "MY_JOB"]);
  assert.deepEqual(professionalModesForWorkspace("professional").map((mode) => mode.modeId), ["CAREER_HOME", "JOB_SEARCH", "MY_JOB"]);
  assert.deepEqual(professionalModesForWorkspace("stafford-media"), []);
  assert.deepEqual(professionalModesForWorkspace("personal"), []);
});

test("Job Search and My Job are not represented as separate workspaces", () => {
  assert.doesNotMatch(registrySource, /id: "job-search"|id: "my-job"/);
});

test("Career Home is available now as a read-only Professional landing context", () => {
  const mode = professionalModeById("CAREER_HOME");

  assert.equal(mode.availability, "available_now");
  assert.equal(mode.route, PROFESSIONAL_CAREER_HOME_ROUTE);
  assert.equal(PROFESSIONAL_CAREER_HOME_ROUTE, "/os/professional");
  assert.match(careerHomeRouteSource, /Professional/);
  assert.doesNotMatch(careerHomeRouteSource, /writeFile|fetch\(|\/api\/|prisma|Ollama|openai/i);
});

test("Job Search is available now at foundation level and retains Job Command route", () => {
  const mode = professionalModeById("JOB_SEARCH");

  assert.equal(mode.availability, "available_now");
  assert.equal(mode.route, PROFESSIONAL_JOB_COMMAND_ROUTE);
  assert.equal(PROFESSIONAL_JOB_COMMAND_ROUTE, "/os/professional/jobs");
  assert.match(jobCommandRouteSource, /JobCommandSurface/);
  assert.match(capabilitySource, /id: "professional-job-search"[\s\S]*?availability: "available_now"/);
  assert.match(capabilitySource, /id: "professional-job-search"[\s\S]*?currentRoute: "\/os\/professional\/jobs"/);
});

test("My Job is planned and has no fake runtime route", () => {
  const mode = professionalModeById("MY_JOB");

  assert.equal(mode.availability, "planned");
  assert.equal(mode.route, null);
  assert.match(JSON.stringify(mode), /Ross decides when his work status changes/);
  assert.doesNotMatch(capabilitySource, /currentRoute: "\/os\/professional\/my-job"/);
});

test("mode changes do not imply deletion or automatic employment transition", () => {
  assert.equal(professionalModeTransitionDeletesRecords(), false);
  assert.ok(PROFESSIONAL_MODE_TRANSITION_RULES.some((rule) => /does not delete records/.test(rule)));
  assert.ok(PROFESSIONAL_MODE_TRANSITION_RULES.some((rule) => /job offer does not automatically activate My Job/i.test(rule)));
  assert.equal(transitionRequiresRossConfirmation("JOB_SEARCH", "MY_JOB"), true);
  assert.ok(permittedProfessionalTransitions("JOB_SEARCH").some((transition) => transition.to === "MY_JOB"));
});

test("Career evidence, achievements, learning, and relationships survive mode transitions", () => {
  for (const retained of ["CareerEvidence", "Achievement", "Learning", "Professional Relationship"]) {
    assert.ok(PROFESSIONAL_RETAINED_RECORDS.includes(retained), `${retained} should be retained`);
    assert.match(serializedModes(), new RegExp(retained));
  }
});

test("Job Search records are not treated as employment records", () => {
  assert.ok(JOB_SEARCH_SPECIFIC_RECORDS.includes("Application"));
  assert.ok(MY_JOB_FUTURE_RECORDS.includes("Employment"));
  assert.doesNotMatch(JSON.stringify(JOB_SEARCH_SPECIFIC_RECORDS), /Employment|Manager|Performance Review|Compensation event/);
});

test("Employment records are not treated as applications", () => {
  assert.doesNotMatch(JSON.stringify(MY_JOB_FUTURE_RECORDS), /Application|JobOpportunity|Interview/);
});

test("Ross remains transition authority", () => {
  assert.match(serializedModes(), /Ross explicitly confirms an employment transition/);
  assert.match(serializedModes(), /Ross decides when his work status changes/);
});

test("WorkspaceContext is presentation-only and is not labeled as authorization", () => {
  assert.match(contextSource, /controls the current \/os presentation only/);
  assert.match(contextSource, /not an authorization boundary/);
  assert.doesNotMatch(contextSource, /fetch\(|XMLHttpRequest|\/api\/|prisma|writeFile/);
});

test("Professional navigation is Professional-only and links only existing routes", () => {
  assert.equal(professionalNavigationForWorkspace("stafford-media").length, 0);
  assert.equal(professionalNavigationForWorkspace("personal").length, 0);
  assert.equal(professionalNavigationForWorkspace("professional").length, PROFESSIONAL_NAVIGATION.length);
  assert.deepEqual(
    PROFESSIONAL_NAVIGATION.filter((item) => item.href).map((item) => item.href),
    ["/os/professional", "/os/professional/jobs"],
  );
  assert.match(shellSource, /professionalNavigationForWorkspace/);
});

test("Job Search command navigation remains compatible with G002 navigation", () => {
  assert.match(jobSearchSource, /PROFESSIONAL_NAVIGATION/);
  assert.match(jobSearchSource, /PROFESSIONAL_CAREER_NAVIGATION: readonly CareerNavigationItem\[\] = PROFESSIONAL_NAVIGATION/);
  assert.match(jobSearchSource, /\/os\/professional\/jobs/);
  assert.doesNotMatch(jobSearchSource, /id: "career-home"/);
  assert.doesNotMatch(jobSearchSource, /id: "my-job"/);
});

test("no real employers, coworkers, job data, or private paths exist in fixtures", () => {
  const text = serializedModes();

  for (const forbidden of [
    "companyName",
    "employer:",
    "coworker:",
    "manager:",
    "interview on",
    "salary",
    "compensation:",
    "staffordos-private-intake",
    ".staffordos/private",
    ".private.json",
  ]) {
    assert.doesNotMatch(text, new RegExp(forbidden, "i"));
  }
});

test("Professional mode implementation contains no network, database, AI, or operator imports", () => {
  const implementationSource = `${modeSource}\n${careerHomeRouteSource}\n${jobCommandRouteSource}\n${shellSource}`;

  assert.doesNotMatch(implementationSource, /fetch\(|XMLHttpRequest|\/api\/|prisma|database|dbClient|sql`/i);
  assert.doesNotMatch(implementationSource, /ollama|openai|anthropic|gemini|modelAdapter/i);
  assert.doesNotMatch(implementationSource, /components\/operator|lib\/operator|from "\.\.\/\.\.\/operator|\/operator\/.+loader/i);
});

test("Stafford Media and Personal behavior remain separated", () => {
  const staffordMediaBlock = registrySource.match(/id: "stafford-media"[\s\S]*?currentAuthorityStatus: "Current operating workspace."/);
  const personalBlock = registrySource.match(/id: "personal"[\s\S]*?currentAuthorityStatus: "Architecture defined; no runtime workflow yet."/);

  assert.ok(staffordMediaBlock);
  assert.ok(personalBlock);
  assert.equal(professionalNavigationForWorkspace("personal").length, 0);
});
