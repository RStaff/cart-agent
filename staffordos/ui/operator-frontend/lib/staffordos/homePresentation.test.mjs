import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const homeModelPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/homePresentation.ts");
const homeComponentPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx");
const nextActionCardPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/NextActionCard.tsx");
const pagePath = path.join(root, "staffordos/ui/operator-frontend/app/os/page.tsx");
const capabilityPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts");
const registryPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.ts");

const homeModelSource = readFileSync(homeModelPath, "utf8");
const homeComponentSource = readFileSync(homeComponentPath, "utf8");
const nextActionCardSource = readFileSync(nextActionCardPath, "utf8");
const pageSource = readFileSync(pagePath, "utf8");
const capabilitySource = readFileSync(capabilityPath, "utf8");
const registrySource = readFileSync(registryPath, "utf8");

function presentationBlock(workspaceId) {
  const exportName = {
    "stafford-media": "STAFFORD_MEDIA_HOME_PRESENTATION",
    professional: "PROFESSIONAL_HOME_PRESENTATION",
    personal: "PERSONAL_HOME_PRESENTATION",
  }[workspaceId];

  const match = homeModelSource.match(new RegExp(`export const ${exportName}: HomePresentation = \\{[\\s\\S]*?\\n\\};`));
  assert.ok(match, `expected ${exportName} in home presentation model`);
  return match[0];
}

test("Stafford Media remains the safe default workspace", () => {
  assert.match(registrySource, /DEFAULT_STAFFORDOS_WORKSPACE_ID: StaffordOsWorkspaceId = "stafford-media"/);
});

test("Stafford Media Home renders one primary repository-backed action", () => {
  const staffordBlock = presentationBlock("stafford-media");

  assert.match(staffordBlock, /primaryAction: actionFromCapability\(startMyDay/);
  assert.match(staffordBlock, /whatToDo: "Start My Day"/);
  assert.match(homeModelSource, /source: capability\.source/);
  assert.match(capabilitySource, /id: "start-my-day"[\s\S]*?source: "repository_backed"[\s\S]*?currentRoute: "\/operator"/);
});

test("primary action links to the expected current operator Home page", () => {
  assert.match(capabilitySource, /id: "start-my-day"[\s\S]*?currentRoute: "\/operator"/);
  assert.match(homeModelSource, /continueHref: capability\.currentRoute/);
});

test("Stafford Media Home does not claim live AI ranking", () => {
  const visibleHomeSource = `${homeModelSource}\n${homeComponentSource}`.toLowerCase();

  assert.match(visibleHomeSource, /live priority ranking is not connected/);
  assert.doesNotMatch(visibleHomeSource, /live ai ranking/);
  assert.doesNotMatch(visibleHomeSource, /ai recommended/);
  assert.doesNotMatch(visibleHomeSource, /ranking algorithm/);
});

test("Professional Home is planned content only", () => {
  const professionalBlock = presentationBlock("professional");

  assert.match(professionalBlock, /primaryAction: null/);
  assert.match(professionalBlock, /No jobs, applications, resumes, employers, meetings, or recommendations are connected/);
  assert.doesNotMatch(professionalBlock, /continueHref: "\/operator/);
  assert.doesNotMatch(professionalBlock, /currentRoute: "\/operator/);
});

test("Personal Home is planned content only", () => {
  const personalBlock = presentationBlock("personal");

  assert.match(personalBlock, /primaryAction: null/);
  assert.match(personalBlock, /No family members, media assets, memories, shared content, or private tasks are connected/);
  assert.doesNotMatch(personalBlock, /continueHref: "\/operator/);
  assert.doesNotMatch(personalBlock, /currentRoute: "\/operator/);
});

test("planned workspace Homes expose no Stafford Media operating links except returning by state", () => {
  const plannedBlocks = `${presentationBlock("professional")}\n${presentationBlock("personal")}`;

  assert.doesNotMatch(plannedBlocks, /\/operator/);
  assert.match(homeComponentSource, /setActiveWorkspace\(DEFAULT_STAFFORDOS_WORKSPACE_ID\)/);
  assert.match(homeComponentSource, /Return to Stafford Media/);
});

test("no fake business, professional, personal, family, or media data appears", () => {
  const visibleHomeSource = `${homeModelSource}\n${homeComponentSource}`.toLowerCase();

  for (const forbidden of [
    "customer name",
    "deadline:",
    "confidence score",
    "employer:",
    "interview on",
    "family member:",
    "watch list",
    "memory from",
    "revenue total",
  ]) {
    assert.doesNotMatch(visibleHomeSource, new RegExp(forbidden));
  }
});

test("NextActionCard supports optional Home fields without requiring unsupported fields", () => {
  assert.match(nextActionCardSource, /continueHref\?: string \| null/);
  assert.match(nextActionCardSource, /expectedResult\?: string/);
  assert.match(nextActionCardSource, /completionProof\?: string/);
  assert.match(nextActionCardSource, /DETAIL_FIELDS\.filter/);
});

test("existing capabilities behavior remains intact for Stafford Media", () => {
  for (const route of [
    "/operator",
    "/operator/leads",
    "/operator/campaigns",
    "/operator/revenue-command",
    "/operator/command-center",
  ]) {
    assert.match(capabilitySource, new RegExp(`currentRoute: "${route.replace(/\//g, "\\/")}"`));
  }
});

test("/os Home uses the unified Home component only", () => {
  assert.match(pageSource, /import \{ UnifiedHome \}/);
  assert.match(pageSource, /return <UnifiedHome \/>/);
  assert.doesNotMatch(pageSource, /WorkspacePage/);
  assert.doesNotMatch(pageSource, /CapabilityLinkPanel/);
});
