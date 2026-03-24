#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installRevenueLeakageEntryRoute } from "../../web/src/routes/revenueLeakageEntry.esm.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scorecardPath = path.resolve(__dirname, "scorecards_output.json");

function fail(message, context = {}) {
  console.error(JSON.stringify({ ok: false, message, context }, null, 2));
  process.exit(1);
}

if (!fs.existsSync(scorecardPath)) {
  fail("Missing scorecards_output.json", { scorecardPath });
}

let handler = null;
const app = {
  get(route, routeHandler) {
    if (route === "/test-revenue-leakage") {
      handler = routeHandler;
    }
  },
};

installRevenueLeakageEntryRoute(app);

if (typeof handler !== "function") {
  fail("Route handler was not installed");
}

function runRequest(query = {}) {
  const result = {
    status: 200,
    contentType: null,
    location: null,
    body: "",
  };

  const req = { query };
  const res = {
    status(code) {
      result.status = code;
      return this;
    },
    type(value) {
      result.contentType = value;
      return this;
    },
    send(body) {
      result.body = String(body || "");
      return this;
    },
    redirect(codeOrLocation, maybeLocation) {
      if (typeof maybeLocation === "string") {
        result.status = Number(codeOrLocation) || 302;
        result.location = maybeLocation;
      } else {
        result.status = 302;
        result.location = String(codeOrLocation || "");
      }
      return this;
    },
  };

  handler(req, res);
  return result;
}

const pageLoad = runRequest();
if (pageLoad.status !== 200 || !pageLoad.body.includes("Test your Shopify revenue leakage")) {
  fail("Public entry page did not load correctly", pageLoad);
}

const knownStore = runRequest({ shop: "northstar-outdoors.myshopify.com" });
if (knownStore.status !== 302 || knownStore.location !== "/scorecard/northstar-outdoors") {
  fail("Known store did not redirect to scorecard", knownStore);
}

const unknownStore = runRequest({ shop: "unknown-store.myshopify.com" });
if (
  unknownStore.status !== 200 ||
  !unknownStore.body.includes("We don’t have a public scorecard for this store yet.") ||
  !unknownStore.body.includes("/install/shopify?shop=unknown-store.myshopify.com")
) {
  fail("Unknown store did not render truthful install fallback", unknownStore);
}

console.log(JSON.stringify({
  ok: true,
  route: "/test-revenue-leakage",
  cases: {
    pageLoad: {
      status: pageLoad.status,
      contentType: pageLoad.contentType,
    },
    knownStore: {
      status: knownStore.status,
      location: knownStore.location,
    },
    unknownStore: {
      status: unknownStore.status,
      hasFallbackMessage: unknownStore.body.includes("We don’t have a public scorecard for this store yet."),
      hasInstallPath: unknownStore.body.includes("/install/shopify?shop=unknown-store.myshopify.com"),
    },
  },
}, null, 2));
