import assert from "node:assert/strict";
import test from "node:test";
import { buildApplicationEvidencePacket, buildMatchEvidenceRelationships } from "./applicationEvidence.mjs";

const opportunity = { title: "Program Lead", company: "Example Co", decisionState: "PURSUE" };
const requirements = ["direct", "transfer", "partial", "unknown", "specialist"].map((id, index) => ({ id, text: `${id} requirement`, importance: index === 0 ? "MUST_HAVE" : "PREFERRED" }));
const match = { evaluationVersion: "CAREEROS_MATCH_EVALUATION_V1", stale: false, relationships: [
  { id: "direct", state: "DIRECT", capabilityKey: "PROGRAM_DELIVERY", text: "direct requirement", explanation: "Direct support." },
  { id: "transfer", state: "TRANSFERABLE", capabilityKey: "CROSS_FUNCTIONAL_COORDINATION", text: "transfer requirement", explanation: "Transferable support." },
  { id: "partial", state: "PARTIAL", capabilityKey: "OUTCOME_DELIVERY", text: "partial requirement", explanation: "Partial support." },
  { id: "unknown", state: "UNKNOWN", text: "unknown requirement", explanation: "Not enough evidence." },
  { id: "specialist", state: "SPECIALIST_BLOCKED", text: "specialist requirement", explanation: "Specialist constraint." },
] };

test("builds a current evidence packet from existing relationship states", () => {
  const packet = buildApplicationEvidencePacket({ opportunity, requirements, match, capabilities: [{ capabilityKey: "PROGRAM_DELIVERY", label: "Program delivery", provenance: { factIds: ["fact-1"] } }], facts: [{ id: "fact-1", sourceId: "source-1", statement: "Led a confirmed program.", sourceExcerpt: "Led the program.", scopeStatement: "Cross-functional" }], sources: [{ id: "source-1", sourceType: "OTHER_USER_PROVIDED_TEXT" }] });
  assert.equal(packet.status, "CURRENT");
  assert.equal(packet.sections.direct[0].capability, "Program delivery");
  assert.equal(packet.sections.direct[0].evidence[0].statement, "Led a confirmed program.");
  assert.equal(packet.sections.transferable.length, 1);
  assert.equal(packet.sections.partial.length, 1);
  assert.equal(packet.sections.unknown.length, 1);
  assert.equal(packet.sections.specialist.length, 1);
  assert.equal(packet.summary.direct, 1);
  assert.equal("score" in packet, false);
});

test("stale evaluations are explicitly blocked from current preparation", () => {
  const packet = buildApplicationEvidencePacket({ opportunity, requirements, match: { ...match, stale: true } });
  assert.equal(packet.status, "APPLICATION_EVIDENCE_STALE");
  assert.match(packet.message, /re-analyze/i);
});

test("missing evaluation is not silently generated or treated as evidence", () => {
  const packet = buildApplicationEvidencePacket({ opportunity, requirements, match: null });
  assert.equal(packet.status, "APPLICATION_EVIDENCE_UNAVAILABLE");
});

test("match evidence is attached from tenant-safe authority without exposing internal identifiers", () => {
  const [item] = buildMatchEvidenceRelationships({
    relationships: [{ id: "requirement-1", state: "TRANSFERABLE", capabilityKey: "PROGRAM_DELIVERY", text: "Coordinate delivery", explanation: "Related support." }],
    capabilities: [{ capabilityKey: "PROGRAM_DELIVERY", label: "Program delivery", provenance: { factIds: ["fact-1"], sourceIds: ["source-1"] } }],
    facts: [{ id: "fact-1", sourceId: "source-1", statement: "Led a confirmed delivery program.", sourceExcerpt: "Delivery program excerpt", scopeStatement: "Cross-functional" }],
    sources: [{ id: "source-1", sourceType: "Resume" }],
  });
  assert.equal(item.evidence[0].statement, "Led a confirmed delivery program.");
  assert.equal(item.evidence[0].sourceType, "Resume");
  assert.equal(item.evidence[0].scopeStatement, "Cross-functional");
  assert.equal("id" in item.evidence[0], false);
  assert.equal("sourceId" in item.evidence[0], false);
});
