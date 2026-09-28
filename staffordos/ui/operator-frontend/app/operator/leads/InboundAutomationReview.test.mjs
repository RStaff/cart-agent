import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync(new URL("../../api/operator/inbound-automation/route.ts", import.meta.url), "utf8");
const view = fs.readFileSync(new URL("./InboundAutomationReview.tsx", import.meta.url), "utf8");

test("inbound review uses the authenticated read route and text-safe rendering", () => {
  assert.match(route, /authorizeStaffordOsOperatorRead/);
  assert.match(route, /INTERNAL_API_KEY/);
  assert.match(view, /Status:/);
  assert.match(view, /submittedAt/);
  assert.doesNotMatch(view, /dangerouslySetInnerHTML/);
});
