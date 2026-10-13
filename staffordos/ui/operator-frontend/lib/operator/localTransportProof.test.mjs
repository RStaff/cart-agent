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

test("concurrent request contexts cannot consume one another's proof", async () => {
  const results = await Promise.all([1, 2].map(() => runWithLocalTransportProof(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    return [consumeLocalTransportProof(), consumeLocalTransportProof()];
  })));
  assert.deepEqual(results, [[true, false], [true, false]]);
});

test("server and separately bundled route modules share only the active request proof", async () => {
  const serverModule = await import("./localTransportProof.mjs?server-bundle");
  const routeModule = await import("./localTransportProof.mjs?route-bundle");
  assert.equal(await serverModule.runWithLocalTransportProof(async () => routeModule.consumeLocalTransportProof()), true);
  assert.equal(routeModule.consumeLocalTransportProof(), false);
});
