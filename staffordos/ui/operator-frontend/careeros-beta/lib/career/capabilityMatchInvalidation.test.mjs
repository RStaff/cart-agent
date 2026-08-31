import assert from "node:assert/strict";
import test from "node:test";
import { capabilityAuthorityStateChanged, invalidateCurrentMatchEvaluations } from "./careerMatchInvalidation.mjs";

function fakeClient() {
  const queries = [];
  return {
    queries,
    client: { query: async (text, values) => { queries.push({ text, values }); return { rowCount: 2 }; } },
  };
}

test("authority change invalidates current profile-scoped match evaluations", async () => {
  assert.equal(capabilityAuthorityStateChanged("NEEDS_MORE_EVIDENCE", "VERIFIED_DIRECT"), true);
  const { client, queries } = fakeClient();
  await invalidateCurrentMatchEvaluations(client, { tenant: { id: "tenant-a" }, user: { id: "user-a" } }, "profile-a");
  assert.equal(queries.length, 1);
  assert.match(queries[0].text, /^UPDATE "CareerMatchEvaluation" SET stale=true/);
  assert.match(queries[0].text, /"tenantId"=\$1/);
  assert.match(queries[0].text, /"userId"=\$2/);
  assert.match(queries[0].text, /"profileId"=\$3/);
  assert.match(queries[0].text, /stale=false/);
  assert.deepEqual(queries[0].values, ["tenant-a", "user-a", "profile-a"]);
});

test("same effective authority does not require invalidation", () => {
  assert.equal(capabilityAuthorityStateChanged("VERIFIED_DIRECT", "VERIFIED_DIRECT"), false);
});

test("tenant, user, and profile boundaries are explicit", async () => {
  const { client, queries } = fakeClient();
  await invalidateCurrentMatchEvaluations(client, { tenant: { id: "tenant-b" }, user: { id: "user-b" } }, "profile-b");
  assert.deepEqual(queries[0].values, ["tenant-b", "user-b", "profile-b"]);
});

test("invalidation is observationally separate from re-analysis", async () => {
  const { client, queries } = fakeClient();
  await invalidateCurrentMatchEvaluations(client, { tenant: { id: "tenant-a" }, user: { id: "user-a" } }, "profile-a");
  assert.equal(queries.every(({ text }) => /^UPDATE "CareerMatchEvaluation"/.test(text)), true);
  assert.equal(queries.some(({ text }) => /INSERT|CareerOpportunity|CareerMatchEvaluation.*SELECT/.test(text)), false);
});
