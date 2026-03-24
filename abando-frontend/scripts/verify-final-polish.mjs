import { readFile } from "node:fs/promises";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";

function fail(message, extra) {
  if (extra !== undefined) {
    console.error(JSON.stringify({ ok: false, message, extra }, null, 2));
  } else {
    console.error(JSON.stringify({ ok: false, message }, null, 2));
  }
  process.exit(1);
}

async function readHtml(pathname) {
  const response = await fetch(`${BASE_URL}${pathname}`);
  const html = await response.text();
  return { status: response.status, html };
}

function assertIncludes(html, text, label) {
  if (!html.includes(text)) {
    fail(`Missing expected text for ${label}`, { text });
  }
}

async function readLocalFile(path) {
  return readFile(path, "utf8");
}

const routes = {
  home: await readHtml("/"),
  runAudit: await readHtml("/run-audit"),
  scorecard: await readHtml("/scorecard/northstar-outdoors"),
  pricing: await readHtml("/pricing"),
  install: await readHtml("/install/shopify"),
  dashboard: await readHtml("/dashboard"),
  dashboardConnected: await readHtml("/dashboard?shop=test-store.myshopify.com&connected=1"),
  dashboardPersisted: await readHtml("/dashboard?shop=persisted-collecting.myshopify.com&connected=1"),
  dashboardCollecting: await readHtml("/dashboard?shop=northstar-outdoors.myshopify.com&connected=1&scorecard=northstar-outdoors"),
  dashboardPartial: await readHtml("/dashboard?shop=partial-proof.myshopify.com&connected=1&scorecard=northstar-outdoors"),
  dashboardConfirmed: await readHtml("/dashboard?shop=confirmed-proof.myshopify.com&connected=1&scorecard=northstar-outdoors"),
  dashboardDisproven: await readHtml("/dashboard?shop=disproven-proof.myshopify.com&connected=1&scorecard=northstar-outdoors"),
  embeddedDashboard: await readHtml("/embedded/dashboard?shop=test-store.myshopify.com&connected=1&embedded=1"),
  betaOps: await readHtml("/ops/beta"),
};

const storefrontDetector = await readLocalFile(
  "/Users/rossstafford/projects/cart-agent/web/src/lib/storefrontCheckoutDetector.js",
);
const storefrontInstallRoute = await readLocalFile(
  "/Users/rossstafford/projects/cart-agent/web/src/routes/installShopify.esm.js",
);
const storefrontSnippetRoute = await readLocalFile(
  "/Users/rossstafford/projects/cart-agent/web/src/routes/snippet.esm.js",
);

for (const [name, route] of Object.entries(routes)) {
  if (route.status !== 200) {
    fail(`Route did not return 200`, { name, status: route.status });
  }
}

for (const [name, route] of Object.entries(routes).filter(([name]) => name !== "embeddedDashboard" && name !== "betaOps")) {
  assertIncludes(route.html, "Run audit", `${name} header`);
  assertIncludes(route.html, "Pricing", `${name} header`);
}

assertIncludes(routes.home.html, "Run your free audit", "homepage CTA");
assertIncludes(routes.home.html, "No signup. No install. No risk.", "homepage free support");
assertIncludes(routes.home.html, "Abando™", "homepage brand");
assertIncludes(routes.runAudit.html, "Run a free 30-second checkout audit", "run audit headline");
assertIncludes(routes.runAudit.html, "No signup. No install. No risk.", "run audit free support");
assertIncludes(routes.runAudit.html, "directional estimate", "run audit trust line");
assertIncludes(routes.runAudit.html, "pre-install scorecard only", "run audit truth boundary");
assertIncludes(routes.pricing.html, "Start with a free audit. Decide after you see real data.", "pricing free line");
assertIncludes(routes.runAudit.html, "Abando™", "run audit brand");
assertIncludes(routes.scorecard.html, "Abando™", "scorecard brand");
assertIncludes(routes.pricing.html, "Abando™", "pricing brand");
assertIncludes(routes.install.html, "Abando™", "install brand");

