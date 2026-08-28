import test from "node:test";
import assert from "node:assert/strict";
import { classifyDiscoveryProviders, selectedAuthorizedPrivateSectorProvider } from "./discoveryProviderAuthorization.mjs";

test("provider authorization gate only activates sources with project authority", () => {
  const gate = classifyDiscoveryProviders();
  assert.deepEqual(gate.authorizedForBeta, ["USAJOBS", "USER_SUPPLIED"]);
  assert.equal(gate.newProviderActivation, "BLOCKED_PENDING_AUTHORIZATION");
  assert.equal(selectedAuthorizedPrivateSectorProvider(gate), null);
});

test("private-sector candidates remain blocked until retention and derived-analysis rights are recorded", () => {
  const gate = classifyDiscoveryProviders();
  for (const provider of ["GREENHOUSE", "ASHBY", "LEVER", "JOOBLE", "ADZUNA", "THEIRSTACK", "LIGHTCAST", "THE_MUSE", "SMARTRECRUITERS"]) {
    assert.equal(gate.providers[provider].classification, "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN");
    assert.match(gate.providers[provider].requiredAuthority.join(" "), /retention|derived analysis|partner|commercial|employer/i);
  }
});
