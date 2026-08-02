import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const proofPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/proofFoundation.ts");
const proofPagePath = path.join(root, "staffordos/ui/operator-frontend/app/os/proof/page.tsx");
const proofSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/ProofSurface.tsx");
const actionSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/ActionSurface.tsx");
const decisionSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/DecisionSurface.tsx");
const objectiveSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/ObjectiveSurface.tsx");
const evidenceSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/EvidenceSurface.tsx");
const homePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx");
const shellPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/StaffordOsShell.tsx");

const proofSource = readFileSync(proofPath, "utf8");
const proofPageSource = readFileSync(proofPagePath, "utf8");
const proofSurfaceSource = readFileSync(proofSurfacePath, "utf8");
const actionSurfaceSource = readFileSync(actionSurfacePath, "utf8");
const decisionSurfaceSource = readFileSync(decisionSurfacePath, "utf8");
const objectiveSurfaceSource = readFileSync(objectiveSurfacePath, "utf8");
const evidenceSurfaceSource = readFileSync(evidenceSurfacePath, "utf8");
const homeSource = readFileSync(homePath, "utf8");
const shellSource = readFileSync(shellPath, "utf8");

function proofBlocksFor(workspaceId) {
  return proofSource
    .split(/\n  \{\n/)
    .filter((block) => block.includes(`workspaceId: "${workspaceId}"`));
}

test("Stafford Media has no more than six current Proof records", () => {
  const proofs = proofBlocksFor("stafford-media");

  assert.ok(proofs.length > 0);
  assert.ok(proofs.length <= 6);
});

test("every current Proof is repository-backed", () => {
  assert.ok(proofBlocksFor("stafford-media").every((block) => /sourceClassification: "repository_backed"/.test(block)));
});

test("every Proof has exact source-artifact references", () => {
  assert.ok(
    proofBlocksFor("stafford-media").every((block) =>
      /sourceArtifacts: \[[\s\S]*staffordos\/architecture\/S008_/.test(block),
    ),
  );
});

test("every Proof belongs to exactly one workspace", () => {
  for (const block of proofSource.split(/\n  \{\n/).filter((candidate) => /id: "[^"]+"/.test(candidate) && candidate.includes("workspaceId:"))) {
    const matches = block.match(/workspaceId: "/g) || [];
    assert.equal(matches.length, 1);
  }
});

test("every Proof has authority classification", () => {
  assert.ok(proofBlocksFor("stafford-media").every((block) => /authorityClassification: "/.test(block)));
});

test("every Proof distinguishes expected result from observed outcome", () => {
  for (const block of proofBlocksFor("stafford-media")) {
    const expected = block.match(/expectedResult: "([^"]+)"/)?.[1];
    const observed = block.match(/observedOutcome: "([^"]+)"/)?.[1];

    assert.ok(expected);
    assert.ok(observed);
    assert.notEqual(expected, observed);
  }
});

test("Professional has no current Proof", () => {
  assert.equal(proofBlocksFor("professional").length, 0);
});

test("Personal has no current Proof", () => {
  assert.equal(proofBlocksFor("personal").length, 0);
});

test("no Stafford Media Proof leaks across workspaces", () => {
  assert.doesNotMatch(proofSource, /workspaceId: "professional"[\s\S]*stafford-media/);
  assert.doesNotMatch(proofSource, /workspaceId: "personal"[\s\S]*stafford-media/);
});

test("lookup by ID works and unsupported IDs fail safely", () => {
  assert.match(proofSource, /export function getProofById\(proofId: string \| null \| undefined\)/);
  assert.match(proofSource, /find\(\(proof\) => proof\.id === proofId\) \|\| null/);
});

test("lookup by workspace works", () => {
  assert.match(proofSource, /export function getProofForWorkspace\(workspaceId: StaffordOsWorkspaceId\)/);
});

test("lookup by Action uses explicit mappings only", () => {
  assert.match(proofSource, /export function getProofForAction\(actionId: string\)/);
  assert.match(proofSource, /proof\.actionId === actionId/);
  assert.doesNotMatch(proofSource, /title\.includes|summary\.includes|notes\.includes|observedOutcome\.includes/);
});

test("lookup by Decision uses explicit mappings only", () => {
  assert.match(proofSource, /export function getProofForDecision\(decisionId: string\)/);
  assert.match(proofSource, /proof\.decisionId === decisionId/);
});

test("lookup by Objective uses explicit mappings only", () => {
  assert.match(proofSource, /export function getProofForObjective\(objectiveId: string\)/);
  assert.match(proofSource, /proof\.objectiveId === objectiveId/);
});

test("planned examples cannot be returned as Verified", () => {
  assert.match(proofSource, /export function getVerifiedProofForWorkspace\(workspaceId: StaffordOsWorkspaceId\)/);
  assert.match(proofSource, /proof\.verificationStatus === "verified"/);
  assert.doesNotMatch(proofSource, /sourceClassification: "planned_example"[\s\S]*verificationStatus: "verified"/);
});

test("Partially proven cannot appear as Verified", () => {
  assert.match(proofSource, /partially_proven: "Partially proven"/);
  assert.doesNotMatch(proofSource, /verificationStatus: "partially_proven"[\s\S]*verificationStatus: "verified"/);
});

test("no create update delete verify reject complete persist API database provider or AI methods exist", () => {
  assert.doesNotMatch(proofSource, /export function (create|update|delete|verify|reject|complete|save|set|mutate|persist|sync)/);
  assert.doesNotMatch(proofSource, /fetch\(|XMLHttpRequest|writeFile|prisma|\/api\/|providerCall|rankScore|reasonWithAi|completeAction/);
});

test("/os/proof route and read-only surface exist", () => {
  assert.match(proofPageSource, /ProofSurface/);
  assert.match(proofSurfaceSource, /What Has Been Proven/);
  assert.match(proofSurfaceSource, /Expected result/);
  assert.match(proofSurfaceSource, /What happened/);
  assert.match(proofSurfaceSource, /What proves it/);
  assert.doesNotMatch(proofSurfaceSource.toLowerCase(), /proof registry| entity| resolver|persistence|state machine/);
});

test("Action surface shows Proof without completing Actions", () => {
  assert.match(actionSurfaceSource, /getProofForAction\(action\.id\)/);
  assert.match(actionSurfaceSource, /Proof status/);
  assert.match(actionSurfaceSource, /Not yet proven/);
  assert.match(actionSurfaceSource, /href="\/os\/proof"/);
  assert.doesNotMatch(actionSurfaceSource, /completeAction|action\.status =|mark as complete/i);
});

test("Decision and Objective surfaces show Proof through explicit links", () => {
  assert.match(decisionSurfaceSource, /getProofForDecision\(decision\.id\)/);
  assert.match(objectiveSurfaceSource, /getProofForObjective\(objective\.id\)/);
  assert.match(decisionSurfaceSource, /href="\/os\/proof"/);
  assert.match(objectiveSurfaceSource, /href="\/os\/proof"/);
  assert.doesNotMatch(objectiveSurfaceSource, /progress|percentage|objective\.status =/i);
});

test("Evidence surface distinguishes Evidence from resulting Proof", () => {
  assert.match(evidenceSurfaceSource, /getProofForAction\(evidence\.actionId\)/);
  assert.match(evidenceSurfaceSource, /Resulting proof/);
  assert.match(evidenceSurfaceSource, /Evidence explains why an action is worth considering/);
  assert.match(evidenceSurfaceSource, /Proof comes later/);
});

test("Home and shell link to Proof without claiming live outcome measurement", () => {
  assert.match(homeSource, /Proof status/);
  assert.match(homeSource, /What Has Been Proven/);
  assert.match(shellSource, /href="\/os\/proof"/);
  assert.doesNotMatch(homeSource, /business-health score|dynamically measures outcomes|mark as complete|completeAction/i);
});

test("planned proof surfaces expose no Stafford Media Proof", () => {
  assert.match(proofSurfaceSource, /No current proof is connected here yet/);
  assert.match(proofSurfaceSource, /Stafford Media proof is not shown here/);
  assert.doesNotMatch(proofSurfaceSource, /\/operator\/leads[\s\S]*PlannedWorkspaceProof/);
});
