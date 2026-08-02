import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const actionPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts");
const actionPagePath = path.join(root, "staffordos/ui/operator-frontend/app/os/actions/page.tsx");
const actionSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/ActionSurface.tsx");
const homeModelPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/homePresentation.ts");
const homeComponentPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx");

const actionSource = readFileSync(actionPath, "utf8");
const actionPageSource = readFileSync(actionPagePath, "utf8");
const actionSurfaceSource = readFileSync(actionSurfacePath, "utf8");
const homeModelSource = readFileSync(homeModelPath, "utf8");
const homeComponentSource = readFileSync(homeComponentPath, "utf8");

function actionBlocksFor(workspaceId) {
  return actionSource
    .split(/\n  \{\n/)
    .filter((block) => block.includes(`workspaceId: "${workspaceId}"`));
}

test("Stafford Media has no more than six repository-backed Actions", () => {
  const staffordActions = actionBlocksFor("stafford-media");

  assert.ok(staffordActions.length > 0);
  assert.ok(staffordActions.length <= 6);
  assert.ok(staffordActions.every((block) => /source: "repository_backed"/.test(block)));
});

test("Professional has no current Actions", () => {
  assert.equal(actionBlocksFor("professional").length, 0);
});

test("Personal has no current Actions", () => {
  assert.equal(actionBlocksFor("personal").length, 0);
});

test("every Action belongs to exactly one workspace", () => {
  for (const block of actionSource.split(/\n  \{\n/).filter((candidate) => /id: "[^"]+"/.test(candidate) && candidate.includes("workspaceId:"))) {
    const matches = block.match(/workspaceId: "/g) || [];
    assert.equal(matches.length, 1);
  }
});

test("every Action explicitly references one Objective and one Decision", () => {
  for (const block of actionBlocksFor("stafford-media")) {
    assert.match(block, /objectiveId: "stafford-media-/);
    assert.match(block, /decisionId: "s008-/);
  }
});

test("lookup by workspace works", () => {
  assert.match(actionSource, /export function getActionsForWorkspace\(workspaceId: StaffordOsWorkspaceId\)/);
});

test("lookup by ID works and unsupported IDs fail safely", () => {
  assert.match(actionSource, /export function getActionById\(actionId: string \| null \| undefined\)/);
  assert.match(actionSource, /find\(\(action\) => action\.id === actionId\) \|\| null/);
});

test("lookup by Objective uses explicit mappings only", () => {
  assert.match(actionSource, /export function getActionsForObjective\(objectiveId: string\)/);
  assert.match(actionSource, /action\.objectiveId === objectiveId/);
  assert.doesNotMatch(actionSource, /title\.includes|summary\.includes|reason\.includes/);
});

test("lookup by Decision uses explicit mappings only", () => {
  assert.match(actionSource, /export function getActionsForDecision\(decisionId: string\)/);
  assert.match(actionSource, /action\.decisionId === decisionId/);
});

test("primary Action lookup is static and available now", () => {
  assert.match(actionSource, /export function getPrimaryAction\(workspaceId: StaffordOsWorkspaceId\)/);
  assert.match(actionSource, /priorityClassification === "primary"/);
  assert.match(actionSource, /status === "available_now"/);
});

test("no create update delete execute complete approve API database or AI methods exist", () => {
  assert.doesNotMatch(actionSource, /export function (create|update|delete|execute|complete|approve|save|set|mutate|persist)/);
  assert.doesNotMatch(actionSource, /fetch\(|XMLHttpRequest|writeFile|prisma|\/api\/|rankScore|scoreAction|automaticPriority/);
});

test("/os/actions route and read-only surface exist", () => {
  assert.match(actionPageSource, /ActionSurface/);
  assert.match(actionSurfaceSource, /What To Do Next/);
  assert.match(actionSurfaceSource, /not live ranking, automation, or execution/);
  assert.doesNotMatch(actionSurfaceSource, /fetch\(|xmlhttprequest|\/api\/|prisma|writefile|execute action|approve action/);
});

test("Professional and Personal planned Action surfaces expose no Stafford Media actions", () => {
  assert.match(actionSurfaceSource, /No current actions are connected here yet/);
  assert.match(actionSurfaceSource, /Stafford Media actions are not shown here/);
  assert.doesNotMatch(actionSurfaceSource, /\/operator\/leads[\s\S]*PlannedWorkspaceActions/);
});

test("Home primary card comes from Action Registry", () => {
  assert.match(homeModelSource, /getPrimaryAction\(DEFAULT_STAFFORDOS_WORKSPACE_ID\)/);
  assert.match(homeModelSource, /actionFromRegisteredAction/);
  assert.match(homeComponentSource, /href="\/os\/actions"/);
  assert.match(homeComponentSource, /What To Do Next/);
});
