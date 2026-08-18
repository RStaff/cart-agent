import assert from "node:assert/strict";
import test from "node:test";
import { buildResumeDraft, normalizeDraftText } from "./resumeTailoring.mjs";

const profile = { displayName: "Example User", headline: "Program leader", location: "New York", version: 2 };
const packet = { status: "CURRENT", opportunity: { title: "Program Manager", company: "Example" }, sections: { direct: [{ requirement: "lead programs", relationship: "DIRECT", evidence: [{ statement: "Led confirmed programs." }] }], transferable: [{ requirement: "technical workflows", relationship: "TRANSFERABLE", evidence: [{ statement: "Improved a related workflow." }] }], partial: [{ requirement: "metrics", relationship: "PARTIAL", evidence: [] }], unknown: [{ requirement: "certification", relationship: "UNKNOWN", evidence: [] }], specialist: [], scope: [] } };

test("draft uses only confirmed evidence and preserves relationship framing", () => {
  const result = buildResumeDraft({ profile, packet });
  assert.equal(result.status, "CURRENT");
  assert.match(result.content.text, /Led confirmed programs/);
  assert.match(result.content.text, /Improved a related workflow/);
  assert.equal(result.content.blocks[1].relationship, "TRANSFERABLE");
  assert.deepEqual(result.content.reviewNeeded, ["metrics", "certification"]);
  assert.equal(result.content.editedByUser, false);
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
