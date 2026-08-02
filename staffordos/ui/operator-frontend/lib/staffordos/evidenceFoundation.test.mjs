import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const evidencePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/evidenceFoundation.ts");
const evidencePagePath = path.join(root, "staffordos/ui/operator-frontend/app/os/evidence/page.tsx");
const evidenceSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/EvidenceSurface.tsx");
const actionSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/ActionSurface.tsx");
const decisionSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/DecisionSurface.tsx");
const homePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx");
const shellPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/StaffordOsShell.tsx");

const evidenceSource = readFileSync(evidencePath, "utf8");
const evidencePageSource = readFileSync(evidencePagePath, "utf8");
const evidenceSurfaceSource = readFileSync(evidenceSurfacePath, "utf8");
const actionSurfaceSource = readFileSync(actionSurfacePath, "utf8");
const decisionSurfaceSource = readFileSync(decisionSurfacePath, "utf8");
const homeSource = readFileSync(homePath, "utf8");
const shellSource = readFileSync(shellPath, "utf8");

function evidenceBlocksFor(workspaceId) {
  return evidenceSource
    .split(/\n  \{\n/)
    .filter((block) => block.includes(`workspaceId: "${workspaceId}"`));
}

test("Stafford Media has no more than six repository-backed evidence records", () => {
  const records = evidenceBlocksFor("stafford-media");

  assert.ok(records.length > 0);
  assert.ok(records.length <= 6);
  assert.ok(records.every((block) => /source: "repository_backed"/.test(block)));
});

test("Professional has no current evidence records", () => {
  assert.equal(evidenceBlocksFor("professional").length, 0);
});

test("Personal has no current evidence records", () => {
  assert.equal(evidenceBlocksFor("personal").length, 0);
});

test("every evidence record belongs to exactly one workspace", () => {
  for (const block of evidenceSource.split(/\n  \{\n/).filter((candidate) => /id: "[^"]+"/.test(candidate) && candidate.includes("workspaceId:"))) {
    const matches = block.match(/workspaceId: "/g) || [];
    assert.equal(matches.length, 1);
  }
});

test("every current evidence record explicitly references one Action and one Decision", () => {
  for (const block of evidenceBlocksFor("stafford-media")) {
    assert.match(block, /actionId: "[^"]+-action"/);
    assert.match(block, /decisionId: "s008-/);
  }
});

test("lookup by workspace works", () => {
  assert.match(evidenceSource, /export function getEvidenceForWorkspace\(workspaceId: StaffordOsWorkspaceId\)/);
});

test("lookup by ID works and unsupported IDs fail safely", () => {
  assert.match(evidenceSource, /export function getEvidenceById\(evidenceId: string \| null \| undefined\)/);
  assert.match(evidenceSource, /find\(\(evidence\) => evidence\.id === evidenceId\) \|\| null/);
});

test("lookup by Action uses explicit mappings only", () => {
  assert.match(evidenceSource, /export function getEvidenceForAction\(actionId: string\)/);
  assert.match(evidenceSource, /evidence\.actionId === actionId/);
  assert.doesNotMatch(evidenceSource, /title\.includes|summary\.includes|notes\.includes|supports\.includes/);
});

test("lookup by Decision uses explicit mappings only", () => {
  assert.match(evidenceSource, /export function getEvidenceForDecision\(decisionId: string\)/);
  assert.match(evidenceSource, /evidence\.decisionId === decisionId/);
});

test("no create update delete sync persist API database or AI methods exist", () => {
  assert.doesNotMatch(evidenceSource, /export function (create|update|delete|sync|save|set|mutate|persist)/);
  assert.doesNotMatch(evidenceSource, /fetch\(|XMLHttpRequest|writeFile|prisma|\/api\/|rankScore|scoreEvidence|reasonWithAi/);
});

test("/os/evidence route and read-only surface exist", () => {
  assert.match(evidencePageSource, /EvidenceSurface/);
  assert.match(evidenceSurfaceSource, /Why We Believe This/);
  assert.match(evidenceSurfaceSource, /Evidence before proof/);
  assert.doesNotMatch(evidenceSurfaceSource, /fetch\(|xmlhttprequest|\/api\/|prisma|writefile|create evidence|update evidence|delete evidence/);
});

test("Action surface displays supporting Evidence", () => {
  assert.match(actionSurfaceSource, /getEvidenceForAction\(action\.id\)/);
  assert.match(actionSurfaceSource, /Why we believe this/);
  assert.match(actionSurfaceSource, /href="\/os\/evidence"/);
});

test("Decision surface displays supporting Evidence", () => {
  assert.match(decisionSurfaceSource, /getEvidenceForDecision\(decision\.id\)/);
  assert.match(decisionSurfaceSource, /Supporting evidence/);
  assert.match(decisionSurfaceSource, /href="\/os\/evidence"/);
});

test("Home and shell link to Evidence without redesigning Home", () => {
  assert.match(homeSource, /Evidence behind actions/);
  assert.match(homeSource, /Why We Believe This/);
  assert.match(shellSource, /href="\/os\/evidence"/);
});

test("planned evidence surfaces expose no Stafford Media evidence", () => {
  assert.match(evidenceSurfaceSource, /No current evidence is connected here yet/);
  assert.match(evidenceSurfaceSource, /Stafford Media evidence is not shown here/);
  assert.doesNotMatch(evidenceSurfaceSource, /\/operator\/leads[\s\S]*PlannedWorkspaceEvidence/);
});
