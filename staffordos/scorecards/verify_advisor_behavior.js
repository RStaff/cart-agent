#!/usr/bin/env node

import { getScorecardBySlugOrDomain, answerAskAbando } from "./askAbandoEngine.js";
import { buildAdvisorRail } from "./advisorRailController.js";
import { classifyBehaviorQuestion } from "./advisorRailBehavior.js";
import { installScorecardRoute } from "../../web/src/routes/scorecard.esm.js";

function fail(message, context = {}) {
  console.error(JSON.stringify({ ok: false, message, context }, null, 2));
  process.exit(1);
}

const scorecard = getScorecardBySlugOrDomain("northstar-outdoors");
if (!scorecard) {
  fail("Known scorecard not found");
}

const advisorRail = buildAdvisorRail(scorecard);
const states = advisorRail.behavior || {};
const requiredStates = [
  "INITIAL_INSIGHT",
  "SKEPTICAL_PAUSE",
  "DOUBT_RESPONSE",
  "VALUE_REFRAME",
  "CLOSE_READY",
  "QA_MODE",
];

for (const stateName of requiredStates) {
  const state = states[stateName];
  if (!state || !state.message || !Array.isArray(state.ctas) || !state.ctas.length) {
    fail("Advisor behavior state missing required fields", { stateName, state });
  }
}

if (classifyBehaviorQuestion("is this real?") !== "DOUBT_RESPONSE") {
  fail("Doubt question did not route to DOUBT_RESPONSE");
}
if (classifyBehaviorQuestion("what should I fix first?") !== "VALUE_REFRAME") {
  fail("Fix question did not route to VALUE_REFRAME");
}
if (classifyBehaviorQuestion("what happens after install?") !== "CLOSE_READY") {
  fail("Install question did not route to CLOSE_READY");
}

const doubtAnswer = answerAskAbando({ slug: "northstar-outdoors", question: "is this real?" });
const fixAnswer = answerAskAbando({ slug: "northstar-outdoors", question: "what should I fix first?" });
const installAnswer = answerAskAbando({ slug: "northstar-outdoors", question: "what happens after install?" });

let handler = null;
installScorecardRoute({
  get(route, routeHandler) {
    if (route === "/scorecard/:domain") handler = routeHandler;
  },
});
const routeState = { status: 200, type: null };
handler(
  { params: { domain: "northstar-outdoors" }, query: {} },
  {
    status(code) { routeState.status = code; return this; },
    type(value) { routeState.type = value; return this; },
    send() { return this; },
  },
);
if (routeState.status !== 200) {
  fail("Scorecard page no longer renders 200", routeState);
}

console.log(JSON.stringify({
  ok: true,
  behaviorStates: requiredStates.map((name) => ({
    state: name,
    label: states[name].label,
    hasMessage: Boolean(states[name].message),
    ctaCount: states[name].ctas.length,
  })),
  routingChecks: {
    doubt: classifyBehaviorQuestion("is this real?"),
    fix: classifyBehaviorQuestion("what should I fix first?"),
    install: classifyBehaviorQuestion("what happens after install?"),
  },
  askChecks: [
    { intent: doubtAnswer.intent, followUpSuggestion: doubtAnswer.followUpSuggestion, installPrompt: doubtAnswer.installPrompt },
    { intent: fixAnswer.intent, followUpSuggestion: fixAnswer.followUpSuggestion, installPrompt: fixAnswer.installPrompt },
    { intent: installAnswer.intent, followUpSuggestion: installAnswer.followUpSuggestion, installPrompt: installAnswer.installPrompt },
  ],
  routeState,
}, null, 2));
