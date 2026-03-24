#!/usr/bin/env node

import { buildGuidedAuditBySlugOrDomain } from "./guidedAuditEngine.js";

function fail(message, context = {}) {
  console.error(JSON.stringify({ ok: false, message, context }, null, 2));
  process.exit(1);
}

const result = buildGuidedAuditBySlugOrDomain("northstar-outdoors");

if (!result.ok || !result.guidedAudit) {
  fail("Guided audit did not load for known slug", result);
}

const { guidedAudit } = result;
if (!Array.isArray(guidedAudit.steps) || guidedAudit.steps.length < 4) {
  fail("Guided audit must contain at least 4 steps", guidedAudit);
}

for (const step of guidedAudit.steps) {
  if (!step.id || !step.title || !step.body) {
    fail("Guided audit step missing required fields", step);
  }
}

if (!guidedAudit?.cta?.installPath) {
  fail("Guided audit CTA missing installPath", guidedAudit.cta);
}

console.log(JSON.stringify({
  ok: true,
  guidedAudit: {
    slug: guidedAudit.slug,
    steps: guidedAudit.steps,
    cta: guidedAudit.cta,
  },
}, null, 2));
