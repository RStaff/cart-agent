import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url).pathname;
const read = (relative) => readFileSync(`${root}${relative}`, "utf8");
const page = read("app/career/capabilities/page.tsx");
const product = read("lib/career/careerP0Product.mjs");
const catalog = read("lib/career/capabilityCatalog.mjs");
const authority = read("lib/career/customerSemanticAuthority.json");
const route = read("app/api/career/capabilities/route.ts");

test("capability review exposes bounded supporting evidence and decision choices", () => {
  assert.match(page, /Why CareerOS thinks this/);
  assert.match(page, /<details\b/);
  assert.match(page, /<summary>Why CareerOS thinks this<\/summary>/);
  assert.match(page, /reviewStatus/);
  assert.match(page, /current\.rationale/);
  assert.match(page, /supportingEvidence/);
  assert.ok(page.indexOf("current.question?.prompt") < page.indexOf("<details"));
  assert.match(page, /Source:/);
  assert.match(page, /NOT_SUPPORTED/);
  assert.match(page, /KEEP_UNRESOLVED/);
  assert.match(product, /sourceExcerpt/);
  assert.match(product, /CUSTOMER_CONFIRMED_SOURCE_BACKED/);
  assert.match(catalog, /capabilityQuestionForEvidence/);
});

test("capability review remains separate from career fact truth", () => {
  assert.doesNotMatch(page, /CareerFactCandidate|CareerFact/);
  assert.match(product, /CareerCapabilityDecision/);
  assert.match(product, /CareerCapabilityAuthority/);
  assert.match(authority, /DERIVED_CAPABILITY_PROPOSITION/);
  assert.match(authority, /CUSTOMER_AUTHORIZED_CAPABILITY/);
});

test("capability read model cannot serve cached lifecycle state", () => {
  assert.match(route, /dynamic = "force-dynamic"/);
  assert.match(route, /revalidate = 0/);
  assert.match(route, /Cache-Control.*no-store/);
  assert.match(page, /fetch\("\/api\/career\/capabilities", \{ cache: "no-store" \}\)/);
});
