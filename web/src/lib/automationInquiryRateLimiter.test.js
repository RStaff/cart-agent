import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyAutomationVisitorToken } from "./automationInquiryRateLimiter.js";

test("visitor tokens are signed and forged headers do not identify a visitor", () => {
  const secret = "test-secret";
  const now = Date.now();
  const id = crypto.randomBytes(24).toString("base64url");
  const unsigned = `v1.${id}.${now}`;
  const signature = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  assert.ok(verifyAutomationVisitorToken(`${unsigned}.${signature}`, secret, now));
  assert.equal(verifyAutomationVisitorToken(`${unsigned}.${signature.slice(0, -1)}x`, secret, now), null);
  assert.equal(verifyAutomationVisitorToken("forged-browser-header", secret, now), null);
});
