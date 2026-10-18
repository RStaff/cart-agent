import assert from "node:assert/strict";
import test from "node:test";
import { createBlueprintDeliverableCommandRequest, createBlueprintDeliverableReadRequest } from "./blueprintDeliverableOperator.mjs";

const authority = {
  baseUrl: "http://127.0.0.1:3003",
  serviceKey: "synthetic-only-key",
  operatorSubject: "synthetic-ross-subject",
  permission: "staffordos.revenue_operations.write",
  engagementId: "cmu_step5b_synthetic",
};

test("deliverable proxy targets the exact collection and command paths", () => {
  const read = createBlueprintDeliverableReadRequest(authority);
  assert.equal(read.url, "http://127.0.0.1:3003/api/staffordos/blueprint-engagements/cmu_step5b_synthetic/deliverables");
  const command = createBlueprintDeliverableCommandRequest({ ...authority, expectedVersion: 0, command: "REGISTER_DRAFT", data: { identifier: "workflow_interview_current_state_map", owner: "Synthetic Ross" } });
  assert.match(command.url, /\/deliverables\/commands$/);
  assert.equal(command.headers["x-staffordos-operator-subject"], "synthetic-ross-subject");
  assert.doesNotMatch(command.body, /synthetic-actor|operatorSubject/);
});

test("proxy rejects unapproved delivery/release commands and invalid ids", () => {
  for (const command of ["RELEASE", "DELIVER", "TRANSITION"]) {
    assert.throws(() => createBlueprintDeliverableCommandRequest({ ...authority, expectedVersion: 0, command, data: { identifier: "workflow_interview_current_state_map" } }), /BLUEPRINT_DELIVERABLE_COMMAND_INVALID/);
  }
  assert.throws(() => createBlueprintDeliverableReadRequest({ ...authority, engagementId: "bad/id" }), /BLUEPRINT_ENGAGEMENT_ID_INVALID/);
});
