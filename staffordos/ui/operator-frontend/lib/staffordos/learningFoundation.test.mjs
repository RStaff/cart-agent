import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const learningPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/learningFoundation.ts");
const learningPagePath = path.join(root, "staffordos/ui/operator-frontend/app/os/learning/page.tsx");
const learningSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/LearningSurface.tsx");
const proofPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/proofFoundation.ts");
const proofSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/ProofSurface.tsx");
const actionSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/ActionSurface.tsx");
const decisionSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/DecisionSurface.tsx");
const objectiveSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/ObjectiveSurface.tsx");
const knowledgePath = path.join(root, "staffordos/ui/operator-frontend/app/os/knowledge/page.tsx");
const homePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx");

const learningSource = readFileSync(learningPath, "utf8");
const learningPageSource = readFileSync(learningPagePath, "utf8");
const learningSurfaceSource = readFileSync(learningSurfacePath, "utf8");
const proofSource = readFileSync(proofPath, "utf8");
const proofSurfaceSource = readFileSync(proofSurfacePath, "utf8");
const actionSurfaceSource = readFileSync(actionSurfacePath, "utf8");
const decisionSurfaceSource = readFileSync(decisionSurfacePath, "utf8");
const objectiveSurfaceSource = readFileSync(objectiveSurfacePath, "utf8");
const knowledgeSource = readFileSync(knowledgePath, "utf8");
const homeSource = readFileSync(homePath, "utf8");

