import assert from "node:assert/strict";
import test from "node:test";
import { buildApplicationAnswerDraft, buildCoverLetterDraft, classifyApplicationQuestion } from "./applicationMaterials.mjs";

const profile = { displayName: "Example User" };
const packet = { status: "CURRENT", opportunity: { title: "Program Manager", company: "Example Co" }, sections: { direct: [{ requirement: "program delivery", relationship: "DIRECT", evidence: [{ statement: "Led confirmed programs." }] }], transferable: [{ requirement: "technical work", relationship: "TRANSFERABLE", evidence: [{ statement: "Improved a related workflow." }] }], partial: [{ requirement: "metrics", evidence: [] }], unknown: [{ requirement: "certification", evidence: [] }], specialist: [], scope: [] } };

test("cover letter uses supported direct and transferable evidence", () => {
  const result = buildCoverLetterDraft({ profile, packet });
  assert.equal(result.status, "CURRENT");
  assert.match(result.content.text, /Led confirmed programs/);
  assert.match(result.content.text, /Improved a related workflow/);
  assert.equal(result.content.blocks[1].grounding, "SUPPORTED");
  assert.equal(result.content.reviewNeeded[0], "metrics");
});

test("application questions classify deterministically", () => {
  assert.equal(classifyApplicationQuestion("Describe a project you led"), "PROJECT_EXAMPLE");
  assert.equal(classifyApplicationQuestion("Why are you interested in this role?"), "MOTIVATION");
  assert.equal(classifyApplicationQuestion("What tools have you used?"), "TECHNICAL_EXPERIENCE");
  assert.equal(classifyApplicationQuestion("What is your favorite color?"), "UNKNOWN");
});

test("motivation requires temporary user intent and does not invent it", () => {
  const missing = buildApplicationAnswerDraft({ profile, packet, question: "Why this company?" });
  assert.equal(missing.status, "NEEDS_USER_INPUT");
  assert.match(missing.message, /interests/i);
  const supplied = buildApplicationAnswerDraft({ profile, packet, question: "Why this company?", userIntent: "I want to work on public-interest programs." });
  assert.equal(supplied.status, "CURRENT");
  assert.match(supplied.content.text, /public-interest programs/);
});

test("unknown and stale inputs fail closed", () => {
  const unknown = buildApplicationAnswerDraft({ profile, packet, question: "Tell us something unusual" });
  assert.equal(unknown.status, "NEEDS_CLARIFICATION");
  const stale = buildCoverLetterDraft({ profile, packet: { ...packet, status: "APPLICATION_EVIDENCE_STALE", message: "Re-analyze" } });
  assert.equal(stale.status, "APPLICATION_EVIDENCE_STALE");
});
