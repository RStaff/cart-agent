import assert from "node:assert/strict";
import test from "node:test";
import { hasAdditionalMatchEvidence, visibleMatchExplanationGroups } from "./matchExplanation.mjs";

test("empty match sections are omitted while meaningful states remain visible", () => {
  assert.deepEqual(visibleMatchExplanationGroups([{ state: "DIRECT" }]), [["DIRECT", "What looks strong"]]);
  assert.deepEqual(visibleMatchExplanationGroups([{ state: "DIRECT" }, { state: "UNKNOWN" }]), [
    ["DIRECT", "What looks strong"],
    ["UNKNOWN", "What needs more evidence"],
  ]);
});

test("neutral empty summary is only needed when no additional evidence state exists", () => {
  assert.equal(hasAdditionalMatchEvidence([{ state: "DIRECT" }]), false);
  assert.equal(hasAdditionalMatchEvidence([{ state: "DIRECT" }, { state: "TRANSFERABLE" }]), true);
  assert.equal(hasAdditionalMatchEvidence([{ state: "DIRECT" }, { state: "SCOPE_BLOCKED" }]), true);
});