assertIncludes(routes.scorecard.html, "You are still viewing a free audit — nothing has been installed yet.", "scorecard free line");
assertIncludes(routes.scorecard.html, "Primary finding", "scorecard primary finding");
assertIncludes(routes.scorecard.html, "nothing has been installed yet", "scorecard install boundary");
assertIncludes(routes.scorecard.html, "How this estimate was calculated", "scorecard explainer");
assertIncludes(routes.scorecard.html, "Opportunity gap", "scorecard gap visual");
assertIncludes(routes.scorecard.html, "Where customers may be hesitating", "checkout flow diagram");
assertIncludes(routes.scorecard.html, "What Abando sees", "scorecard bottom close sees");
assertIncludes(routes.scorecard.html, "Why it matters", "scorecard bottom close matters");
assertIncludes(routes.scorecard.html, "What to check first", "scorecard bottom close check");
assertIncludes(routes.scorecard.html, "Next step", "scorecard bottom close next");
assertIncludes(routes.scorecard.html, "Customers may hesitate here", "checkout flow hesitation label");
assertIncludes(routes.scorecard.html, "Estimated revenue at risk at this step", "checkout flow revenue tie");
assertIncludes(routes.scorecard.html, "Continue to Shopify approval", "scorecard bottom CTA");
assertIncludes(routes.scorecard.html, "Walk me through this", "guided scorecard launcher");
assertIncludes(routes.scorecard.html, "Guided scorecard mode", "guided scorecard title");
assertIncludes(routes.scorecard.html, "Step 1 of 4", "guided step count");
assertIncludes(routes.scorecard.html, "Check the box below to continue", "guided continue helper");
assertIncludes(routes.scorecard.html, "Required to continue", "guided required badge");
assertIncludes(routes.scorecard.html, "Step complete", "guided complete label");
assertIncludes(routes.scorecard.html, "Ready to continue", "guided ready badge");
assertIncludes(routes.scorecard.html, "This is worth checking", "guided ack step 1");
assertIncludes(routes.scorecard.html, "What Abando found", "guided step 2");
assertIncludes(routes.scorecard.html, "I understand where the issue is", "guided ack step 2");
assertIncludes(routes.scorecard.html, "Why Abando believes this", "guided step 3");
assertIncludes(routes.scorecard.html, "This explanation makes sense", "guided ack step 3");
assertIncludes(routes.scorecard.html, "Final step", "guided final-step label");
assertIncludes(routes.scorecard.html, "Confirm this on your real checkout", "guided step 4");
assertIncludes(routes.scorecard.html, "Back", "guided back control");
assertIncludes(routes.scorecard.html, "Next", "guided next control");
assertIncludes(routes.scorecard.html, "Complete the step check to continue", "guided next disabled hint");
assertIncludes(routes.scorecard.html, "You’ve completed the walkthrough. The next step is Shopify approval.", "guided completion handoff");
assertIncludes(routes.scorecard.html, "Return to scorecard", "guided return action");
assertIncludes(routes.scorecard.html, "Continue to Shopify approval", "guided install CTA");
assertIncludes(routes.scorecard.html, "See quick summary", "scorecard slide-over trigger");
assertIncludes(routes.scorecard.html, "Quick scorecard view", "scorecard slide-over title");
assertIncludes(routes.scorecard.html, "Ask what this means for your checkout", "advisor input");
assertIncludes(routes.scorecard.html, "See my real checkout data", "scorecard install CTA");

const suggestionChecks = [
  "Is this revenue estimate real?",
  "What should I fix first?",
  "What happens after install?",
];

for (const suggestion of suggestionChecks) {
  assertIncludes(routes.scorecard.html, suggestion, `advisor suggestion ${suggestion}`);
}

if (routes.scorecard.html.includes("Why this estimate?")) {
  fail("Old advisor suggestion chip still present");
}

const chipCount = suggestionChecks.reduce((count, suggestion) => count + (routes.scorecard.html.includes(suggestion) ? 1 : 0), 0);
if (chipCount !== 3) {
  fail("Advisor suggestion chip count mismatch", { chipCount });
}

assertIncludes(routes.install.html, "What happens next", "install sequence");
assertIncludes(routes.install.html, "Running the audit does not create the dashboard.", "install dashboard truth");
assertIncludes(routes.install.html, "No changes are made without your approval.", "install reassurance");
assertIncludes(routes.install.html, "Billing is not collected on this page.", "install billing note");
assertIncludes(routes.install.html, "Real tracking appears only after connection is complete and live activity starts arriving.", "install tracking truth");
const installDemo = await readHtml("/install/shopify?shop=northstar-outdoors.myshopify.com");
if (installDemo.status !== 200) {
  fail("Demo install route did not return 200", { status: installDemo.status });
}
assertIncludes(installDemo.html, "Demo scorecard detected", "install demo guard");
assertIncludes(installDemo.html, "enter your actual Shopify domain below", "install demo explanation");

