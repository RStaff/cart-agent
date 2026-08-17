import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../../careeros-beta/", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");

test("privacy notice contains verified beta disclosures", () => {
  const notice = read("app/career/components/PrivacyDisclosure.tsx");
  for (const concept of ["invite-only early beta", "tenant-scoped CareerOS account", "CareerFacts", "capabilities", "deterministic and automated processing", "incomplete or incorrect", "unknown or not enough evidence", "other CareerOS tenants", "account export function", "account deletion function", "binary resume and document uploads are not supported"]) assert.ok(notice.toLowerCase().includes(concept.toLowerCase()), concept);
  assert.doesNotMatch(notice, /password|session pepper|DATABASE_URL|Ross-private|operator/);
});

test("notice is placed before career text submission and remains discoverable", () => {
  assert.match(read("app/career/onboarding/page.tsx"), /PrivacyDisclosure[\s\S]*CareerStoryBuilder/);
  assert.match(read("app/career/components/CareerStoryBuilder.tsx"), /IntakeReview/);
  assert.match(read("app/career/signup/page.tsx"), /PrivacyDisclosure[\s\S]*AuthForm/);
  assert.match(read("app/career/profile/page.tsx"), /PrivacyDisclosure/);
  assert.match(read("app/career/privacy/page.tsx"), /PrivacyDisclosure/);
  assert.match(read("app/career/components/AuthForm.tsx"), /Invite code/);
  assert.match(read("app/career/components/AuthForm.tsx"), /inviteToken/);
});
