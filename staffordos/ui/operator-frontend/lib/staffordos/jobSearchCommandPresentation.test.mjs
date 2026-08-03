import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const presentationPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobSearchCommandPresentation.ts");
const surfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/JobCommandSurface.tsx");
const routePath = path.join(root, "staffordos/ui/operator-frontend/app/os/professional/jobs/page.tsx");
const shellPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/StaffordOsShell.tsx");
const capabilityPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");

const presentationSource = readFileSync(presentationPath, "utf8");
const surfaceSource = readFileSync(surfacePath, "utf8");
const routeSource = readFileSync(routePath, "utf8");
const shellSource = readFileSync(shellPath, "utf8");
const capabilitySource = readFileSync(capabilityPath, "utf8");
const implementationSource = [
  presentationSource,
  surfaceSource,
  routeSource,
  shellSource,
].join("\n");

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

const presentation = compileModule(presentationSource, presentationPath);

const {
  JOB_COMMAND_PRIMARY_QUESTION,
  JOB_COMMAND_ROUTE,
  JOB_SEARCH_COMMAND_PRESENTATION,
  PROFESSIONAL_CAREER_NAVIGATION,
  careerNavigationForWorkspace,
  getJobSearchCommandPresentation,
} = presentation;

function serializedPresentation() {
  return JSON.stringify(JOB_SEARCH_COMMAND_PRESENTATION);
}