assertIncludes(routes.dashboard.html, "Shopify connected to Abando™", "dashboard hero");
assertIncludes(routes.dashboard.html, "Predicted before install", "dashboard predicted label");
assertIncludes(routes.dashboard.html, "Confirmed after install", "dashboard confirmed label");
assertIncludes(routes.dashboard.html, "Still being measured", "dashboard measuring label");
assertIncludes(routes.dashboard.html, "Not started", "dashboard pending confirmation state");
assertIncludes(routes.dashboard.html, "View connection status", "dashboard primary CTA");
assertIncludes(routes.dashboard.html, "How Abando reports this", "dashboard trust footer");
assertIncludes(routes.dashboard.html, "Sample size / window", "dashboard sample size label");
assertIncludes(routes.dashboardConnected.html, "Shopify connected to Abando™", "dashboard connected heading");
assertIncludes(routes.dashboardConnected.html, "test-store.myshopify.com", "dashboard connected domain");
assertIncludes(routes.dashboardConnected.html, "Predicted before install", "dashboard connected predicted label");
assertIncludes(routes.dashboardConnected.html, "Confirmed after install", "dashboard connected confirmed label");
assertIncludes(routes.dashboardConnected.html, "Still being measured", "dashboard connected measuring label");
assertIncludes(routes.dashboardConnected.html, "Not started", "dashboard tracking state");
assertIncludes(routes.dashboardConnected.html, "Abando has not observed enough live checkout behavior to evaluate the original prediction yet.", "dashboard connected summary");
assertIncludes(routes.dashboardConnected.html, "Let checkout activity start arriving so Abando can begin comparing the original prediction with live behavior.", "dashboard next-step state");
assertIncludes(routes.dashboardConnected.html, "Dev proof state", "dashboard dev proof heading");
assertIncludes(routes.dashboardPersisted.html, "persisted-collecting.myshopify.com", "persisted dashboard domain");
assertIncludes(routes.dashboardPersisted.html, "Persistent shop state loaded from durable storage", "persisted dashboard activity");
assertIncludes(routes.dashboardPersisted.html, "Collecting live checkout signals", "persisted dashboard status");
assertIncludes(routes.dashboardCollecting.html, "Collecting live checkout signals", "collecting status");
assertIncludes(routes.dashboardCollecting.html, "There is not enough checkout activity yet to confirm the original prediction.", "collecting summary");
assertIncludes(routes.dashboardPartial.html, "Early evidence in the predicted direction", "partial status");
assertIncludes(routes.dashboardPartial.html, "Early checkout activity suggests the original slowdown may be real.", "partial summary");
assertIncludes(routes.dashboardConfirmed.html, "Confirmed by live checkout behavior", "confirmed status");
assertIncludes(routes.dashboardConfirmed.html, "Live checkout behavior is confirming the same slowdown the scorecard predicted.", "confirmed summary");
assertIncludes(routes.dashboardDisproven.html, "A different pattern is showing up", "disproven status");
assertIncludes(routes.dashboardDisproven.html, "Live checkout behavior is not confirming the original prediction.", "disproven summary");
assertIncludes(routes.embeddedDashboard.html, "Abando Dashboard", "embedded dashboard hero");
assertIncludes(routes.embeddedDashboard.html, "Predicted before install", "embedded dashboard predicted label");
assertIncludes(routes.embeddedDashboard.html, "Confirmed after install", "embedded dashboard confirmed label");
assertIncludes(routes.embeddedDashboard.html, "Ask Abando about this checkout pattern", "embedded dashboard advisor");
assertIncludes(routes.embeddedDashboard.html, "How Abando reports this", "embedded dashboard trust");
assertIncludes(routes.betaOps.html, "Abando beta merchant workflow", "beta ops heading");
assertIncludes(routes.betaOps.html, "Internal beta ops", "beta ops label");
assertIncludes(routes.betaOps.html, "Northstar Outdoors", "beta ops seeded merchant");

const callbackSuccess = await fetch(`${BASE_URL}/shopify/callback?shop=test-store.myshopify.com&code=test-code`, {
  redirect: "manual",
});
if (callbackSuccess.status !== 302) {
  fail("Successful callback did not redirect", { status: callbackSuccess.status });
}
const successLocation = callbackSuccess.headers.get("location") || "";
if (!successLocation.includes("/dashboard?shop=test-store.myshopify.com&connected=1")) {
  fail("Successful callback did not redirect to dashboard", { location: callbackSuccess.headers.get("location") });
}
if (!successLocation.includes("tracking=awaiting_live_activity")) {
  fail("Successful callback did not include tracking state", { location: callbackSuccess.headers.get("location") });
}
if (!successLocation.includes("source=shopify_callback")) {
  fail("Successful callback did not include callback source context", { location: callbackSuccess.headers.get("location") });
}

