import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage();

export function runWithLocalTransportProof(work) {
  return storage.run({ consumed: false }, work);
}

export function consumeLocalTransportProof() {
  const context = storage.getStore();
  if (!context || context.consumed) return false;
  context.consumed = true;
  return true;
}
