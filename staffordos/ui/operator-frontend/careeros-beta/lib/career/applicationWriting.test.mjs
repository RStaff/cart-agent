import test from "node:test";
import assert from "node:assert/strict";
import { improveApplicationMaterial, validateWritingClaims } from "./applicationWriting.mjs";
import { generateApplicationWriting } from "./applicationWritingProvider.mjs";

const evidence = [
  { statement: "Led cross-functional program delivery", relationship: "DIRECT", requirement: "Program delivery" },
  { statement: "Coordinated stakeholders across product and engineering", relationship: "TRANSFERABLE", requirement: "Stakeholder coordination" },
];

test("AI writing is optional and preserves grounded relationship framing", async () => {
  let request;
  const result = await improveApplicationMaterial({
    materialType: "RESUME",
    target: { title: "Program Manager", company: "Example Co" },
    deterministicDraft: "Led cross-functional program delivery.",
    evidence,
    style: "CONCISE",
    provider: async (payload) => { request = payload; return { draft: "Led cross-functional program delivery and coordinated stakeholders.", claims: [{ text: "Led cross-functional program delivery", supportRefs: [0], classification: "SUPPORTED" }, { text: "Coordinated stakeholders across product and engineering", supportRefs: [1], classification: "SUPPORTED" }], provider: "openai", model: "gpt-4o-mini" }; },
  });
  assert.equal(result.status, "AI_ASSISTED");
  assert.equal(result.groundingStatus, "SUPPORTED");
  assert.equal(request.target.company, "Example Co");
  assert.equal(request.evidence[1].relationship, "TRANSFERABLE");
  assert.equal(request.deterministicDraft, "Led cross-functional program delivery.");
  assert.equal(request.tenantId, undefined);
});

test("forged support references fail closed", () => {
  assert.throws(() => validateWritingClaims({ evidence, claims: [{ text: "Invented metric", supportRefs: [99], classification: "SUPPORTED" }] }), /FORGED_SUPPORT/);
  assert.throws(() => validateWritingClaims({ evidence, claims: [{ text: "Unsupported claim", supportRefs: [0], classification: "UNSUPPORTED" }] }), /UNSUPPORTED_CLAIM/);
});

test("needs-review claims remain visibly reviewable", async () => {
  const result = await improveApplicationMaterial({
    materialType: "COVER_LETTER",
    target: { title: "Technical Program Manager" },
    deterministicDraft: "Led cross-functional program delivery.",
    evidence,
    provider: async () => ({ draft: "Led programs with broad impact.", claims: [{ text: "Led programs with broad impact.", supportRefs: [0], classification: "NEEDS_REVIEW" }], provider: "openai", model: "gpt-4o-mini" }),
  });
  assert.equal(result.groundingStatus, "REVIEW_REQUIRED");
});

test("provider boundary is server-keyed and fails closed without a credential", async () => {
  await assert.rejects(() => generateApplicationWriting({ materialType: "RESUME", target: {}, deterministicDraft: "draft", evidence, apiKey: "" }), /PROVIDER_REQUIRED/);
});
