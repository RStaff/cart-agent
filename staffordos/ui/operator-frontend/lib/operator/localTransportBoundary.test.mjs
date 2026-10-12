import assert from "node:assert/strict";
import test from "node:test";
import { validateLocalTransportRequest } from "./localTransportBoundary.mjs";

const options = { hostname: "127.0.0.1", port: 3210 };
function request(overrides = {}) {
  return { socket: { remoteAddress: "127.0.0.1" }, method: "GET", headers: { host: "127.0.0.1:3210" }, ...overrides };
}

test("local boundary rejects forwarding, wrong peer, host, and cross-origin writes", () => {
  assert.equal(validateLocalTransportRequest(request({ headers: { host: "127.0.0.1:3210", "x-forwarded-for": "127.0.0.1" } }), options), "INCOMING_FORWARDING_HEADERS_REJECTED");
  assert.equal(validateLocalTransportRequest(request({ socket: { remoteAddress: "10.0.0.2" } }), options), "LOCAL_TRANSPORT_PEER_REQUIRED");
  assert.equal(validateLocalTransportRequest(request({ headers: { host: "localhost:3210" } }), options), "LOCAL_TRANSPORT_HOST_REQUIRED");
  assert.equal(validateLocalTransportRequest(request({ method: "POST", headers: { host: "127.0.0.1:3210", origin: "http://evil.test" } }), options), "LOCAL_TRANSPORT_ORIGIN_REQUIRED");
  assert.equal(validateLocalTransportRequest(request({ method: "POST", headers: { host: "127.0.0.1:3210", origin: "http://127.0.0.1:3210" } }), options), "");
});
