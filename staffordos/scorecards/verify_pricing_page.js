#!/usr/bin/env node

import { installPricingRoute } from "../../web/src/routes/pricing.esm.js";

function fail(message, context = {}) {
  console.error(JSON.stringify({ ok: false, message, context }, null, 2));
  process.exit(1);
}

let handler = null;
installPricingRoute({
  get(route, routeHandler) {
    if (route === "/pricing") {
      handler = routeHandler;
    }
  },
});

if (typeof handler !== "function") {
  fail("Pricing route was not installed");
}

const result = { status: 200, type: null, body: "" };
handler(
  {},
  {
    status(code) {
      result.status = code;
      return this;
    },
    type(value) {
      result.type = value;
      return this;
    },
    send(body) {
      result.body = String(body || "");
      return this;
    },
  },
);

const requiredSnippets = [
  "Pricing for Shopify stores looking to recover lost revenue",
  "STARTER",
  "GROWTH",
  "CUSTOM",
  "How this works",
  "The audit you see before install is a benchmark-based estimate — real tracking begins after connecting your store.",
  "/run-audit",
  "/install/shopify?plan=starter",
  "/install/shopify?plan=growth",
];

for (const snippet of requiredSnippets) {
  if (!result.body.includes(snippet)) {
    fail("Pricing page is missing required content", { snippet, result });
  }
}

if (result.status !== 200 || result.type !== "html") {
  fail("Pricing route did not render correctly", result);
}

console.log(JSON.stringify({
  ok: true,
  route: "/pricing",
  status: result.status,
  type: result.type,
  checks: {
    hasHeadline: result.body.includes("Pricing for Shopify stores looking to recover lost revenue"),
    hasStarter: result.body.includes("STARTER"),
    hasGrowth: result.body.includes("GROWTH"),
    hasCustom: result.body.includes("CUSTOM"),
    hasHowItWorks: result.body.includes("How this works"),
    hasTruthBoundary: result.body.includes("The audit you see before install is a benchmark-based estimate — real tracking begins after connecting your store."),
    hasRunAuditCta: result.body.includes("/run-audit"),
    hasStarterCta: result.body.includes("/install/shopify?plan=starter"),
    hasGrowthCta: result.body.includes("/install/shopify?plan=growth"),
  },
}, null, 2));
