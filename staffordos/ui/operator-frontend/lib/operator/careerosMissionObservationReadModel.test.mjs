import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  CAREEROS_OBSERVATION_MISSION_ID,
  buildCareerOsMissionObservation,
  loadCareerOsMissionObservation,
} from "./careerosMissionObservationReadModel.mjs";

function authority(overrides = {}) {
  return {
    mission: CAREEROS_OBSERVATION_MISSION_ID,
    status: "IMPLEMENTED_PENDING_GOVERNED_DEPLOYMENT",
    manual_acceptance_required: true,
    ...overrides,
  };
}

test("builds the verified mission as pending deployment and read-only", () => {
  const result = buildCareerOsMissionObservation({ authorityRecord: authority() });
  assert.equal(result.status, "PENDING_DEPLOYMENT");
  assert.equal(result.readOnly, true);
  assert.deepEqual(result.authority.allowedMutations, []);
  assert.equal(result.approval.state, "PENDING");
  assert.match(result.blockers.join(" "), /governed deployment/i);
});

test("preserves supported, blocked, and unknown status semantics", () => {
  const pending = buildCareerOsMissionObservation({ authorityRecord: authority() });
  assert.equal(pending.authorityStatus, "IMPLEMENTED_PENDING_GOVERNED_DEPLOYMENT");
  assert.equal(pending.status, "PENDING_DEPLOYMENT");
  const blocked = buildCareerOsMissionObservation({ authorityRecord: authority({ status: "BLOCKED" }) });
  assert.equal(blocked.authorityStatus, "BLOCKED");
  assert.equal(blocked.status, "BLOCKED");
  assert.equal(blocked.steps.find((step) => step.id === "review").state, "BLOCKED");
  assert.match(blocked.blockers.join(" "), /recorded as blocked/i);
  assert.equal(buildCareerOsMissionObservation({ authorityRecord: authority({ status: "IMPLEMENTED" }) }).status, "COMPLETE");
  assert.equal(buildCareerOsMissionObservation({ authorityRecord: authority({ status: "future-status" }) }).status, "UNAVAILABLE");
  assert.equal(buildCareerOsMissionObservation({ authorityRecord: authority({ status: null }) }).status, "UNAVAILABLE");
  assert.equal(buildCareerOsMissionObservation({ authorityRecord: authority({ status: undefined }) }).status, "UNAVAILABLE");
});

test("handles explicit approval metadata and fails closed otherwise", () => {
  assert.equal(buildCareerOsMissionObservation({ authorityRecord: authority({ manual_acceptance_required: true }) }).approval.state, "PENDING");
  assert.equal(buildCareerOsMissionObservation({ authorityRecord: authority({ manual_acceptance_required: false }) }).approval.state, "NOT_REQUIRED");
  for (const value of [undefined, null, "true", 1, {}]) {
    const result = buildCareerOsMissionObservation({ authorityRecord: authority({ manual_acceptance_required: value }) });
    assert.equal(result.approval.state, "UNAVAILABLE");
    assert.equal(result.approval.required, null);
  }
});

test("does not infer repository or worktree identity", () => {
  const result = buildCareerOsMissionObservation({ authorityRecord: authority() });
  assert.equal(result.authority.repository, "UNAVAILABLE");
  assert.equal(result.authority.worktree, "UNAVAILABLE");
  assert.equal(result.authority.branch, null);
});

test("returns null for an unknown mission", () => {
  assert.equal(buildCareerOsMissionObservation({ authorityRecord: authority({ mission: "OTHER" }) }), null);
});

test("preserves explicit unavailable validation and rollback states", () => {
  const result = buildCareerOsMissionObservation({ authorityRecord: authority() });
  assert.equal(result.validations[1].result, "UNAVAILABLE");
  assert.equal(result.rollback.status, "UNAVAILABLE");
  assert.deepEqual(result.changedFiles, []);
});

test("includes only bounded aggregate CareerOS context", () => {
  const result = buildCareerOsMissionObservation({
    authorityRecord: authority(),
    operationsReadModel: { summary: { totalBetaUsers: 2, usersWithDiscoveryObserved: 1, totalOpportunities: 3, totalEvaluations: 4 } },
  });
  assert.deepEqual(result.aggregateCareerOs, { totalBetaUsers: 2, usersWithDiscoveryObserved: 1, totalOpportunities: 3, totalEvaluations: 4 });
  assert.equal("users" in result, false);
});

test("loads only the authoritative mission artifact", async () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "careeros-observation-"));
  const authorityPath = path.join(repoRoot, "staffordos/ui/operator-frontend/careeros-beta");
  fs.mkdirSync(authorityPath, { recursive: true });
  fs.writeFileSync(path.join(authorityPath, "CAREEROS_V1_P1_DAILY_JOB_SEARCH_WORKSPACE_ACCEPTANCE.json"), JSON.stringify(authority()));
  const result = await loadCareerOsMissionObservation({ repoRoot });
  assert.equal(result.missionId, CAREEROS_OBSERVATION_MISSION_ID);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});
