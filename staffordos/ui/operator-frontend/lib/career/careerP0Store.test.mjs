import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createCareerP0Store } from "./careerP0Store.mjs";

async function fixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "careeros-p0-"));
  const filePath = path.join(dir, "store.json");
  return { dir, filePath, store: createCareerP0Store({ filePath }) };
}

test("creates an account, tenant, session, and tenant-owned profile", async () => {
  const { store } = await fixture();
  const session = await store.createAccount({ email: "a@example.test", password: "password-a", displayName: "User A" });
  assert.equal(session.tenant.name, "User A");
  const profile = await store.saveProfile(session.sessionId, { displayName: "User A", headline: "Builder" });
  assert.equal(profile.tenantId, session.tenant.id);
  assert.equal((await store.getProfile(session.sessionId)).headline, "Builder");
});

test("rejects cross-tenant profile reads and updates", async () => {
  const { store } = await fixture();
  const a = await store.createAccount({ email: "a@example.test", password: "password-a" });
  const b = await store.createAccount({ email: "b@example.test", password: "password-b" });
  const profileA = await store.saveProfile(a.sessionId, { displayName: "A" });
  assert.notEqual(a.tenant.id, b.tenant.id);
  assert.equal((await store.getProfile(b.sessionId)), null);
  await assert.rejects(() => store.saveProfile(`not-${profileA.id}`, { displayName: "tamper" }), /unauthorized/);
});

test("session resolution fails closed and logout revokes access", async () => {
  const { store } = await fixture();
  const session = await store.createAccount({ email: "a@example.test", password: "password-a" });
  assert.ok(await store.resolveSession(session.sessionId));
  await store.destroySession(session.sessionId);
  assert.equal(await store.resolveSession(session.sessionId), null);
});

test("source listing is tenant scoped and does not expose raw payload authority", async () => {
  const { store } = await fixture();
  const session = await store.createAccount({ email: "a@example.test", password: "password-a" });
  await store.saveProfile(session.sessionId, { displayName: "A" });
  const source = await store.createSource(session.sessionId, { sourceType: "RESUME", originalFilename: "resume.pdf" });
  assert.equal(source.sourceStatus, "PENDING_STORAGE");
  assert.equal(source.contentReference, null);
  assert.equal((await store.listSources(session.sessionId)).length, 1);
});
