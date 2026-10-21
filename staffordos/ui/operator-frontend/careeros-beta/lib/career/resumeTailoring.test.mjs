import assert from "node:assert/strict";
import test from "node:test";
import { buildResumeDraft, normalizeDraftText } from "./resumeTailoring.mjs";

const profile = { displayName: "Example User", headline: "Program leader", location: "New York", version: 2 };
const packet = { status: "CURRENT", opportunity: { title: "Program Manager", company: "Example" }, sections: { direct: [{ requirement: "lead programs", relationship: "DIRECT", evidence: [{ statement: "Led confirmed programs." }] }], transferable: [{ requirement: "technical workflows", relationship: "TRANSFERABLE", evidence: [{ statement: "Improved a related workflow." }] }], partial: [{ requirement: "metrics", relationship: "PARTIAL", evidence: [] }], unknown: [{ requirement: "certification", relationship: "UNKNOWN", evidence: [] }], specialist: [], scope: [] } };

test("draft is structured and keeps relationship metadata outside applicant-facing text", () => {
  const result = buildResumeDraft({ profile, packet });
  assert.equal(result.status, "CURRENT");
  assert.match(result.content.text, /Led confirmed programs/);
  assert.match(result.content.text, /Improved a related workflow/);
  assert.match(result.content.text, /Professional Summary/);
  assert.match(result.content.text, /Experience Highlights/);
  assert.doesNotMatch(result.content.text, /Confirmed experience:|Relevant to:|CareerOS/);
  assert.equal(result.content.blocks[1].relationship, "TRANSFERABLE");
  assert.deepEqual(result.content.reviewNeeded, ["metrics", "certification"]);
  assert.equal(result.content.editedByUser, false);
});

test("duplicate evidence becomes one resume bullet", () => {
  const result = buildResumeDraft({ profile, packet: { ...packet, sections: { ...packet.sections, transferable: [{ requirement: "same", relationship: "TRANSFERABLE", evidence: [{ statement: "Led confirmed programs" }, { statement: "Improved a related workflow." }] }] } } });
  assert.equal((result.content.text.match(/Led confirmed programs\./g) || []).length, 1);
});

test("known employment metadata is grouped without inventing missing chronology", () => {
  const result = buildResumeDraft({ profile, packet: { ...packet, sections: { ...packet.sections, direct: [{ requirement: "delivery", relationship: "DIRECT", evidence: [{ statement: "Led delivery", employer: "Example Co", title: "Program Lead" }] }] } } });
  assert.match(result.content.text, /Professional Experience/);
  assert.match(result.content.text, /Program Lead \| Example Co/);
  assert.match(result.content.text, /Led delivery\./);
  assert.doesNotMatch(result.content.text, /2020|Present/);
});

test("unsupported requirements remain review-needed metadata", () => {
  const result = buildResumeDraft({ profile, packet });
  assert.deepEqual(result.content.reviewNeeded, ["metrics", "certification"]);
  assert.doesNotMatch(result.content.text, /metrics|certification/);
});

test("target tailoring changes presentation without changing evidence authority", () => {
  const before = JSON.stringify(packet);
  const result = buildResumeDraft({ profile, packet });
  assert.equal(result.content.targetRole, "Program Manager");
  assert.match(result.content.text, /Target role: Program Manager/);
  assert.equal(JSON.stringify(packet), before);
  assert.equal(result.content.blocks[0].grounding, "SUPPORTED");
});

test("stale evidence cannot generate a current draft", () => {
  const result = buildResumeDraft({ profile, packet: { ...packet, status: "APPLICATION_EVIDENCE_STALE", message: "Re-analyze" } });
  assert.equal(result.status, "APPLICATION_EVIDENCE_STALE");
  assert.equal(result.content, undefined);
});

test("draft text validation is bounded", () => {
  assert.equal(normalizeDraftText("  reviewed draft  "), "reviewed draft");
  assert.throws(() => normalizeDraftText(" "), /DRAFT_TEXT_REQUIRED/);
  assert.throws(() => normalizeDraftText("x".repeat(50001)), /DRAFT_TOO_LARGE/);
});
