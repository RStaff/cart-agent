import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const objectivePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.ts");
const objectivePagePath = path.join(root, "staffordos/ui/operator-frontend/app/os/objectives/page.tsx");
const objectiveSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/ObjectiveSurface.tsx");
const shellPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/StaffordOsShell.tsx");
const homeModelPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/homePresentation.ts");
const unifiedHomePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx");
const nextActionCardPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/NextActionCard.tsx");
const actionPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts");

const objectiveSource = readFileSync(objectivePath, "utf8");
const objectivePageSource = readFileSync(objectivePagePath, "utf8");
const objectiveSurfaceSource = readFileSync(objectiveSurfacePath, "utf8");
const shellSource = readFileSync(shellPath, "utf8");
const homeModelSource = readFileSync(homeModelPath, "utf8");
const unifiedHomeSource = readFileSync(unifiedHomePath, "utf8");
const nextActionCardSource = readFileSync(nextActionCardPath, "utf8");
const actionSource = readFileSync(actionPath, "utf8");

function objectiveBlocksFor(workspaceId) {
  return objectiveSource
    .split(/\n  \{\n/)
    .filter((block) => block.includes(`workspaceId: "${workspaceId}"`));
}

test("Stafford Media has at most three initial current objectives", () => {
  const activeStaffordObjectives = objectiveBlocksFor("stafford-media").filter((block) => /status: "active"/.test(block));

  assert.ok(activeStaffordObjectives.length > 0);
  assert.ok(activeStaffordObjectives.length <= 3);
});

test("every current objective has repository-backed source classification", () => {
  const currentBlocks = objectiveBlocksFor("stafford-media").filter((block) => /status: "active"/.test(block));

  assert.ok(currentBlocks.every((block) => /source: "repository_backed"/.test(block)));
});

test("every objective belongs to exactly one workspace", () => {
  for (const block of objectiveSource.split(/\n  \{\n/).filter((candidate) => /id: "[^"]+"/.test(candidate) && candidate.includes("workspaceId:"))) {
    const matches = block.match(/workspaceId: "/g) || [];
    assert.equal(matches.length, 1);
  }
});

test("Professional has no active runtime objectives", () => {
  assert.ok(objectiveBlocksFor("professional").length > 0);
  assert.ok(objectiveBlocksFor("professional").every((block) => /status: "planned"/.test(block)));
  assert.ok(objectiveBlocksFor("professional").every((block) => /source: "planned_example"/.test(block)));
});

test("Personal has no active runtime objectives", () => {
  assert.ok(objectiveBlocksFor("personal").length > 0);
  assert.ok(objectiveBlocksFor("personal").every((block) => /status: "planned"/.test(block)));
  assert.ok(objectiveBlocksFor("personal").every((block) => /source: "planned_example"/.test(block)));
});

test("Professional and Personal do not expose Stafford Media objectives as active", () => {
  const plannedBlocks = `${objectiveBlocksFor("professional").join("\n")}\n${objectiveBlocksFor("personal").join("\n")}`;

  assert.doesNotMatch(plannedBlocks, /stafford-media-operating-loop/);
  assert.doesNotMatch(plannedBlocks, /stafford-media-convert-opportunities/);
  assert.doesNotMatch(plannedBlocks, /stafford-media-complete-work-with-proof/);
  assert.doesNotMatch(plannedBlocks, /status: "active"/);
});

test("objective lookup by workspace exists", () => {
  assert.match(objectiveSource, /export function getObjectivesForWorkspace\(workspaceId: StaffordOsWorkspaceId\)/);
});

test("objective lookup by ID fails safely", () => {
  assert.match(objectiveSource, /export function getObjectiveById\(objectiveId: string \| null \| undefined\)/);
  assert.match(objectiveSource, /\|\| null/);
});

test("capability alignment returns only explicit mappings", () => {
  assert.match(objectiveSource, /export function getObjectivesForCapability\(capabilityId: string\)/);
  assert.match(objectiveSource, /objective\.relatedCapabilities\.includes\(capabilityId\)/);
  assert.doesNotMatch(objectiveSource, /operatorQuestion|description\.includes|title\.includes/);
});

test("planned examples cannot be returned as active", () => {
  assert.match(objectiveSource, /export function getActiveObjectivesForWorkspace\(workspaceId: StaffordOsWorkspaceId\)/);
  assert.match(objectiveSource, /objective\.status === "active"/);
});

test("no write method exists in the registry", () => {
  assert.doesNotMatch(objectiveSource, /export function (create|update|delete|save|set|mutate|persist)/);
  assert.doesNotMatch(objectiveSource, /fetch\(|XMLHttpRequest|writeFile|prisma|\/api\//);
});

test("Stafford Media Home primary action references a valid Objective", () => {
  assert.match(homeModelSource, /getPrimaryAction\(DEFAULT_STAFFORDOS_WORKSPACE_ID\)/);
  assert.match(homeModelSource, /getObjectiveById\(action\.objectiveId\)/);
  assert.match(actionSource, /id: "start-my-day-home-action"[\s\S]*objectiveId: "stafford-media-operating-loop"/);
  assert.match(homeModelSource, /supportedObjectiveTitle: objective\?\.title/);
  assert.match(unifiedHomeSource, /supports=\{primaryAction\.supportedObjectiveTitle\}/);
  assert.match(nextActionCardSource, /Supports:/);
});

test("/os/objectives route and navigation exist", () => {
  assert.match(objectivePageSource, /ObjectiveSurface/);
  assert.match(shellSource, /href="\/os\/objectives"/);
  assert.match(shellSource, /What We Are Working Toward/);
});

test("objective surface stays read-only and avoids live measurement claims", () => {
  const surfaceCopy = objectiveSurfaceSource.toLowerCase();

  assert.doesNotMatch(surfaceCopy, /fetch\(|xmlhttprequest|\/api\/|prisma|writefile|create objective|update objective|delete objective/);
  assert.match(surfaceCopy, /live measurement and automatic objective/);
  assert.match(surfaceCopy, /no active objectives or live work data are connected/);
});
