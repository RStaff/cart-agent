import assert from "node:assert/strict";
import test from "node:test";
import { canonicalOperatorFrontendOrigin, canonicalOperatorReturnLocation } from "./operatorFrontendOrigin.mjs";

test("canonical origin remains 127.0.0.1 when Next normalizes a loopback URL to localhost", () => {
  const canonical = canonicalOperatorFrontendOrigin({ STAFFORDOS_OPERATOR_FRONTEND_ORIGIN: "http://127.0.0.1:3211" });
  const normalizedNextOrigin = "http://localhost:3211";
  assert.equal(canonicalOperatorReturnLocation("/operator/blueprints", canonical), "http://127.0.0.1:3211/operator/blueprints");
  assert.notEqual(normalizedNextOrigin, canonical);
});

test("canonical origin fails closed for missing or localhost configuration", () => {
  assert.throws(() => canonicalOperatorFrontendOrigin({}), /ORIGIN_MISSING/);
  assert.throws(() => canonicalOperatorFrontendOrigin({ STAFFORDOS_OPERATOR_FRONTEND_ORIGIN: "http://localhost:3211" }), /ORIGIN_INVALID/);
  assert.equal(canonicalOperatorReturnLocation("//localhost:3211/operator/blueprints", "http://127.0.0.1:3211"), "");
});
