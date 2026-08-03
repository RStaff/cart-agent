import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const decisionPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.ts");
const decisionPagePath = path.join(root, "staffordos/ui/operator-frontend/app/os/decisions/page.tsx");
const decisionSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/DecisionSurface.tsx");
const homeComponentPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx");
const knowledgePagePath = path.join(root, "staffordos/ui/operator-frontend/app/os/knowledge/page.tsx");

const decisionSource = readFileSync(decisionPath, "utf8");
const decisionPageSource = readFileSync(decisionPagePath, "utf8");
const decisionSurfaceSource = readFileSync(decisionSurfacePath, "utf8");
const homeComponentSource = readFileSync(homeComponentPath, "utf8");
const knowledgePageSource = readFileSync(knowledgePagePath, "utf8");

function decisionBlocksFor(workspaceId) {
  return decisionSource
    .split(/\n  \{\n/)
    .filter((block) => block.includes(`workspaceId: "${workspaceId}"`));
}

function currentStaffordDecisionBlocks() {
  return decisionBlocksFor("stafford-media").filter((block) => /approvalStatus: "chosen"/.test(block));
}

test("Stafford Media has no more than five current Decision records", () => {
  const currentDecisions = currentStaffordDecisionBlocks();

  assert.ok(currentDecisions.length > 0);
  assert.ok(currentDecisions.length <= 5);
});

test("every current record is repository-backed", () => {
  assert.ok(currentStaffordDecisionBlocks().every((block) => /sourceClassification: "repository_backed"/.test(block)));
});

test("every current record has exact evidence references", () => {
  assert.ok(currentStaffordDecisionBlocks().every((block) => /evidenceReferences: \[[\s\S]*?staffordos\//.test(block)));
});

test("every current record has authority classification", () => {
  assert.ok(currentStaffordDecisionBlocks().every((block) => /authorityClassification: "/.test(block)));
});

test("every current record has static historical metadata", () => {
  assert.ok(currentStaffordDecisionBlocks().every((block) => /staticity: "HISTORICAL"/.test(block)));
  assert.ok(currentStaffordDecisionBlocks().every((block) => /freshness: "HISTORICAL"/.test(block)));
  assert.ok(currentStaffordDecisionBlocks().every((block) => /asOf: "2026-/.test(block)));
  assert.ok(currentStaffordDecisionBlocks().every((block) => /limitations: \[/.test(block)));
});

test("superseded historical workspace record stays auditable", () => {
  assert.match(decisionSource, /id: "s008-stafford-media-now-planned-boundary"[\s\S]*?supersededBy: \["G002_00_PROFESSIONAL_MODE_AND_WORKSPACE_REGISTRY_RECONCILIATION"\]/);
  assert.match(decisionSource, /Professional now has Career Home and Job Search foundations/);
});

test("every record belongs to exactly one workspace", () => {
  for (const block of decisionSource.split(/\n  \{\n/).filter((candidate) => /id: "[^"]+"/.test(candidate) && candidate.includes("workspaceId:"))) {
    const matches = block.match(/workspaceId: "/g) || [];
    assert.equal(matches.length, 1);
  }
});

test("Professional has no current records", () => {
  assert.equal(currentStaffordDecisionBlocks().length, 5);
  assert.equal(decisionBlocksFor("professional").filter((block) => /approvalStatus: "chosen"/.test(block)).length, 0);
});

test("Personal has no current records", () => {
  assert.equal(decisionBlocksFor("personal").filter((block) => /approvalStatus: "chosen"/.test(block)).length, 0);
});

test("no Stafford Media decisions leak across workspaces", () => {
  const plannedWorkspaceBlocks = `${decisionBlocksFor("professional").join("\n")}\n${decisionBlocksFor("personal").join("\n")}`;

  assert.doesNotMatch(plannedWorkspaceBlocks, /s008-operator-runtime-canonical/);
  assert.doesNotMatch(plannedWorkspaceBlocks, /s008-start-my-day-static-home-action/);
  assert.doesNotMatch(plannedWorkspaceBlocks, /approvalStatus: "chosen"/);
});

test("lookup by workspace works", () => {
  assert.match(decisionSource, /export function getDecisionsForWorkspace\(workspaceId: StaffordOsWorkspaceId\)/);
});

test("lookup by ID works and fails safely", () => {
  assert.match(decisionSource, /export function getDecisionById\(decisionId: string \| null \| undefined\)/);
  assert.match(decisionSource, /\|\| null/);
});

test("lookup by Objective uses explicit mappings only", () => {
  assert.match(decisionSource, /export function getDecisionsForObjective\(objectiveId: string\)/);
  assert.match(decisionSource, /decision\.objectiveId === objectiveId/);
  assert.doesNotMatch(decisionSource, /title\.includes|summary\.includes|why\.includes|objective\.title/);
});

test("unsupported IDs fail safely", () => {
  assert.match(decisionSource, /getDecisionById\(decisionId/);
  assert.match(decisionSource, /find\(\(decision\) => decision\.id === decisionId\) \|\| null/);
});

test("planned examples cannot be returned as Chosen", () => {
  assert.match(decisionSource, /export function getChosenDecisionsForWorkspace\(workspaceId: StaffordOsWorkspaceId\)/);
  assert.match(decisionSource, /decision\.approvalStatus === "chosen"/);
  assert.doesNotMatch(decisionSource, /sourceClassification: "planned_example"[\s\S]*?approvalStatus: "chosen"/);
});

test("Recommendation-only cannot appear as approved", () => {
  assert.doesNotMatch(decisionSource, /authorityClassification: "recommendation_only"[\s\S]*?approvalStatus: "chosen"/);
});

test("no create update delete approve reject or execute methods exist", () => {
  assert.doesNotMatch(decisionSource, /export function (create|update|delete|approve|reject|execute|save|set|mutate|persist)/);
  assert.doesNotMatch(decisionSource, /fetch\(|XMLHttpRequest|writeFile|prisma|\/api\//);
});

test("/os/decisions route and read-only surface exist", () => {
  assert.match(decisionPageSource, /DecisionSurface/);
  assert.match(decisionSurfaceSource, /Decisions and Why We Made Them/);
  assert.match(decisionSurfaceSource, /do not approve or execute work/);
});

test("Home and Knowledge link to decision memory without changing primary action", () => {
  assert.match(homeComponentSource, /href="\/os\/decisions"/);
  assert.match(homeComponentSource, /Decisions and Why We Made Them/);
  assert.match(knowledgePageSource, /href="\/os\/decisions"/);
  assert.match(knowledgePageSource, /Decisions and Why We Made Them/);
});

test("decision surface avoids forbidden authority and mutation paths", () => {
  const surfaceCopy = decisionSurfaceSource.toLowerCase();

  assert.doesNotMatch(surfaceCopy, /fetch\(|xmlhttprequest|\/api\/|prisma|writefile|approve decision|execute action/);
  assert.doesNotMatch(surfaceCopy, /ai decided|ai approved|autonomous decision/);
  assert.match(surfaceCopy, /no decisions are recorded here yet/);
});