function learningBlocksFor(workspaceId) {
  return learningSource
    .split(/\n  \{\n/)
    .filter((block) => block.includes(`workspaceId: "${workspaceId}"`));
}

test("Stafford Media has no more than six current Learning records", () => {
  const records = learningBlocksFor("stafford-media");

  assert.ok(records.length > 0);
  assert.ok(records.length <= 6);
});

test("every current Learning record is repository-backed", () => {
  assert.ok(learningBlocksFor("stafford-media").every((block) => /sourceClassification: "repository_backed"/.test(block)));
});

test("every current Learning record references exact source artifacts", () => {
  assert.ok(
    learningBlocksFor("stafford-media").every((block) =>
      /sourceArtifacts: \[[\s\S]*staffordos\/architecture\/S008_/.test(block),
    ),
  );
});

test("every current Learning record has supporting Proof", () => {
  assert.ok(learningBlocksFor("stafford-media").every((block) => /proofIds: \["proof-/.test(block)));
});

test("every Learning record belongs to exactly one workspace", () => {
  for (const block of learningSource.split(/\n  \{\n/).filter((candidate) => /id: "[^"]+"/.test(candidate) && candidate.includes("workspaceId:"))) {
    const matches = block.match(/workspaceId: "/g) || [];
    assert.equal(matches.length, 1);
  }
});

test("every Learning record states applicability and non-applicability", () => {
  for (const block of learningBlocksFor("stafford-media")) {
    assert.match(block, /applicability: "/);
    assert.match(block, /nonApplicability: "/);
  }
});

test("every Learning record has authority classification", () => {
  assert.ok(learningBlocksFor("stafford-media").every((block) => /authorityClassification: "/.test(block)));
});

test("Professional has no current Learning records", () => {
  assert.equal(learningBlocksFor("professional").length, 0);
});

test("Personal has no current Learning records", () => {
  assert.equal(learningBlocksFor("personal").length, 0);
});

test("no Stafford Media Learning leaks across workspaces", () => {
  assert.doesNotMatch(learningSource, /workspaceId: "professional"[\s\S]*stafford-media/);
  assert.doesNotMatch(learningSource, /workspaceId: "personal"[\s\S]*stafford-media/);
});

test("lookup by ID works and unsupported IDs fail safely", () => {
  assert.match(learningSource, /export function getLearningById\(learningId: string \| null \| undefined\)/);
  assert.match(learningSource, /find\(\(learning\) => learning\.id === learningId\) \|\| null/);
});

test("lookup by workspace works", () => {
  assert.match(learningSource, /export function getLearningForWorkspace\(workspaceId: StaffordOsWorkspaceId\)/);
});

test("lookup by Proof uses explicit mappings only", () => {
  assert.match(learningSource, /export function getLearningForProof\(proofId: string\)/);
  assert.match(learningSource, /learning\.proofIds\.includes\(proofId\)/);
  assert.doesNotMatch(learningSource, /title\.includes|operatorFacingSummary\.includes|lesson\.includes|observedOutcome\.includes/);
});

test("lookup by Action uses explicit mappings only", () => {
  assert.match(learningSource, /export function getLearningForAction\(actionId: string\)/);
  assert.match(learningSource, /learning\.actionId === actionId/);
});

test("lookup by Decision uses explicit mappings only", () => {
  assert.match(learningSource, /export function getLearningForDecision\(decisionId: string\)/);
  assert.match(learningSource, /learning\.decisionId === decisionId/);
});

test("lookup by Objective uses explicit mappings only", () => {
  assert.match(learningSource, /export function getLearningForObjective\(objectiveId: string\)/);
  assert.match(learningSource, /learning\.objectiveId === objectiveId/);
});

test("planned examples cannot be returned as Confirmed", () => {
  assert.match(learningSource, /export function getConfirmedLearningForWorkspace\(workspaceId: StaffordOsWorkspaceId\)/);
  assert.match(learningSource, /learning\.status === "confirmed_lesson"/);
  assert.match(learningSource, /learning\.sourceClassification !== "planned_example"/);
});

test("AI-proposed Learning cannot be returned as Confirmed", () => {
  assert.match(learningSource, /learning\.sourceClassification !== "ai_proposed"/);
  assert.doesNotMatch(learningSource, /sourceClassification: "ai_proposed"[\s\S]*status: "confirmed_lesson"/);
});

test("no create update delete confirm reject apply promote persist embeddings API database or AI methods exist", () => {
  assert.doesNotMatch(learningSource, /export function (create|update|delete|confirm|reject|supersede|apply|promote|save|set|mutate|persist|sync)/);
  assert.doesNotMatch(learningSource, /fetch\(|XMLHttpRequest|writeFile|prisma|\/api\/|embedding|vector|semanticSearch|reasonWithAi|rankScore|promoteToPolicy/);
});

test("/os/learning route and read-only surface exist", () => {
  assert.match(learningPageSource, /LearningSurface/);
  assert.match(learningSurfaceSource, /What We Have Learned/);
  assert.match(learningSurfaceSource, /What happened/);
  assert.match(learningSurfaceSource, /What we learned/);
  assert.match(learningSurfaceSource, /Where this applies/);
  assert.match(learningSurfaceSource, /Where this may not apply/);
  assert.doesNotMatch(learningSurfaceSource.toLowerCase(), /learning registry| entity| embedding| vector| resolver|persistence|knowledge graph node|automatic feedback loop/);
});

test("Proof surface shows Learning without changing verification", () => {
  assert.match(proofSource, /lesson_recorded: "Lesson recorded"/);
  assert.match(proofSurfaceSource, /getLearningForProof\(proof\.id\)/);
  assert.match(proofSurfaceSource, /Lesson captured/);
  assert.match(proofSurfaceSource, /No lesson recorded yet/);
  assert.match(proofSurfaceSource, /href="\/os\/learning"/);
  assert.doesNotMatch(proofSurfaceSource, /proof\.verificationStatus =|verifyProof|confirmLearning|generateLesson/);
});

test("Action Decision and Objective surfaces show Learning through explicit links", () => {
  assert.match(actionSurfaceSource, /getLearningForAction\(action\.id\)/);
  assert.match(decisionSurfaceSource, /getLearningForDecision\(decision\.id\)/);
  assert.match(objectiveSurfaceSource, /getLearningForObjective\(objective\.id\)/);
  assert.match(actionSurfaceSource, /href="\/os\/learning"/);
  assert.match(decisionSurfaceSource, /href="\/os\/learning"/);
  assert.match(objectiveSurfaceSource, /href="\/os\/learning"/);
  assert.doesNotMatch(actionSurfaceSource, /priorityClassification =|rankScore|automaticPriority/);
  assert.doesNotMatch(objectiveSurfaceSource, /objective\.status =|completed|progress percentage/i);
});

test("Knowledge and Home provide read-only paths to Learning", () => {
  assert.match(knowledgeSource, /Decisions and Why We Made Them/);
  assert.match(knowledgeSource, /Why We Believe This/);
  assert.match(knowledgeSource, /What Has Been Proven/);
  assert.match(knowledgeSource, /What We Have Learned/);
  assert.match(homeSource, /Lessons captured/);
  assert.match(homeSource, /href="\/os\/learning"/);
  assert.doesNotMatch(homeSource, /automatically influencing|automatic priority|promote to policy/i);
});

test("planned Learning surfaces expose no Stafford Media Learning", () => {
  assert.match(learningSurfaceSource, /No current lessons are connected here yet/);
  assert.match(learningSurfaceSource, /Stafford Media learning is not shown here/);
  assert.doesNotMatch(learningSurfaceSource, /\/operator\/leads[\s\S]*PlannedWorkspaceLearning/);
});