const callbackFailure = await fetch(`${BASE_URL}/shopify/callback`, { redirect: "manual" });
if (callbackFailure.status !== 302) {
  fail("Failed callback did not redirect", { status: callbackFailure.status });
}
const failureLocation = callbackFailure.headers.get("location") || "";
if (!failureLocation.includes("/install/shopify?error=connection_not_completed") && !failureLocation.includes("/install/shopify?")) {
  fail("Failed callback did not redirect to safe install fallback", { location: callbackFailure.headers.get("location") });
}
if (!failureLocation.includes("source=shopify_callback")) {
  fail("Failed callback did not include callback source context", { location: callbackFailure.headers.get("location") });
}
const installError = await readHtml("/install/shopify?error=connection_not_completed");
if (installError.status !== 200) {
  fail("Install error route did not return 200", { status: installError.status });
}
assertIncludes(installError.html, "Connection not completed yet", "install error state");

const callbackConnectedDashboard = await readHtml("/dashboard?shop=test-store.myshopify.com&connected=1&tracking=awaiting_live_activity&source=shopify_callback");
if (callbackConnectedDashboard.status !== 200) {
  fail("Callback-connected dashboard route did not return 200", { status: callbackConnectedDashboard.status });
}
assertIncludes(callbackConnectedDashboard.html, "Shopify connected to Abando™", "dashboard callback success banner");
assertIncludes(callbackConnectedDashboard.html, "Not started", "dashboard callback tracking state");
assertIncludes(callbackConnectedDashboard.html, "Still being measured", "dashboard callback measuring label");

const callbackPersistent = await fetch(`${BASE_URL}/shopify/callback?shop=northstar-outdoors.myshopify.com&code=test-code`, {
  redirect: "manual",
});
if (callbackPersistent.status !== 302) {
  fail("Persistent callback did not redirect", { status: callbackPersistent.status });
}
const persistedDashboard = await readHtml("/dashboard?shop=northstar-outdoors.myshopify.com&connected=1");
if (persistedDashboard.status !== 200) {
  fail("Persisted dashboard route did not return 200", { status: persistedDashboard.status });
}
assertIncludes(persistedDashboard.html, "Persistent shop state loaded from durable storage", "persisted callback storage");

const invalidEventPost = await fetch(`${BASE_URL}/api/checkout-events`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ shop: "bad-store.myshopify.com" }),
});
if (invalidEventPost.status !== 400) {
  fail("Invalid checkout event payload was not rejected", { status: invalidEventPost.status });
}

const checkoutOptions = await fetch(`${BASE_URL}/api/checkout-events`, {
  method: "OPTIONS",
});
if (checkoutOptions.status !== 204) {
  fail("Checkout event CORS preflight did not return 204", { status: checkoutOptions.status });
}

const eventProofShop = `event-proof-${Date.now()}.myshopify.com`;
const eventProofCallback = await fetch(`${BASE_URL}/shopify/callback?shop=${encodeURIComponent(eventProofShop)}&code=test-code`, {
  redirect: "manual",
});
if (eventProofCallback.status !== 302) {
  fail("Event proof callback did not redirect", { status: eventProofCallback.status });
}

const beforeEventDashboard = await readHtml(`/dashboard?shop=${encodeURIComponent(eventProofShop)}&connected=1`);
if (beforeEventDashboard.status !== 200) {
  fail("Pre-event dashboard route did not return 200", { status: beforeEventDashboard.status });
}
assertIncludes(beforeEventDashboard.html, "Not started", "pre-event dashboard state");

const validEventPost = await fetch(`${BASE_URL}/api/checkout-events`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify([
    {
      shop: eventProofShop,
      session_id: "verify-session-1",
      timestamp: "2026-03-19T17:00:00.000Z",
      event_type: "cart_view",
      stage: "cart",
      device_type: "mobile",
      order_id: null,
      amount: null,
      source: "live_storefront",
      metadata: { verifier: true, step: 1 },
    },
    {
      shop: eventProofShop,
      session_id: "verify-session-1",
      timestamp: "2026-03-19T17:00:01.000Z",
      event_type: "checkout_started",
      stage: "checkout",
      device_type: "mobile",
      order_id: null,
      amount: null,
      source: "live_storefront",
      metadata: { verifier: true, step: 2 },
    },
  ]),
});
if (validEventPost.status !== 200) {
  fail("Valid checkout event payload was not accepted", { status: validEventPost.status });
}
const validEventPayload = await validEventPost.json();
if (!validEventPayload.ok || validEventPayload.saved !== 2) {
  fail("Valid checkout event payload did not persist expected records", { payload: validEventPayload });
}

