import test from "node:test";
import assert from "node:assert/strict";
import { createPackageWorkspaceController } from "./packageWorkspaceController.mjs";

test("workspace ignores delayed inspection from an older engagement/package", async () => {
  const pending = [];
  const workspace = createPackageWorkspaceController({
    loadPackage: (selection) => new Promise((resolve) => pending.push({ selection, resolve })),
    submitCommand: async () => ({ ok: true }),
  });

  workspace.select("engagement-a:package-a");
  const oldRead = workspace.inspect();
  workspace.select("engagement-b:package-b");
  const currentRead = workspace.inspect();
  pending.find((entry) => entry.selection === "engagement-a:package-a").resolve({ snapshot: { id: "package-a" }, history: [] });
  pending.find((entry) => entry.selection === "engagement-b:package-b").resolve({ snapshot: { id: "package-b" }, history: [{ id: "package-b" }] });

  assert.equal((await oldRead).applied, false);
  assert.equal((await currentRead).applied, true);
  assert.equal(workspace.getState().snapshot.id, "package-b");
});

test("lost command response retries the same operation key and payload", async () => {
  const calls = [];
  let readback = 0;
  const workspace = createPackageWorkspaceController({
    createOperationKey: () => "injected-test-key",
    loadPackage: async () => ({ snapshot: { id: "package-a", readback: ++readback }, history: [] }),
    submitCommand: async (operation) => {
      calls.push(operation);
      if (calls.length === 1) throw new Error("response lost after server success");
      return { ok: true, package: { id: "package-a" } };
    },
  });
  workspace.select("engagement-a");
  const first = await workspace.command("RELEASE_PACKAGE", "engagement-a", { snapshotId: "package-a", contentDigest: "digest-a" });
  const second = await workspace.command("RELEASE_PACKAGE", "engagement-a", { snapshotId: "package-a", contentDigest: "digest-a" });

  assert.ok(first.error);
  assert.equal(second.result.ok, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey);
  assert.deepEqual(calls[0].payload, calls[1].payload);
  assert.equal(workspace.getState().snapshot.id, "package-a");
  assert.equal(workspace.getState().snapshot.readback, 1);
});

test("new preview operations get distinct keys after success and remount", async () => {
  let nextKey = 0;
  const keys = [];
  const make = () => createPackageWorkspaceController({
    createOperationKey: () => `preview-key-${++nextKey}`,
    loadPackage: async () => ({ snapshot: { id: "package-a" }, history: [] }),
    submitCommand: async (operation) => { keys.push(operation.idempotencyKey); return { ok: true }; },
  });
  const first = make(); first.select("engagement-a"); await first.command("CREATE_PREVIEW_SNAPSHOT", "engagement-a", {});
  const second = make(); second.select("engagement-a"); await second.command("CREATE_PREVIEW_SNAPSHOT", "engagement-a", {});
  assert.deepEqual(keys, ["preview-key-1", "preview-key-2"]);
});

test("old command completion cannot read back after A to B to A selection changes", async () => {
  let resolveCommand;
  let loadCount = 0;
  const workspace = createPackageWorkspaceController({
    createOperationKey: () => "command-key",
    loadPackage: async () => ({ snapshot: { id: `package-${++loadCount}` }, history: [] }),
    submitCommand: () => new Promise((resolve) => { resolveCommand = resolve; }),
  });
  workspace.select("engagement-a");
  const command = workspace.command("RELEASE_PACKAGE", "engagement-a", { snapshotId: "package-a" });
  workspace.select("engagement-b");
  workspace.select("engagement-a");
  resolveCommand({ ok: true });
  const result = await command;
  assert.equal(result.readback.applied, false);
  assert.equal(result.readback.skipped, "selection-changed");
  assert.equal(loadCount, 0);
  assert.equal(workspace.getState().selection, "engagement-a");
  assert.equal(workspace.getState().snapshot, null);
});

test("old command completion cannot read back after package selection changes", async () => {
  let resolveCommand;
  let loadCount = 0;
  const workspace = createPackageWorkspaceController({
    createOperationKey: () => "package-command-key",
    loadPackage: async () => ({ snapshot: { id: `package-${++loadCount}` }, history: [] }),
    submitCommand: () => new Promise((resolve) => { resolveCommand = resolve; }),
  });
  workspace.select("engagement-a:package-a");
  const command = workspace.command("RELEASE_PACKAGE", "engagement-a", { snapshotId: "package-a" });
  workspace.select("engagement-a:package-b");
  resolveCommand({ ok: true });
  const result = await command;
  assert.equal(result.readback.applied, false);
  assert.equal(result.readback.skipped, "selection-changed");
  assert.equal(loadCount, 0);
  assert.equal(workspace.getState().selection, "engagement-a:package-b");
  assert.equal(workspace.getState().snapshot, null);
});

test("selection wiring clears busy state when invalidating a command", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../app/operator/blueprints/BlueprintPackageWorkspace.tsx", import.meta.url), "utf8"));
  assert.match(source, /const resetSelectionState = \(\) => \{ clearDelivery\(\); setBusy\(""\);/);
  assert.match(source, /resetSelectionState\(\); workspaceController\.select\(event\.target\.value\)/);
  assert.match(source, /resetSelectionState\(\); workspaceController\.select\(`\$\{engagementId\}:\$\{nextPackageId\}`\)/);
});

test("successful mutation/readback keeps snapshot, history, and selection consistent", async () => {
  const workspace = createPackageWorkspaceController({
    loadPackage: async (engagementId) => ({
      snapshot: { id: "package-a", engagementId, status: "released" },
      history: [{ id: "package-a", status: "released" }],
    }),
    submitCommand: async (operation) => ({ ok: true, package: { id: operation.payload.snapshotId } }),
  });
  workspace.select("engagement-a");
  const result = await workspace.command("RELEASE_PACKAGE", "engagement-a", { snapshotId: "package-a" });

  assert.equal(result.readback.applied, true);
  assert.equal(workspace.getState().selection, "engagement-a");
  assert.equal(workspace.getState().snapshot.id, "package-a");
  assert.deepEqual(workspace.getState().history, [{ id: "package-a", status: "released" }]);
});
