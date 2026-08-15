import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const page = readFileSync(path.resolve("staffordos/ui/operator-frontend/app/os/professional/evidence/page.tsx"), "utf8");

test("existing evidence route exposes bounded conflict-resolution mode", () => {
  assert.match(page, /params\.view === "conflicts"/);
  assert.match(page, /buildConflictReviewQueue/);
  assert.match(page, /loadConflictResolutionDecisions/);
  assert.match(page, /Conflict resolution<\/span><strong>\{conflictCompletion\.completed\}/);
  assert.match(page, /High-value review<\/span><strong>\{progress\.operatorDecisions\}/);
  assert.match(page, /name="conflictMode"/);
  assert.match(page, /appendConflictResolutionDecision/);
  assert.match(page, /This changes evidence authority only/);
  assert.match(page, /No CareerFact rewrite and no CareerEvidence creation/);
  assert.match(page, /Next unreviewed/);
});
