import test from "node:test";
import assert from "node:assert/strict";
import { classifyDiscoveryProviders, isDiscoveryProviderAuthorized, selectedAuthorizedPrivateSectorProvider } from "./discoveryProviderAuthorization.mjs";

test("provider authorization gate only activates sources with project authority", () => {
  const gate = classifyDiscoveryProviders();
  assert.deepEqual(gate.authorizedForBeta, ["USER_SUPPLIED"]);
  assert.deepEqual(gate.sourceSpecificAuthorized, ["LEVER"]);
  assert.deepEqual(gate.authorizedEmployerSources.map((source) => source.sourceId), ["lever-freedompay"]);
  assert.equal(gate.providers.USAJOBS.classification, "WRITTEN_APPROVAL_REQUIRED");
  assert.equal(gate.providers.LEVER.classification, "SOURCE_SPECIFIC_AUTHORITY_AVAILABLE");
  assert.match(gate.providers.LEVER.evidence, /source-specific authority/i);
  assert.equal(isDiscoveryProviderAuthorized("USAJOBS"), false);
  assert.equal(isDiscoveryProviderAuthorized("USER_SUPPLIED"), true);
  assert.equal(isDiscoveryProviderAuthorized("LEVER"), false);
  assert.equal(gate.newProviderActivation, "AUTHORIZED");
  assert.equal(selectedAuthorizedPrivateSectorProvider(gate), "LEVER");
});

test("private-sector candidates remain blocked until retention and derived-analysis rights are recorded", () => {
  const gate = classifyDiscoveryProviders();
  for (const provider of ["GREENHOUSE", "ASHBY", "JOOBLE", "ADZUNA", "THEIRSTACK", "LIGHTCAST", "THE_MUSE", "SMARTRECRUITERS"]) {
    assert.equal(gate.providers[provider].classification, "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN");
    assert.match(gate.providers[provider].requiredAuthority.join(" "), /retention|derived analysis|partner|commercial|employer/i);
  }
  assert.equal(gate.providers.LEVER.classification, "SOURCE_SPECIFIC_AUTHORITY_AVAILABLE");
  assert.match(gate.providers.LEVER.requiredAuthority.join(" "), /additional Lever employer source/i);
});

test("Lever returns to authorization-unproven copy when no governed source is active", () => {
  const gate = classifyDiscoveryProviders({ registry: [] });
  assert.deepEqual(gate.sourceSpecificAuthorized, []);
  assert.deepEqual(gate.authorizedEmployerSources, []);
  assert.equal(gate.providers.LEVER.classification, "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN");
  assert.equal(gate.newProviderActivation, "BLOCKED_PENDING_AUTHORIZATION");
  assert.equal(selectedAuthorizedPrivateSectorProvider(gate), null);
});
