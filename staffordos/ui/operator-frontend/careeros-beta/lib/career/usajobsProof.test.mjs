import test from "node:test";
import assert from "node:assert/strict";
import { proveUsajobsRuntime } from "./usajobsProof.mjs";

function response(status, body) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

test("missing credentials fail closed without calling USAJOBS", async () => {
  let calls = 0;
  const result = await proveUsajobsRuntime({ env: {}, fetchImpl: async () => { calls += 1; } });
  assert.deepEqual(result, { apiKey: "ABSENT", userAgentEmail: "ABSENT", providerHttpStatus: null, providerRecognized: false, resultCount: 0, authentication: "NOT_ATTEMPTED" });
  assert.equal(calls, 0);
});

test("missing email fails closed without calling USAJOBS", async () => {
  let calls = 0;
  const result = await proveUsajobsRuntime({ env: { USAJOBS_API_KEY: "secret" }, fetchImpl: async () => { calls += 1; } });
  assert.equal(result.apiKey, "PRESENT");
  assert.equal(result.userAgentEmail, "ABSENT");
  assert.equal(result.authentication, "NOT_ATTEMPTED");
  assert.equal(calls, 0);
});

test("present credentials make one bounded USAJOBS request and sanitize the result", async () => {
  let calls = 0;
  let request;
  const result = await proveUsajobsRuntime({
    env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" },
    fetchImpl: async (url, options) => {
      calls += 1;
      request = { url: String(url), options };
      return response(200, { SearchResult: { SearchResultItems: [{ MatchedObjectId: "private-provider-id" }] } });
    }
  });
  assert.equal(calls, 1);
  assert.match(request.url, /ResultsPerPage=1/);
  assert.equal(request.options.headers.Host, "data.usajobs.gov");
  assert.ok(request.options.headers["User-Agent"]);
  assert.ok(request.options.headers["Authorization-Key"]);
  assert.deepEqual(result, { apiKey: "PRESENT", userAgentEmail: "PRESENT", providerHttpStatus: 200, providerRecognized: true, resultCount: 1, authentication: "PASS" });
  assert.equal("MatchedObjectId" in result, false);
});

for (const status of [401, 403, 429, 500]) {
  test(`provider ${status} fails safely`, async () => {
    const result = await proveUsajobsRuntime({
      env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" },
      fetchImpl: async () => response(status, { sensitive: "not returned" })
    });
    assert.equal(result.providerHttpStatus, status);
    assert.equal(result.providerRecognized, false);
    assert.equal(result.authentication, "FAIL");
    assert.equal("sensitive" in result, false);
  });
}

test("malformed and timeout responses fail safely", async () => {
  const malformed = await proveUsajobsRuntime({
    env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" },
    fetchImpl: async () => response(200, { unexpected: true })
  });
  assert.equal(malformed.authentication, "FAIL");
  assert.equal(malformed.providerRecognized, false);

  const timeout = await proveUsajobsRuntime({
    env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" },
    fetchImpl: async () => { throw new Error("timeout"); }
  });
  assert.equal(timeout.authentication, "FAIL");
  assert.equal(timeout.providerHttpStatus, null);
});
