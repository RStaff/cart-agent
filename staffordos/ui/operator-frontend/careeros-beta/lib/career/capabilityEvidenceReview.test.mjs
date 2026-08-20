import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url).pathname;
const read = (relative) => readFileSync(`${root}${relative}`, "utf8");
const page = read("app/career/capabilities/page.tsx");
const product = read("lib/career/careerP0Product.mjs");
const catalog = read("lib/career/capabilityCatalog.mjs");
const authority = read("lib/career/customerSemanticAuthority.json");

test("capability review exposes bounded supporting evidence and decision choices", () => {
  assert.match(page, /Why CareerOS is asking/);
  assert.match(page, /supportingEvidence/);
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
