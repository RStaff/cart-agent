import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url).pathname;
const read = (relative) => fs.readFileSync(`${root}${relative}`, "utf8");

const home = read("app/career/page.tsx");
const contextPage = read("app/career/context/page.tsx");
const contextClient = read("app/career/context/ContextClaimsClient.tsx");
const capabilitiesPage = read("app/career/capabilities/page.tsx");
const capabilitiesLayout = read("app/career/capabilities/layout.tsx");
const jobsPage = read("app/career/jobs/page.tsx");
const jobsLayout = read("app/career/jobs/layout.tsx");
const signupRoute = read("app/api/career/auth/signup/route.ts");
const authForm = read("app/career/components/AuthForm.tsx");
const envGuard = read("lib/career/careerP0Environment.mjs");
const opportunitiesRoute = read("app/api/career/opportunities/route.ts");
const detailPage = read("app/career/jobs/[opportunityId]/page.tsx");
const product = read("lib/career/careerP0Product.mjs");
const contextClaims = read("lib/career/contextClaims.mjs");

test("Career Home exposes the search-first customer journey and beta feedback utility", () => {
  for (const text of [
    "Build my career profile",
    "Review what CareerOS learned",
    "Evaluate a job I provide",
    "Understand my matches",
    "Manage my opportunities",
    "Give beta feedback",
    "opportunity evaluation",
    "human-approved applications",
  ]) assert.match(home, new RegExp(text));
  for (const href of ["/career/onboarding", "/career/context", "/career/capabilities", "/career/discover", "/career/inbox", "/career/jobs", "https://www.staffordmedia.ai/contact"]) assert.match(home, new RegExp(href.replace(/\//g, "\\/")));
  assert.doesNotMatch(home, /Public feedback beta path/);
});

test("Career Story, context, capabilities, and pasted-job evaluation remain reachable", () => {
  assert.match(home, /href=\{storyHref\}/);
  assert.match(home + capabilitiesPage + jobsPage, /\/career\/onboarding/);
  assert.match(home + capabilitiesPage + jobsPage, /\/career\/context/);
  assert.match(home + contextClient + jobsPage, /\/career\/capabilities/);
  assert.match(home + contextClient + capabilitiesPage, /\/career\/jobs/);
  assert.match(jobsPage, /Paste a job description/);
  assert.match(jobsPage, /\/api\/career\/opportunities/);
});

test("context and capabilities remain separate customer concepts", () => {
  assert.match(home, /Tools, methods, stakeholders, workflows, processes, domains, and outcomes/);
  assert.match(home, /Capabilities summarize broader strengths/);
  assert.match(contextClient, /does not change your capability answers or job assessment by itself/);
  assert.match(capabilitiesPage, /Context details stay separate and reviewable/);
  assert.equal(product.includes("listContextClaims"), false);
  assert.equal(product.includes("CareerFactContextClaim"), false);
});

test("unauthenticated deep links fail closed before client surfaces render", () => {
  for (const layout of [capabilitiesLayout, jobsLayout]) {
    assert.match(layout, /currentCareerContext/);
    assert.match(layout, /redirect\("\/career\/login"\)/);
    assert.doesNotMatch(layout, /createAccount|saveProfile|createSource|createOpportunity|answerCapability|reviewContextClaim|reviewCandidate/);
  }
  assert.match(contextPage, /currentCareerContext/);
  assert.match(contextPage, /redirect\("\/career\/login"\)/);
});

test("invite-only signup behavior is unchanged", () => {
  assert.match(authForm, /Invite code/);
  assert.match(authForm, /inviteToken/);
  assert.match(signupRoute, /inviteToken/);
  assert.match(signupRoute, /careerP0Store\.createAccount/);
  assert.match(envGuard, /CAREEROS_INVITE_ONLY=true/);
});

test("navigation changes do not alter CareerFact, context, capability, or matching semantics", () => {
  assert.match(contextClaims, /CUSTOMER_CONFIRMED_SOURCE_BACKED/);
  assert.match(product, /CareerCapabilityDecision/);
  assert.match(product, /CareerCapabilityAuthority/);
  assert.match(product, /deriveCapabilityCandidates\(facts\)/);
  assert.match(opportunitiesRoute, /createOpportunity/);
  assert.match(opportunitiesRoute, /listOpportunities/);
  assert.match(detailPage, /customerEvidenceFitPresentation/);
  assert.doesNotMatch(home + contextClient + capabilitiesPage + jobsPage, /\/os\/professional\/jobs/);
});

test("new navigation surfaces do not create customer records on entry", () => {
  assert.doesNotMatch(home, /fetch\(|method:\s*"POST"|saveProfile|createSource|createOpportunity|answerCapability|reviewContextClaim|reviewCandidate/);
  assert.doesNotMatch(capabilitiesLayout + jobsLayout, /method:\s*"POST"|saveProfile|createSource|createOpportunity|answerCapability|reviewContextClaim|reviewCandidate/);
  assert.match(capabilitiesPage, /fetch\("\/api\/career\/capabilities", \{ cache: "no-store" \}\)/);
});
