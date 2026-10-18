/**
 * Small state boundary shared by the package workspace and its executable
 * tests.  It keeps asynchronous reads tied to the current selection and
 * keeps an operation key/payload stable until a command is confirmed.
 */
export function createPackageWorkspaceController({ loadPackage, submitCommand } = {}) {
  let selection = "";
  let generation = 0;
  let state = { selection: "", snapshot: null, history: [] };
  const pendingOperations = new Map();

  function select(nextSelection) {
    selection = nextSelection;
    generation += 1;
    state = { selection, snapshot: null, history: [] };
    return generation;
  }

  async function inspect(nextSelection = selection) {
    const request = { selection: nextSelection, generation: ++generation };
    const result = await loadPackage(nextSelection);
    if (request.generation !== generation || request.selection !== selection) {
      return { applied: false, result };
    }
    state = { selection, snapshot: result.snapshot ?? null, history: result.history ?? [] };
    return { applied: true, result };
  }

  function operation(action, engagementId, payload = {}) {
    const existing = pendingOperations.get(action);
    if (existing && existing.engagementId === engagementId) return existing;
    const idempotencyKey = payload.idempotencyKey || `${action}-${engagementId}-test-stable`;
    const next = { action, engagementId, idempotencyKey, payload: { ...payload, idempotencyKey } };
    pendingOperations.set(action, next);
    return next;
  }

  async function command(action, engagementId, payload = {}) {
    const pending = operation(action, engagementId, payload);
    try {
      const result = await submitCommand(pending);
      const readback = await inspect(engagementId);
      if (readback.applied) pendingOperations.delete(action);
      return { result, readback, operation: pending };
    } catch (error) {
      // Keep the exact operation and payload available for a safe retry.
      return { error, operation: pending };
    }
  }

  function complete(action) {
    pendingOperations.delete(action);
  }

  return {
    select,
    inspect,
    operation,
    command,
    complete,
    getState: () => state,
  };
}
