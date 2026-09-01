import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  USAJOBS_AUTOMATIC_DISCOVERY_BLOCK_CODE,
  authorizeUsajobsAutomaticDiscovery,
  getUsajobsAutomaticDiscoveryAuthority,
  searchAuthorizedUsajobsDiscovery,
} from "./usajobsAuthority.mjs";

const routeSource = readFileSync(new URL("../../app/api/career/discover/route.ts", import.meta.url), "utf8");

test("USAJOBS automatic discovery is written-approval-required by default", () => {
  const authority = getUsajobsAutomaticDiscoveryAuthority();
  assert.equal(authority.provider, "USAJOBS");
  assert.equal(authority.authorityState, "WRITTEN_APPROVAL_REQUIRED");
  assert.equal(authority.writtenApprovalProven, false);
  assert.equal(authority.productStatus, "AUTOMATIC_DISCOVERY_DISABLED_PENDING_AUTHORITY");
});

test("USAJOBS automatic request without written authority is blocked before adapter invocation", async () => {
  let adapterCalls = 0;
  await assert.rejects(() => searchAuthorizedUsajobsDiscovery({
    criteria: { keywords: "program manager" },
    adapter: async () => {
      adapterCalls += 1;
      return { provider: "USAJOBS", results: [] };
    },
  }), { code: USAJOBS_AUTOMATIC_DISCOVERY_BLOCK_CODE });
  assert.equal(adapterCalls, 0);
});

test("USAJOBS authority cannot be inferred from credentials or adapter availability", () => {
  const authorization = authorizeUsajobsAutomaticDiscovery();
  assert.equal(authorization.authorized, false);
  assert.equal(authorization.code, "USAJOBS_WRITTEN_APPROVAL_REQUIRED");
});

test("future USAJOBS reactivation requires explicit written approval evidence", async () => {
  let adapterCalls = 0;
  await assert.rejects(() => searchAuthorizedUsajobsDiscovery({
    authorityOptions: { authorityState: "AUTHORIZED" },
    adapter: async () => {
      adapterCalls += 1;
      return { provider: "USAJOBS", results: [] };
    },
  }), { code: "USAJOBS_AUTHORITY_NOT_PROVEN" });
  assert.equal(adapterCalls, 0);

  const result = await searchAuthorizedUsajobsDiscovery({
    authorityOptions: { authorityState: "AUTHORIZED", writtenApprovalEvidenceRef: "TEST_ONLY_WRITTEN_APPROVAL_FIXTURE" },
    adapter: async () => {
      adapterCalls += 1;
      return { provider: "USAJOBS", results: [] };
    },
  });
  assert.equal(result.provider, "USAJOBS");
  assert.equal(adapterCalls, 1);
});

test("discover route places USAJOBS authority wrapper before the adapter", () => {
  assert.match(routeSource, /searchAuthorizedUsajobsDiscovery/);
  assert.match(routeSource, /searchAuthorizedUsajobs\(\{ criteria: providerCriteria, adapter: searchAuthorizedProvider \}\)/);
  assert.doesNotMatch(routeSource, /await searchAuthorizedProvider\(providerCriteria\)/);
  assert.match(routeSource, /sourceIds\.length > 0 && requestedProvider !== "USAJOBS"/);
});
