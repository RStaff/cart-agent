import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const queuePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobOpportunityQueuePresentation.ts");
const intakePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateJobOpportunityIntake.ts");
const surfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/JobCommandSurface.tsx");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const queueSource = readFileSync(queuePath, "utf8");
const intakeSource = readFileSync(intakePath, "utf8");
const surfaceSource = readFileSync(surfacePath, "utf8");

function compileModule(moduleSource, filename) {
  const compiled = ts.transpileModule(moduleSource, {
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

const queue = compileModule(queueSource, queuePath);
const intake = compileModule(intakeSource, intakePath);

const {
  EMPTY_JOB_OPPORTUNITY_QUEUE_PRESENTATION,
  buildJobOpportunityQueuePresentation,
} = queue;

const {
  PRIVATE_JOB_OPPORTUNITY_INTAKE_SCHEMA_VERSION,
  normalizePrivateJobOpportunityIntake,
} = intake;

function intakeRecord(overrides = {}) {
  return {
    schemaVersion: PRIVATE_JOB_OPPORTUNITY_INTAKE_SCHEMA_VERSION,
    workspaceId: "professional",
    sourceUrl: "https://jobs.example.invalid/synthetic/opportunity-queue",
    sourceProvider: "Synthetic source",
    sourceProviderRecordId: "synthetic-queue-001",
    sourceObservedAt: "2026-08-03T10:00:00-04:00",
    sourceSummary: "Synthetic source summary for queue presentation.",
    listingText: "Private synthetic listing text that must not appear in queue presentation.",
    roleTitle: "Synthetic Queue Role",
    companyName: "Example Queue Company",
    location: null,
    workArrangement: null,
    compensationText: null,
    employmentType: null,
    listingPublishedAt: null,
    listingExpiresAt: null,
    operatorNotes: "Private synthetic note that must stay out of the queue.",
    privacy: "Professional owner-private",
    sourceAuthority: "Source explicit",
    limitations: ["Synthetic fixture only."],
    ...overrides,
  };
}

function normalizedOpportunity(overrides = {}) {
  return normalizePrivateJobOpportunityIntake(intakeRecord(overrides), {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  }).normalizedOpportunity;
}

function serialized(value) {
  return JSON.stringify(value);
}

test("empty queue remains truthful", () => {
  const presentation = buildJobOpportunityQueuePresentation();

  assert.deepEqual(presentation.opportunities, []);
  assert.equal(presentation.state, "No opportunities imported yet.");
  assert.equal(presentation.emptyState.title, "No opportunities imported yet.");
});

test("Professional workspace boundary is enforced", () => {
  const opportunity = normalizedOpportunity();
  const presentation = buildJobOpportunityQueuePresentation([opportunity], "professional");

  assert.equal(presentation.workspaceId, "professional");
  assert.equal(presentation.opportunities.length, 1);
});

test("Stafford Media receives no Job Search opportunity data", () => {
  const opportunity = normalizedOpportunity();
  const presentation = buildJobOpportunityQueuePresentation([opportunity], "stafford-media");

  assert.equal(presentation.workspaceId, "stafford-media");
  assert.deepEqual(presentation.opportunities, []);
  assert.match(presentation.summary, /not shown in this workspace/i);
});

test("Personal receives no Job Search opportunity data", () => {
  const opportunity = normalizedOpportunity();
  const presentation = buildJobOpportunityQueuePresentation([opportunity], "personal");

  assert.equal(presentation.workspaceId, "personal");
  assert.deepEqual(presentation.opportunities, []);
});

test("presentation includes read-only review fields", () => {
  const opportunity = normalizedOpportunity({ location: "Source city", workArrangement: "Hybrid", compensationText: "Source range stated" });
  const item = buildJobOpportunityQueuePresentation([opportunity]).opportunities[0];

  assert.equal(item.role, "Synthetic Queue Role");
  assert.equal(item.company, "Example Queue Company");
  assert.equal(item.location, "Source city");
  assert.equal(item.workArrangement, "Hybrid");
  assert.equal(item.compensation, "Source range stated");
  assert.equal(item.reviewStatus, "Needs Ross's review");
  assert.equal(item.nextAction, "Review opportunity");
});

test("presentation uses explicit unknown labels", () => {
  const item = buildJobOpportunityQueuePresentation([normalizedOpportunity()]).opportunities[0];

  assert.equal(item.location, "Location not provided");
  assert.equal(item.workArrangement, "Work arrangement not provided");
  assert.equal(item.compensation, "Compensation not provided");
  assert.equal(item.freshness, "Listing date unknown");
});

test("presentation excludes private paths and source text", () => {
  const opportunity = normalizedOpportunity();
  const presentation = buildJobOpportunityQueuePresentation([opportunity]);
  const text = serialized(presentation);

  assert.doesNotMatch(text, /\/Users\//);
  assert.doesNotMatch(text, /\.staffordos/);
  assert.doesNotMatch(text, /Private synthetic listing text/);
  assert.doesNotMatch(text, /Private synthetic note/);
  assert.doesNotMatch(text, /https:\/\/jobs\.example\.invalid/);
});

test("presentation excludes recruiter and contact data", () => {
  const text = serialized(buildJobOpportunityQueuePresentation([normalizedOpportunity()]));

  assert.doesNotMatch(text, /recruiter|hiring manager|phone|email|@|555/i);
});

test("presentation does not show application controls", () => {
  const text = serialized(buildJobOpportunityQueuePresentation([normalizedOpportunity()]));

  assert.doesNotMatch(text, /Apply now|Submit application|application ready/i);
});

test("presentation does not claim fit or ranking", () => {
  const text = serialized(buildJobOpportunityQueuePresentation([normalizedOpportunity()]));

  assert.doesNotMatch(text, /strong fit|best match|recommended|fit score|match score|likelihood/i);
});

test("detail target is absent until a route exists", () => {
  const item = buildJobOpportunityQueuePresentation([normalizedOpportunity()]).opportunities[0];

  assert.equal(item.detailTarget, null);
});

test("duplicate source status is review language", () => {
  const first = normalizedOpportunity();
  const duplicate = normalizePrivateJobOpportunityIntake(intakeRecord({ sourceUrl: "https://jobs.example.invalid/synthetic/opportunity-queue-duplicate" }), {
    intakeTimestamp: "2026-08-03T10:06:00-04:00",
    existingOpportunities: [first],
  }).normalizedOpportunity;
  const item = buildJobOpportunityQueuePresentation([duplicate]).opportunities[0];

  assert.match(item.sourceStatus, /needs review|alias|duplicate/i);
});

test("queue ordering is deterministic", () => {
  const first = normalizedOpportunity({ roleTitle: "Synthetic B Role", sourceUrl: "https://jobs.example.invalid/synthetic/b" });
  const second = normalizedOpportunity({ roleTitle: "Synthetic A Role", sourceUrl: "https://jobs.example.invalid/synthetic/a" });
  const presentation = buildJobOpportunityQueuePresentation([first, second]);

  assert.deepEqual(presentation.opportunities.map((item) => item.role), ["Synthetic A Role", "Synthetic B Role"]);
});

test("queue builder does not mutate inputs", () => {
  const opportunity = normalizedOpportunity();
  const before = JSON.parse(JSON.stringify(opportunity));

  buildJobOpportunityQueuePresentation([opportunity]);

  assert.deepEqual(opportunity, before);
});

test("Job Command surface imports the redacted queue contract only", () => {
  assert.match(surfaceSource, /jobOpportunityQueuePresentation/);
  assert.doesNotMatch(surfaceSource, /privateJobOpportunityIntake|readFileSync|readdirSync|localStorage|sessionStorage/);
});

test("no operator loader, network, model, database, or send path exists", () => {
  const implementationSource = [queueSource, surfaceSource].join("\n");

  assert.doesNotMatch(implementationSource, /lib\/operator|\/operator\//);
  assert.doesNotMatch(implementationSource, /fetch\(|XMLHttpRequest|http\.request|https\.request/);
  assert.doesNotMatch(implementationSource, /ollama|openai|anthropic|gemini|modelAdapter/i);
  assert.doesNotMatch(implementationSource, /prisma|database|dbClient|sql`|from ".*db/i);
  assert.doesNotMatch(implementationSource, /sendMessage|sendRecruiter|mailto:/);
});

test("empty queue disclosure flags stay closed", () => {
  assert.equal(EMPTY_JOB_OPPORTUNITY_QUEUE_PRESENTATION.disclosure.sourceTextVisible, false);
  assert.equal(EMPTY_JOB_OPPORTUNITY_QUEUE_PRESENTATION.disclosure.privatePathsVisible, false);
  assert.equal(EMPTY_JOB_OPPORTUNITY_QUEUE_PRESENTATION.disclosure.contactDetailsVisible, false);
  assert.equal(EMPTY_JOB_OPPORTUNITY_QUEUE_PRESENTATION.disclosure.fitClaimVisible, false);
  assert.equal(EMPTY_JOB_OPPORTUNITY_QUEUE_PRESENTATION.disclosure.applicationActionVisible, false);
  assert.equal(EMPTY_JOB_OPPORTUNITY_QUEUE_PRESENTATION.disclosure.messageActionVisible, false);
});
