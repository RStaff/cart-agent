import assert from "node:assert/strict";
import test from "node:test";
import { createPackageResponseGuard } from "./packageResponseGuard.mjs";

test("late package responses cannot overwrite a newer engagement or snapshot selection", () => {
  const guard = createPackageResponseGuard();
  const engagementA = guard.begin("engagement-a");
  const engagementB = guard.begin("engagement-b");
  assert.equal(guard.accepts(engagementA, "engagement-a"), false);
  assert.equal(guard.accepts(engagementB, "engagement-b"), true);
  const snapshotA = guard.begin("engagement-b:snapshot-a");
  const snapshotB = guard.begin("engagement-b:snapshot-b");
  assert.equal(guard.accepts(snapshotA, "engagement-b:snapshot-a"), false);
  assert.equal(guard.accepts(snapshotB, "engagement-b:snapshot-b"), true);
});
