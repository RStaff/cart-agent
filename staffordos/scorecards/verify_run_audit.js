#!/usr/bin/env node

import { resolveRunAuditTarget } from "./runAuditResolver.js";
import { installRunAuditRoute } from "../../web/src/routes/runAudit.esm.js";

function fail(message, context = {}) {
  console.error(JSON.stringify({ ok: false, message, context }, null, 2));
  process.exit(1);
}

const cases = [
  {
    input: "northstar-outdoors.myshopify.com",
    expect: {
      matched: true,
      redirectPath: "/scorecard/northstar-outdoors",
      mode: "scorecard",
    },
  },
  {
    input: "northstar-outdoors",
    expect: {
      matched: true,
      redirectPath: "/scorecard/northstar-outdoors",
      mode: "scorecard",
    },
  },
  {
    input: "https://cutsclothing.com",
    expect: {
      matched: false,
      redirectPath: "/install/shopify?shop=cutsclothing.com",
      mode: "install_fallback",
    },
  },
  {
    input: "unknown-store.myshopify.com",
    expect: {
      matched: false,
      redirectPath: "/install/shopify?shop=unknown-store.myshopify.com",
      mode: "install_fallback",
    },
  },
];

const outputs = cases.map((testCase) => ({
  input: testCase.input,
  result: resolveRunAuditTarget(testCase.input),
}));

for (let index = 0; index < cases.length; index += 1) {
  const expected = cases[index].expect;
  const actual = outputs[index].result;
  if (
    actual.matched !== expected.matched ||
    actual.redirectPath !== expected.redirectPath ||
    actual.mode !== expected.mode
  ) {
    fail("Run-audit resolver case failed", { expected, actual });
  }
}

let handler = null;
installRunAuditRoute({
  get(route, routeHandler) {
    if (route === "/run-audit") {
      handler = routeHandler;
    }
  },
});

if (typeof handler !== "function") {
  fail("Run-audit route was not installed");
}

const pageLoad = { status: 200, type: null, body: "", location: null };
handler(
  { query: {} },
  {
    status(code) {
      pageLoad.status = code;
      return this;
    },
    type(value) {
      pageLoad.type = value;
      return this;
    },
    send(body) {
      pageLoad.body = String(body || "");
      return this;
    },
    redirect(codeOrLocation, maybeLocation) {
      pageLoad.status = typeof maybeLocation === "string" ? Number(codeOrLocation) : 302;
      pageLoad.location = typeof maybeLocation === "string" ? maybeLocation : String(codeOrLocation || "");
      return this;
    },
  },
);

if (pageLoad.status !== 200 || !pageLoad.body.includes("Run a 30-second checkout audit")) {
  fail("Run-audit page did not load", pageLoad);
}

const knownRedirect = { status: 200, location: null };
handler(
  { query: { store: "northstar-outdoors" } },
  {
    status(code) {
      knownRedirect.status = code;
      return this;
    },
    type() {
      return this;
    },
    send() {
      return this;
    },
    redirect(codeOrLocation, maybeLocation) {
      knownRedirect.status = typeof maybeLocation === "string" ? Number(codeOrLocation) : 302;
      knownRedirect.location = typeof maybeLocation === "string" ? maybeLocation : String(codeOrLocation || "");
      return this;
    },
  },
);

if (knownRedirect.status !== 302 || knownRedirect.location !== "/scorecard/northstar-outdoors") {
  fail("Known store did not redirect to scorecard", knownRedirect);
}

console.log(JSON.stringify({
  ok: true,
  outputs,
  routeChecks: {
    pageLoad: {
      status: pageLoad.status,
      type: pageLoad.type,
    },
    knownRedirect,
  },
}, null, 2));
