import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sanitizeCapabilityReconciliationTrace } from "./capabilityTrace.mjs";

const routePath = new URL("../../app/api/career/internal/capability-reconciliation-trace/route.ts", import.meta.url);
const routeSource = fs.readFileSync(routePath, "utf8");

test("trace sanitization exposes lifecycle states but no evidence or identifiers", () => {
  const output = sanitizeCapabilityReconciliationTrace([
    {
      capabilityKey: "PROGRAM_DELIVERY",
      expectedAuthorityState: "NEEDS_MORE_EVIDENCE",
      priorAuthorityState: "VERIFIED_DIRECT",
      profileId: "profile-secret",
      existingAuthority: true,
      updateAttempted: true,
      updateRowCount: 1,
      insertAttempted: false,
      readbackAuthorityState: "NEEDS_MORE_EVIDENCE",
      returnedAuthorityState: "NEEDS_MORE_EVIDENCE",
      reconciliationSucceeded: true,
      publicAuthorityState: "NEEDS_MORE_EVIDENCE",
      capabilityNeedsReview: true,
      statement: "private career evidence",
      sourceExcerpt: "private source excerpt",
    },
    { profileId: "profile-secret", reviewed: 1, total: 2, completion: false },
  ]);

  assert.deepEqual(output, {
    capabilities: [{
      capabilityKey: "PROGRAM_DELIVERY",
      expectedAuthorityState: "NEEDS_MORE_EVIDENCE",
      priorAuthorityState: "VERIFIED_DIRECT",
      existingAuthorityFound: true,
      reconciliationEntered: true,
      updateAttempted: true,
      updateRowCount: 1,
      insertAttempted: false,
      readbackAuthorityState: "NEEDS_MORE_EVIDENCE",
      returnedAuthorityState: "NEEDS_MORE_EVIDENCE",
      reconciliationSucceeded: true,
      publicAuthorityState: "NEEDS_MORE_EVIDENCE",
      capabilityNeedsReview: true,
    }],
    request: { reviewedCount: 1, totalCount: 2, completionResult: false, sameAuthenticatedProfileScope: true },
  });
  assert.equal(JSON.stringify(output).includes("private"), false);
  assert.equal(JSON.stringify(output).includes("profile-secret"), false);
});

test("trace route is authenticated, canonical, uncached, and read-only at the customer boundary", () => {
  assert.match(routeSource, /currentCareerContext/);
  assert.match(routeSource, /if \(!context\).*401/s);
  assert.match(routeSource, /getCapabilityProfile\(context, \{ includeTrace: true \}\)/);
  assert.match(routeSource, /Cache-Control/);
  assert.doesNotMatch(routeSource, /CareerFact|sourceExcerpt|statement|tenantId|profileId/);
});

test("normal capability route remains opt-in for its existing trace behavior", () => {
  const normalRoute = fs.readFileSync(new URL("../../app/api/career/capabilities/route.ts", import.meta.url), "utf8");
  assert.match(normalRoute, /traceEnabled/);
  assert.match(normalRoute, /includeTrace: traceEnabled\(\)/);
});
