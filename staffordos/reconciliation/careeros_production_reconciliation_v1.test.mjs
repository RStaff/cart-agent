import assert from "node:assert/strict";
import test from "node:test";
import { createCareerOSProductionReconciler, OPERATION_NAME } from "./careeros_production_reconciliation_v1.mjs";

const opportunityId = "opportunity_ae49e086-3a9d-4df1-b04b-09835e0013a7";

function fixture({ drafts = [], events = [], opportunity = {}, failure = null, readOnly = "on" } = {}) {
  const calls = [];
  const client = {
    async query(text, params = []) {
      calls.push({ text, params });
      if (failure && text.includes(failure)) throw new Error("DATABASE_FAILURE");
      if (text === "SHOW transaction_read_only") return { rows: [{ transaction_read_only: readOnly }] };
      if (text.startsWith("SELECT current_database")) return { rows: [{ database: "careeros_test", schema: "public" }] };
      if (text.includes('FROM "CareerOpportunity"')) return { rowCount: opportunity.missing ? 0 : 1, rows: opportunity.missing ? [] : [{ id: opportunityId, tenantId: "tenant-1", userId: "user-1", decisionState: "PURSUE", lifecycleState: "NEW", createdAt: "2026-09-03T20:00:00Z", updatedAt: "2026-09-03T20:00:00Z", ...opportunity }] };
      if (text.includes('FROM "CareerResumeDraft"')) return { rowCount: drafts.length, rows: drafts };
      if (text.includes('FROM "CareerOpportunityEvent"')) return { rowCount: events.length, rows: events };
      return { rows: [] };
    },
    release() { calls.push({ text: "RELEASE" }); },
  };
  const pool = { async connect() { return client; } };
  return { pool, calls };
}

function draft(version, text, editedByUser = false) {
  return { id: `resume-${version}`, draftVersion: version, createdAt: `2026-09-03T20:0${version}:00Z`, updatedAt: `2026-09-03T20:0${version}:00Z`, content: { text, editedByUser } };
}

test("reconciles one exact opportunity and returns bounded versions and digests", async () => {
  const { pool, calls } = fixture({ drafts: [draft(1, "old", true), draft(2, "new")] , events: [{ id: "event-1", eventType: "APPLICATION_MATERIAL_REGENERATED", createdAt: "2026-09-03T20:02:00Z", metadata: { regeneration: true } }] });
  const result = await createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } })(opportunityId);
  assert.equal(result.operation, OPERATION_NAME);
  assert.deepEqual(result.resumeDrafts.versions, [1, 2]);
  assert.equal(result.resumeDrafts.previousDraftPreserved, true);
  assert.equal(result.resumeDrafts.editedByUserByVersion["1"], true);
  assert.equal(result.resumeDrafts.historicalDigests[0].contentDigest.length, 64);
  assert.equal(result.regeneration.eventPresent, true);
  assert.equal(result.regeneration.events[0].metadata.regeneration, true);
  assert.equal(result.verification.exactOpportunityScope, true);
  assert.ok(calls.every(({ text }) => !/\b(INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE)\b/i.test(text)));
});

test("rejects invalid identifiers before connecting", async () => {
  const { pool } = fixture();
  await assert.rejects(() => createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } })("x' OR 1=1"), { code: "INVALID_OPPORTUNITY_ID" });
});

test("fails closed when opportunity is missing", async () => {
  const { pool } = fixture({ opportunity: { missing: true } });
  await assert.rejects(() => createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } })(opportunityId), { code: "OPPORTUNITY_NOT_FOUND" });
});

test("fails closed when identity does not match", async () => {
  const { pool } = fixture();
  await assert.rejects(() => createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "wrong", schema: "public" } })(opportunityId), { code: "PRODUCTION_IDENTITY_MISMATCH" });
});

test("fails closed when transaction read-only is not enforced", async () => {
  const { pool } = fixture({ readOnly: "off" });
  const client = await pool.connect();
  const original = client.query;
  client.query = async (text, params) => original.call(client, text, params);
  pool.connect = async () => client;
  await assert.rejects(() => createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } })(opportunityId), { code: "READ_ONLY_TRANSACTION_NOT_ENFORCED" });
});

test("fails closed on non-sequential versions", async () => {
  const { pool } = fixture({ drafts: [draft(1, "old"), draft(3, "new")] });
  const result = await createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } })(opportunityId);
  assert.equal(result.resumeDrafts.versionSequenceValid, false);
});

test("does not return historical raw draft bodies", async () => {
  const { pool } = fixture({ drafts: [draft(1, "private historical body"), draft(2, "current body")] });
  const result = await createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } })(opportunityId);
  assert.equal(JSON.stringify(result).includes("private historical body"), false);
});

test("rejects unexpected event metadata", async () => {
  const { pool } = fixture({ events: [{ id: "event-1", eventType: "APPLICATION_MATERIAL_REGENERATED", createdAt: "2026-09-03T20:02:00Z", metadata: { rawError: "secret" } }] });
  await assert.rejects(() => createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } })(opportunityId), { code: "UNEXPECTED_EVENT_METADATA" });
});

test("does not permit caller query or table selection", async () => {
  const { pool, calls } = fixture();
  const reconcile = createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } });
  assert.equal(reconcile.length, 1);
  await reconcile(opportunityId);
  assert.equal(calls.some(({ params }) => params?.some((value) => String(value).includes("CareerResumeDraft"))), false);
});

test("returns deterministic output for equivalent records", async () => {
  const first = fixture({ drafts: [draft(1, "old"), draft(2, "new")] });
  const second = fixture({ drafts: [draft(1, "old"), draft(2, "new")] });
  const config = { expectedIdentity: { database: "careeros_test", schema: "public" } };
  assert.deepEqual(await createCareerOSProductionReconciler({ pool: first.pool, ...config })(opportunityId), await createCareerOSProductionReconciler({ pool: second.pool, ...config })(opportunityId));
});

test("fails closed on query failure", async () => {
  const { pool } = fixture({ failure: 'FROM "CareerResumeDraft"' });
  await assert.rejects(() => createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } })(opportunityId), /DATABASE_FAILURE/);
});

test("uses only the operation-owned opportunity scope", async () => {
  const { pool, calls } = fixture({ drafts: [draft(1, "old")] });
  await createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } })(opportunityId);
  const scopedQueries = calls.filter(({ text }) => text.includes('"CareerResumeDraft"') || text.includes('"CareerOpportunityEvent"'));
  assert.equal(scopedQueries.every(({ params }) => params.includes(opportunityId) && params.includes("tenant-1") && params.includes("user-1")), true);
});

test("does not expose database identity secrets or connection strings", async () => {
  const { pool } = fixture();
  const result = await createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } })(opportunityId);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("DATABASE_URL"), false);
  assert.equal(serialized.includes("password"), false);
  assert.equal(serialized.includes("postgres://"), false);
});

test("keeps output bounded to the reconciliation contract", async () => {
  const { pool } = fixture({ drafts: [draft(1, "old"), draft(2, "new")] });
  const result = await createCareerOSProductionReconciler({ pool, expectedIdentity: { database: "careeros_test", schema: "public" } })(opportunityId);
  assert.deepEqual(Object.keys(result), ["operation", "productionIdentityStatus", "opportunityId", "opportunity", "resumeDrafts", "regeneration", "verification"]);
  assert.equal(Object.hasOwn(result.resumeDrafts, "content"), false);
});
