import test from "node:test";
import assert from "node:assert/strict";
import {
  BLUEPRINT_ONBOARDING_PERMISSION,
  createBlueprintCommandRequest,
  createBlueprintReadRequest,
} from "./blueprintOnboardingOperator.mjs";

const valid = {
  baseUrl: "https://api.example.test/",
  serviceKey: "server-only-key",
  operatorSubject: "ross-subject",
  permission: BLUEPRINT_ONBOARDING_PERMISSION,
};

test("Blueprint proxy keeps service credentials server-side and derives the actor", () => {
  const request = createBlueprintCommandRequest({
    ...valid,
    engagementId: "engagement_1",
    expectedVersion: 4,
    command: "TRANSITION",
    data: { nextState: "READY_FOR_INTERVIEW", actorSubject: "browser-spoof" },
  });
  assert.equal(request.headers["x-internal-api-key"], "server-only-key");
  assert.equal(request.headers["x-staffordos-operator-subject"], "ross-subject");
  assert.equal(request.headers["x-staffordos-operator-permission"], BLUEPRINT_ONBOARDING_PERMISSION);
  assert.deepEqual(JSON.parse(request.body), {
    expectedVersion: 4,
    command: "TRANSITION",
    data: { nextState: "READY_FOR_INTERVIEW" },
  });
});

test("Blueprint proxy fails closed for missing identity, permission, configuration, and malformed input", () => {
  assert.throws(() => createBlueprintReadRequest({ ...valid, operatorSubject: "" }), /OPERATOR_IDENTITY_MISSING/);
  assert.throws(() => createBlueprintReadRequest({ ...valid, permission: "staffordos.revenue_operations.read" }), /OPERATOR_PERMISSION_MISSING/);
  assert.throws(() => createBlueprintReadRequest({ ...valid, serviceKey: "" }), /BLUEPRINT_ONBOARDING_SOURCE_UNCONFIGURED/);
  assert.throws(() => createBlueprintReadRequest({ ...valid, engagementId: "bad/id" }), /BLUEPRINT_ENGAGEMENT_ID_INVALID/);
  assert.throws(() => createBlueprintCommandRequest({ ...valid, engagementId: "engagement_1", expectedVersion: -1, command: "TRANSITION", data: {} }), /BLUEPRINT_ONBOARDING_VERSION_INVALID/);
  assert.throws(() => createBlueprintCommandRequest({ ...valid, engagementId: "engagement_1", expectedVersion: 0, command: "SEND_EMAIL", data: {} }), /BLUEPRINT_ONBOARDING_COMMAND_INVALID/);
});
