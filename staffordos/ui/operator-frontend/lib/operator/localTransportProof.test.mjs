import assert from "node:assert/strict";
import test from "node:test";
import { consumeLocalTransportProof, runWithLocalTransportProof } from "./localTransportProof.mjs";

test("local transport proof is request-scoped and one-use", async () => {
  assert.equal(consumeLocalTransportProof(), false);
  await runWithLocalTransportProof(async () => {
    assert.equal(consumeLocalTransportProof(), true);
    assert.equal(consumeLocalTransportProof(), false);
  });
  assert.equal(consumeLocalTransportProof(), false);
});
