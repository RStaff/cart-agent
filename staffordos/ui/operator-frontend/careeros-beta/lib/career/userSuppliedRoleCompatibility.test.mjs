import assert from "node:assert/strict";
import test from "node:test";
import { classifyUserSuppliedRole } from "./userSuppliedRoleCompatibility.mjs";

const preference = (requestedTitle) => ({ requestedTitle, keywords: requestedTitle });

for (const title of [
  "AI Product Manager",
  "Program Manager",
  "Marketing Technology Manager",
  "AI Automation Engineer",
]) {
  test(`exact imported ${title} uses the canonical P0 classifier`, () => {
    const result = classifyUserSuppliedRole({ preference: preference(title), opportunityTitle: title });
    assert.equal(result.compatibility, "EXACT_OR_NEAR_TITLE");
  });
}

test("exact AI Product Manager preserves specialization and unspecified seniority", () => {
  const result = classifyUserSuppliedRole({ preference: preference("AI Product Manager"), opportunityTitle: "AI Product Manager" });
  assert.equal(result.specializationAligned, true);
  assert.equal(result.seniorityAligned, true);
});

test("adjacent imported role remains distinct from an exact role", () => {
  const result = classifyUserSuppliedRole({ preference: preference("AI Product Manager"), opportunityTitle: "Product Manager" });
  assert.equal(result.compatibility, "COMPATIBLE_ADJACENT");
});

test("incompatible imported role is identified without an automatic rejection", () => {
  const result = classifyUserSuppliedRole({ preference: preference("AI Product Manager"), opportunityTitle: "Restaurant General Manager" });
  assert.equal(result.compatibility, "INCOMPATIBLE");
  assert.match(result.explanation, /differs/i);
});

test("missing target role preserves personal-fit workflow semantics", () => {
  const result = classifyUserSuppliedRole({ preference: {}, opportunityTitle: "Program Manager" });
  assert.equal(result.status, "ROLE_TARGET_NOT_CONFIGURED");
  assert.equal(result.compatibility, null);
});