const afterEventDashboard = await readHtml(`/dashboard?shop=${encodeURIComponent(eventProofShop)}&connected=1`);
if (afterEventDashboard.status !== 200) {
  fail("Post-event dashboard route did not return 200", { status: afterEventDashboard.status });
}
assertIncludes(afterEventDashboard.html, "Collecting live checkout signals", "post-event dashboard state");
assertIncludes(afterEventDashboard.html, "Current confirmation status", "post-event dashboard confirmation block");
assertIncludes(afterEventDashboard.html, "Latest event source:", "dashboard proof latest live source label");
assertIncludes(afterEventDashboard.html, "live_storefront", "dashboard proof latest live source value");
assertIncludes(afterEventDashboard.html, "Persisted event count:", "dashboard proof event count");
assertIncludes(afterEventDashboard.html, "Confirmation sample size:", "dashboard proof sample size");

const pixelSourcePost = await fetch(`${BASE_URL}/api/checkout-events`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    shop: eventProofShop,
    session_id: "verify-session-pixel",
    timestamp: "2026-03-19T17:00:02.000Z",
    event_type: "checkout_started",
    stage: "checkout",
    device_type: "mobile",
    order_id: null,
    amount: null,
    source: "pixel",
    metadata: { verifier: true, bridge: "source-allowlist" },
  }),
});
if (pixelSourcePost.status !== 200) {
  fail("Pixel source label was not accepted", { status: pixelSourcePost.status });
}

assertIncludes(storefrontDetector, "sendNormalizedCheckoutEvent('checkout_started', 'checkout')", "storefront checkout start sender");
assertIncludes(storefrontDetector, "source: 'live_storefront'", "storefront live source label");
assertIncludes(storefrontDetector, "/api/checkout-events", "storefront normalized endpoint");
assertIncludes(storefrontDetector, "abando_storefront_event_dedupe_v1", "storefront dedupe session key");
assertIncludes(storefrontDetector, "abando-proof-post-status", "storefront proof post marker");
assertIncludes(storefrontDetector, "abando_proof", "storefront proof query flag");
assertIncludes(storefrontInstallRoute, "buildScriptTagSrc", "script tag src builder");
assertIncludes(storefrontInstallRoute, "event_base", "script tag event base wiring");
assertIncludes(storefrontInstallRoute, "shop", "script tag shop wiring");
assertIncludes(storefrontSnippetRoute, "Resolved Shop", "snippet proof resolved shop");
assertIncludes(storefrontSnippetRoute, "Post Status", "snippet proof post status");

const forbiddenPromiseTexts = [
  "run audit creates your dashboard",
  "the audit creates the dashboard",
  "dashboard opens with real data",
];

for (const forbiddenText of forbiddenPromiseTexts) {
  const pages = [routes.home.html, routes.runAudit.html, routes.scorecard.html, routes.pricing.html, routes.install.html];
  if (pages.some((html) => html.toLowerCase().includes(forbiddenText))) {
    fail("Found forbidden public promise text", { forbiddenText });
  }
}

assertIncludes(
  routes.pricing.html,
  "The audit you see before install is a benchmark-based estimate — real tracking begins after connecting your store.",
  "pricing trust boundary",
);
assertIncludes(routes.pricing.html, "Why Abando feels different", "pricing differentiation");
assertIncludes(routes.pricing.html, "Validate the issue and start seeing real checkout behavior.", "starter value");
assertIncludes(routes.pricing.html, "See the checkout more clearly and act faster on drop-off patterns.", "growth value");

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl: BASE_URL,
      routes: Object.fromEntries(Object.entries(routes).map(([name, route]) => [name, route.status])),
      verified: {
        sharedHeader: true,
        scorecardExplainer: true,
        advisorSuggestions: suggestionChecks,
        installTrustBlock: true,
        pricingTrustBoundary: true,
        homepageRunAuditAlignment: true,
      },
    },
    null,
    2,
  ),
);