function capabilityBlocksFor(workspaceId) {
  return capabilitySource
    .split(/\n  \{\n/)
    .filter((block) => block.includes(`workspaceId: "${workspaceId}"`));
}

test("Job Command belongs to Professional workspace", () => {
  assert.equal(JOB_SEARCH_COMMAND_PRESENTATION.workspaceId, "professional");
  assert.equal(getJobSearchCommandPresentation("professional").title, "Job Command");
  assert.equal(getJobSearchCommandPresentation("stafford-media"), null);
  assert.equal(getJobSearchCommandPresentation("personal"), null);
});

test("Job Command does not appear in Stafford Media capability output", () => {
  const staffordMediaCapabilities = capabilityBlocksFor("stafford-media").join("\n");

  assert.doesNotMatch(staffordMediaCapabilities, /Job Command/);
  assert.doesNotMatch(staffordMediaCapabilities, /\/os\/professional\/jobs/);
});

test("Job Command does not appear in Personal capability output", () => {
  const personalCapabilities = capabilityBlocksFor("personal").join("\n");

  assert.doesNotMatch(personalCapabilities, /Job Command/);
  assert.doesNotMatch(personalCapabilities, /\/os\/professional\/jobs/);
});

test("Career navigation is Professional-only", () => {
  assert.equal(careerNavigationForWorkspace("stafford-media").length, 0);
  assert.equal(careerNavigationForWorkspace("personal").length, 0);
  assert.equal(careerNavigationForWorkspace("professional").length, 6);
  assert.match(shellSource, /careerNavigationForWorkspace/);
  assert.match(shellSource, /activeWorkspace\.id !== "professional"/);
});

test("Only Job Command is available now", () => {
  const availableItems = PROFESSIONAL_CAREER_NAVIGATION.filter((item) => item.status === "available_now");

  assert.deepEqual(availableItems.map((item) => item.label), ["Job Command"]);
  assert.equal(availableItems[0].href, JOB_COMMAND_ROUTE);
});

test("Opportunities is Planned", () => {
  const item = PROFESSIONAL_CAREER_NAVIGATION.find((navItem) => navItem.id === "opportunities");

  assert.equal(item.status, "planned");
  assert.equal(item.href, null);
});

test("Applications is Planned", () => {
  const item = PROFESSIONAL_CAREER_NAVIGATION.find((navItem) => navItem.id === "applications");

  assert.equal(item.status, "planned");
  assert.equal(item.href, null);
});

test("Relationships is Planned", () => {
  const item = PROFESSIONAL_CAREER_NAVIGATION.find((navItem) => navItem.id === "relationships");

  assert.equal(item.status, "planned");
  assert.equal(item.href, null);
});

test("Interviews is Planned", () => {
  const item = PROFESSIONAL_CAREER_NAVIGATION.find((navItem) => navItem.id === "interviews");

  assert.equal(item.status, "planned");
  assert.equal(item.href, null);
});

test("Outcomes is Planned", () => {
  const item = PROFESSIONAL_CAREER_NAVIGATION.find((navItem) => navItem.id === "outcomes");

  assert.equal(item.status, "planned");
  assert.equal(item.href, null);
});

test("No fake opportunity exists", () => {
  assert.deepEqual(JOB_SEARCH_COMMAND_PRESENTATION.connectedRecords.opportunities, []);
  assert.doesNotMatch(serializedPresentation(), /companyName|roleTitle|jobId|opportunityId|opportunitySlug/);
});

test("No employer exists in fixtures", () => {
  assert.doesNotMatch(serializedPresentation(), /employer|companyName|companyId|organization/);
});

test("No recruiter exists in fixtures", () => {
  assert.deepEqual(JOB_SEARCH_COMMAND_PRESENTATION.connectedRecords.followUps, []);
  assert.doesNotMatch(serializedPresentation(), /recruiterName|hiringManager|contactId|personId/);
});

test("No salary exists in fixtures", () => {
  assert.doesNotMatch(serializedPresentation(), /salary|compensation|payRange|dollar|USD|\$/);
});

test("No application exists in fixtures", () => {
  assert.deepEqual(JOB_SEARCH_COMMAND_PRESENTATION.connectedRecords.applications, []);
  assert.doesNotMatch(serializedPresentation(), /applicationId|submittedAt|appliedAt/);
});

test("No interview exists in fixtures", () => {
  assert.deepEqual(JOB_SEARCH_COMMAND_PRESENTATION.connectedRecords.interviews, []);
  assert.doesNotMatch(serializedPresentation(), /interviewId|scheduledAt|interviewer/);
});

test("No private source path exists in presentation data", () => {
  const privatePathPattern = new RegExp(
    [
      String.raw`\/` + "Users" + String.raw`\/`,
      "staffordos-" + "private" + "-intake",
      String.raw`\.` + "staffordos",
      "private" + String.raw`\.json`,
      "source filename",
    ].join("|"),
    "i",
  );

  assert.doesNotMatch(serializedPresentation(), privatePathPattern);
});

test("No private CareerFact exists in presentation data", () => {
  assert.doesNotMatch(serializedPresentation(), /CareerFact|career_fact|candidate_career_facts|private fact/i);
});

test("No /operator loader is imported", () => {
  assert.doesNotMatch(implementationSource, /lib\/operator|from "\.\.\/\.\.\/lib\/operator|\/operator\//);
});

test("No API call exists", () => {
  assert.doesNotMatch(implementationSource, /fetch\(|XMLHttpRequest|\/api\//);
});

test("No database import exists", () => {
  assert.doesNotMatch(implementationSource, /prisma|database|dbClient|sql`|from ".*db/i);
});

test("No model or Ollama import exists", () => {
  assert.doesNotMatch(implementationSource, /ollama|openai|anthropic|gemini|modelAdapter|chiefOfStaffModel/i);
});

test("No application-submit action exists", () => {
  assert.doesNotMatch(implementationSource, /submitApplication|applyToJob|approvedToApply|applicationSubmit|method: "POST"/);
});

test("No message-send action exists", () => {
  assert.doesNotMatch(implementationSource, /sendMessage|sendRecruiter|messageSend|send-proof|mailto:/);
});

test("Human approval language is present", () => {
  const approvalText = serializedPresentation();

  assert.match(approvalText, /Ross remains the approval authority/);
  assert.match(approvalText, /resume changes/);
  assert.match(approvalText, /applications/);
  assert.match(approvalText, /any final representation made in his name/);
});

test("Not connected yet disclosure is present", () => {
  const presentationText = serializedPresentation();

  assert.match(presentationText, /Not connected yet/);
  assert.match(presentationText, /live jobs/);
  assert.match(presentationText, /job-board search/);
  assert.match(presentationText, /application state/);
});

test("Primary question is exact", () => {
  assert.equal(JOB_COMMAND_PRIMARY_QUESTION, "What should I do next in my job search?");
  assert.equal(JOB_SEARCH_COMMAND_PRESENTATION.primaryQuestion, "What should I do next in my job search?");
});

test("Job Command route uses the existing /os layout", () => {
  assert.equal(JOB_COMMAND_ROUTE, "/os/professional/jobs");
  assert.match(routeSource, /JobCommandSurface/);
  assert.doesNotMatch(routeSource, /StaffordOsShell|layout|OperatorShell/);
});

test("No new application shell or duplicate workspace selector exists", () => {
  assert.doesNotMatch(surfaceSource, /StaffordOsShell|OperatorShell|WorkspaceSelector|staffordOsSidebar|staffordOsCommandBar/);
  assert.doesNotMatch(routeSource, /StaffordOsShell|OperatorShell|WorkspaceSelector/);
});

test("Presentation data is deterministic and static", () => {
  assert.doesNotMatch(implementationSource, /Date\.now|new Date\(|Math\.random|crypto\.randomUUID|localStorage|sessionStorage/);
});
