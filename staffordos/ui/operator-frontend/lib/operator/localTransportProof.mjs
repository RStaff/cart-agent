import { AsyncLocalStorage } from "node:async_hooks";

// Next bundles route modules separately from the custom server. Keep one
// process-local authority so the request context crosses that bundle edge,
// while AsyncLocalStorage still binds the proof to one request execution.
const storageKey = Symbol.for("staffordos.localTransportProof.v1");
const processState = globalThis[storageKey] || { storage: new AsyncLocalStorage() };
globalThis[storageKey] = processState;
const storage = processState.storage;

export function runWithLocalTransportProof(work) {
  return storage.run({ consumed: false }, work);
}

export function consumeLocalTransportProof() {
  const context = storage.getStore();
  if (!context || context.consumed) return false;
  context.consumed = true;
  return true;
}
