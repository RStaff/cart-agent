import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const registryPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.ts");
const capabilityPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts");
const contextPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/WorkspaceContext.tsx");
const selectorPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/WorkspaceSelector.tsx");
const workspacePagePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/WorkspacePage.tsx");
const capabilityPanelPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/CapabilityLinkPanel.tsx");
const capabilityPagePath = path.join(root, "staffordos/ui/operator-frontend/app/os/capabilities/page.tsx");

const registrySource = readFileSync(registryPath, "utf8");
const capabilitySource = readFileSync(capabilityPath, "utf8");
const contextSource = readFileSync(contextPath, "utf8");

function capabilityBlocksFor(workspaceId) {
  return capabilitySource
    .split(/\n  \{\n/)
    .filter((block) => block.includes(`workspaceId: "${workspaceId}"`));
}

test("Stafford Media is the safe default workspace", () => {
  assert.match(registrySource, /DEFAULT_STAFFORDOS_WORKSPACE_ID: StaffordOsWorkspaceId = "stafford-media"/);
  assert.match(contextSource, /useState<StaffordOsWorkspaceId>\(DEFAULT_STAFFORDOS_WORKSPACE_ID\)/);
});

test("workspace registry contains exactly the approved initial families", () => {
  const ids = [...registrySource.matchAll(/id: "(stafford-media|professional|personal)"/g)].map((match) => match[1]);
  assert.deepEqual(ids, ["stafford-media", "professional", "personal"]);
});

test("workspace availability matches the owner-first launch boundary", () => {
  assert.match(registrySource, /id: "stafford-media"[\s\S]*?availability: "available_now"/);
  assert.match(registrySource, /id: "professional"[\s\S]*?availability: "available_now"/);
  assert.match(registrySource, /id: "personal"[\s\S]*?availability: "planned"/);
});

test("Stafford Media capabilities are the only current operator links", () => {
  const staffordMediaCapabilities = capabilityBlocksFor("stafford-media");
  const professionalCapabilities = capabilityBlocksFor("professional");
  const personalCapabilities = capabilityBlocksFor("personal");

  assert.equal(staffordMediaCapabilities.length, 9);
  assert.ok(staffordMediaCapabilities.every((block) => /currentRoute: "\/operator/.test(block)));
  assert.ok(professionalCapabilities.length > 0);
  assert.ok(personalCapabilities.length > 0);
  assert.ok(professionalCapabilities.every((block) => !/currentRoute: "\/operator/.test(block)));
  assert.ok(professionalCapabilities.some((block) => /id: "professional-career-home"[\s\S]*?currentRoute: "\/os\/professional"/.test(block)));
  assert.ok(professionalCapabilities.some((block) => /id: "professional-job-search"[\s\S]*?currentRoute: "\/os\/professional\/jobs"/.test(block)));
  assert.ok(personalCapabilities.every((block) => /currentRoute: null/.test(block)));
});

test("Professional and Personal content do not expose Stafford Media operator routes", () => {
  const plannedCapabilitySource = [...capabilityBlocksFor("professional"), ...capabilityBlocksFor("personal")].join("\n");

  assert.doesNotMatch(plannedCapabilitySource, /currentRoute: "\/operator/);
  assert.doesNotMatch(plannedCapabilitySource, /technicalNote: "Current route: \/operator/);
});

test("existing Stafford Media capability links remain correct", () => {
  for (const route of [
    "/operator",
    "/operator/cockpit",
    "/operator/leads",
    "/operator/campaigns",
    "/operator/revenue-command",
    "/operator/command-center",
    "/operator/execution-log",
    "/operator/system-map",
    "/operator/slice-truth",
  ]) {
    assert.match(capabilitySource, new RegExp(`currentRoute: "${route.replace(/\//g, "\\/")}"`));
  }
});

test("workspace selection changes presentation only", () => {
  assert.doesNotMatch(contextSource, /localStorage|sessionStorage|document\.cookie|fetch\(|XMLHttpRequest|\/api\/|\/operator/);
  assert.match(contextSource, /It is not an authorization boundary/);
});

test("visible workspace copy avoids technical and authorization claims", () => {
  const visibleSource = [
    selectorPath,
    workspacePagePath,
    capabilityPanelPath,
    capabilityPagePath,
  ]
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n")
    .toLowerCase();

  for (const forbidden of [
    "tenant",
    "namespace",
    "scope resolver",
    "principal",
    "authorization",
    "authorized",
    "unauthorized",
    "unimplemented module",
  ]) {
    assert.doesNotMatch(visibleSource, new RegExp(forbidden));
  }
});
