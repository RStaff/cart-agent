import assert from "node:assert/strict";
import test from "node:test";
import { buildCapabilityDiagnostic } from "./capabilityDiagnostic.mjs";

const profile = { id: "profile-1" };
const source = { id: "source-1", profileId: "profile-1" };
const fact = { id: "fact-1", profileId: "profile-1", sourceId: "source-1", factType: "PROJECT", statement: "In 2022, I led a cross-functional website modernization project and launched on schedule.", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" };

test("diagnostic reports confirmed evidence as actionable capability authority", () => {
  const result = buildCapabilityDiagnostic({ profile, sources: [source], candidates: [], careerFacts: [fact], authorities: [], decisions: [] });
  assert.equal(result.careerFacts.relevantConfirmedFactExists, true);
  assert.ok(result.capabilityDerivation.some((item) => item.capabilityKey === "PROGRAM_DELIVERY"));
  assert.ok(result.capabilityDerivation.every((item) => item.authorityExists === false));
  assert.ok(result.capabilityPage.actionableCapabilityCount > 0);
  assert.equal(result.capabilityPage.completionShouldRender, false);
});

test("unconfirmed, rejected, and deferred candidates do not derive capability authority", () => {
  const candidates = [
    { profileId: "profile-1", status: "PROPOSED" },
    { profileId: "profile-1", status: "REJECTED" },
    { profileId: "profile-1", status: "DEFERRED" },
  ];
  const result = buildCapabilityDiagnostic({ profile, sources: [], candidates, careerFacts: [], authorities: [], decisions: [] });
  assert.equal(result.capabilityDerivation.length, 0);
  assert.equal(result.capabilityPage.actionableCapabilityCount, 0);
});

test("existing decision is preserved while new confirmed provenance is marked actionable", () => {
  const authority = { id: "cap-1", profileId: "profile-1", capabilityKey: "PROGRAM_DELIVERY", label: "Program and project delivery", authorityState: "VERIFIED_DIRECT", provenance: { factIds: ["old-fact"] } };
  const decision = { capabilityId: "cap-1", answer: "DIRECT", supersededAt: null };
  const result = buildCapabilityDiagnostic({ profile, sources: [source], candidates: [], careerFacts: [fact], authorities: [authority], decisions: [decision] });
  const capability = result.capabilityDerivation.find((item) => item.capabilityKey === "PROGRAM_DELIVERY");
  assert.equal(capability.decision, "DIRECT");
  assert.equal(capability.newEvidencePresent, true);
  assert.equal(capability.actionable, true);
  assert.equal(result.capabilityPage.completionShouldRender, false);
});
