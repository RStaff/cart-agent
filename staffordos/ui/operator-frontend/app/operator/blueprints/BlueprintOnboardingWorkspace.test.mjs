import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workspace = fs.readFileSync(new URL("./BlueprintOnboardingWorkspace.tsx", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const listRoute = fs.readFileSync(new URL("../../api/operator/blueprints/route.ts", import.meta.url), "utf8");
const detailRoute = fs.readFileSync(new URL("../../api/operator/blueprints/[engagementId]/route.ts", import.meta.url), "utf8");
const commandRoute = fs.readFileSync(new URL("../../api/operator/blueprints/[engagementId]/commands/route.ts", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../../globals.css", import.meta.url), "utf8");

test("Blueprint workspace uses authenticated server proxies and governed writes", () => {
  for (const route of [listRoute, detailRoute, commandRoute]) {
    assert.match(route, /authorizeStaffordOsOperatorRead/);
    assert.match(route, /STAFFORDOS_OPERATOR_SESSION_COOKIE/);
    assert.match(route, /BLUEPRINT_ONBOARDING_PERMISSION/);
  }
  assert.match(commandRoute, /evaluateOperatorWriteIsolation/);
  assert.match(commandRoute, /authorization\.session\.subject/);
  assert.doesNotMatch(workspace, /INTERNAL_API_KEY|x-internal-api-key/);
});

test("workspace separates evidence, provides progressive controls, and preserves failed forms", () => {
  assert.match(workspace, /Payment-provider evidence and claimed references are not confirmed identity/);
  assert.match(workspace, /Identity review/);
  assert.match(page, /Website inquiries and outbound prospects remain separate/);
  assert.match(workspace, /<details>/);
  assert.match(workspace, /Durable client lookup\/creation is unavailable/);
  assert.match(workspace, /fieldset disabled/);
  assert.doesNotMatch(workspace, /reset\(|\.reset\(/);
  assert.match(workspace, /Refresh engagement/);
  assert.match(workspace, /aria-live="polite"/);
});

test("responsive layout and native controls retain mobile and keyboard operation", () => {
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /\.blueprintWorkspace \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /:focus-visible/);
  assert.match(workspace, /<button type="button"/);
  assert.match(workspace, /<summary>/);
  assert.doesNotMatch(workspace, /onKeyDown|tabIndex=\{-1\}/);
});
