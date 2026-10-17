import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workspace = fs.readFileSync(new URL("./BlueprintOnboardingWorkspace.tsx", import.meta.url), "utf8");
const deliverablesWorkspace = fs.readFileSync(new URL("./BlueprintDeliverablesWorkspace.tsx", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const listRoute = fs.readFileSync(new URL("../../api/operator/blueprints/route.ts", import.meta.url), "utf8");
const detailRoute = fs.readFileSync(new URL("../../api/operator/blueprints/[engagementId]/route.ts", import.meta.url), "utf8");
const commandRoute = fs.readFileSync(new URL("../../api/operator/blueprints/[engagementId]/commands/route.ts", import.meta.url), "utf8");
const deliverableReadRoute = fs.readFileSync(new URL("../../api/operator/blueprints/[engagementId]/deliverables/route.ts", import.meta.url), "utf8");
const deliverableCommandRoute = fs.readFileSync(new URL("../../api/operator/blueprints/[engagementId]/deliverables/commands/route.ts", import.meta.url), "utf8");
const deliverableProxy = fs.readFileSync(new URL("../../../lib/operator/blueprintDeliverableOperator.mjs", import.meta.url), "utf8");
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
  assert.match(workspace, /refreshDetail\(detail\.engagement\.id\)/);
  assert.match(workspace, /void loadDetail\(id\)\.catch/);
  assert.match(workspace, /aria-live="polite"/);
});

test("responsive layout and native controls retain mobile and keyboard operation", () => {
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /\.blueprintWorkspace \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.blueprintDeliverablesWorkspace/);
  assert.match(css, /\.blueprintDeliverableCard summary/);
  assert.match(css, /:focus-visible/);
  assert.match(workspace, /<button type="button"/);
  assert.match(workspace, /<summary>/);
  assert.doesNotMatch(workspace, /onKeyDown|tabIndex=\{-1\}/);
});

test("Step 5B deliverables use the exact authority and only approved commands", () => {
  for (const route of [deliverableReadRoute, deliverableCommandRoute]) {
    assert.match(route, /authorizeStaffordOsOperatorRead/);
    assert.match(route, /BLUEPRINT_DELIVERABLE_PERMISSION/);
  }
  assert.match(deliverableCommandRoute, /evaluateOperatorWriteIsolation/);
  assert.match(deliverableCommandRoute, /authorization\.session\.subject/);
  assert.match(deliverableProxy, /REGISTER_DRAFT.*REVISE_DRAFT.*RECORD_QUALITY_REVIEW/s);
  assert.doesNotMatch(deliverableProxy, /\b(?:RELEASE|DELIVER)\b/);
  for (const id of [
    "workflow_interview_current_state_map",
    "primary_automation_diagnosis",
    "recommended_system_design",
    "prioritized_opportunities",
    "implementation_roadmap",
    "written_blueprint_review",
  ]) assert.match(deliverablesWorkspace, new RegExp(id));
  assert.match(deliverablesWorkspace, /Preparation reviewed/);
  assert.match(deliverablesWorkspace, /Prior-version history/);
  assert.match(deliverablesWorkspace, /Release and delivery are unavailable/);
  assert.doesNotMatch(deliverablesWorkspace, /JSON editor|textarea[^>]+json/i);
  assert.match(deliverablesWorkspace, /classificationLines/);
  assert.match(deliverablesWorkspace, /\$\{classification\} \| \$\{claim\}/);
  assert.match(deliverablesWorkspace, /\.\.\.\(item\?\.contents \|\| \{\}\)/);
  assert.match(deliverablesWorkspace, /BLUEPRINT_DELIVERABLE_CLAIM_CLASSIFICATION_REQUIRED|CLAIM_CLASSIFICATIONS/);
  assert.match(deliverablesWorkspace, /Use CLIENT_STATED, OBSERVED, ESTIMATE, or ASSUMPTION/);
  assert.match(deliverablesWorkspace, /role=\{feedback\.state === "error" \? "alert" : "status"\}/);
  assert.match(deliverablesWorkspace, /Your entered values remain in this form/);
  assert.match(deliverablesWorkspace, /Your operator session is missing or expired/);
  assert.match(deliverablesWorkspace, /api\/operator\/auth\/login\?returnTo=%2Foperator%2Fblueprints/);
});

test("deliverable selection and refresh are request-bound and review evidence is validated", () => {
  assert.match(deliverablesWorkspace, /useRef/);
  assert.match(deliverablesWorkspace, /deliverableLoadSequence/);
  assert.match(deliverablesWorkspace, /sequence !== deliverableLoadSequence\.current/);
  assert.match(deliverablesWorkspace, /setItems\(\[\]\); setDrafts\(\{\}\); setReviewInputs\(\{\}\)/);
  assert.match(deliverablesWorkspace, /Review reason is required before recording quality review/);
  assert.match(deliverablesWorkspace, /Review evidence reference is required before recording quality review/);
  assert.match(deliverablesWorkspace, /loadDeliverables\(selectedId, \{ rethrow: true, preserveDrafts:/);
  assert.match(deliverablesWorkspace, /The engagement changed while saving/);
  assert.match(deliverablesWorkspace, /preserveDrafts/);
  assert.match(deliverablesWorkspace, /setDrafts\(\(current\) => options\.preserveDrafts/);
  assert.match(deliverablesWorkspace, /if \(saving\) return/);
  assert.match(deliverablesWorkspace, /disabled=\{Boolean\(saving\)\}/);
});
