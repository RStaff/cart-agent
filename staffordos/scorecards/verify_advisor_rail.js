#!/usr/bin/env node

import { getScorecardBySlugOrDomain, answerAskAbando } from "./askAbandoEngine.js";
import { buildAdvisorRail } from "./advisorRailController.js";
import { installScorecardRoute } from "../../web/src/routes/scorecard.esm.js";

function fail(message, context = {}) {
  console.error(JSON.stringify({ ok: false, message, context }, null, 2));
  process.exit(1);
}

const scorecard = getScorecardBySlugOrDomain("northstar-outdoors");
if (!scorecard) {
  fail("Known scorecard was not found");
}

const advisorRail = buildAdvisorRail(scorecard);
if (!advisorRail.title || !advisorRail.truthNote) {
  fail("Advisor rail is missing required metadata", advisorRail);
}

if (!Array.isArray(advisorRail.steps) || advisorRail.steps.length !== 4) {
  fail("Advisor rail must contain exactly 4 guided steps", advisorRail);
}

for (const step of advisorRail.steps) {
  if (!step.id || !step.title || !step.body) {
    fail("Advisor rail step missing required fields", step);
  }
}

if (!advisorRail?.cta?.installPath) {
  fail("Advisor rail CTA missing install path", advisorRail.cta);
}

const howCalculated = answerAskAbando({
  slug: "northstar-outdoors",
  question: "How did you calculate this?",
});
const isRealRevenue = answerAskAbando({
  slug: "northstar-outdoors",
  question: "Is this real revenue?",
});

if (!howCalculated.ok || !isRealRevenue.ok) {
  fail("Ask Abando integration failed", { howCalculated, isRealRevenue });
}

let handler = null;
installScorecardRoute({
  get(route, routeHandler) {
    if (route === "/scorecard/:domain") {
      handler = routeHandler;
    }
  },
});

if (typeof handler !== "function") {
  fail("Scorecard route was not installed");
}

const routeCheck = { status: 200, contentType: null, body: "" };
handler(
  { params: { domain: "northstar-outdoors" }, query: {} },
  {
    status(code) {
      routeCheck.status = code;
      return this;
    },
    type(value) {
      routeCheck.contentType = value;
      return this;
    },
    send(body) {
      routeCheck.body = String(body || "");
      return this;
    },
  },
);

if (routeCheck.status !== 200) {
  fail("Known scorecard route did not return 200", routeCheck);
}

console.log(JSON.stringify({
  ok: true,
  advisorRail: {
    title: advisorRail.title,
    estimatedCompletionLabel: advisorRail.estimatedCompletionLabel,
    truthNote: advisorRail.truthNote,
    steps: advisorRail.steps,
    cta: advisorRail.cta,
  },
  askChecks: [
    {
      question: "How did you calculate this?",
      intent: howCalculated.intent,
      answer: howCalculated.answer,
    },
    {
      question: "Is this real revenue?",
      intent: isRealRevenue.intent,
      answer: isRealRevenue.answer,
    },
  ],
  routeCheck: {
    status: routeCheck.status,
    contentType: routeCheck.contentType,
    hasAdvisorRail: routeCheck.body.includes("Abando Advisor"),
  },
}, null, 2));
