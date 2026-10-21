import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const product = read("lib/career/careerP0Product.mjs");
const route = read("app/api/career/opportunities/[opportunityId]/application/resume/route.ts");
const editor = read("app/career/jobs/[opportunityId]/application/MaterialEditor.tsx");
const schema = read("prisma/careeros.prisma");

test("regeneration is an explicit deterministic action with governed gates", () => {
  assert.match(route, /body\.action === "regenerate"/);
  assert.match(route, /eventType: "APPLICATION_MATERIAL_REGENERATED"/);
  assert.match(product, /decisionState !== "PURSUE"/);
  assert.match(product, /packet\.status !== "CURRENT"/);
  assert.match(product, /buildResumeDraft\(\{ profile: data\.profile, packet: data\.packet \}\)/);
});

test("regeneration preserves prior rows and advances the existing version", () => {
  assert.match(product, /COALESCE\(MAX\("draftVersion"\),0\)\+1/);
  assert.match(product, /INSERT INTO "CareerResumeDraft"/);
  assert.doesNotMatch(product, /DELETE FROM "CareerResumeDraft"/);
  assert.match(route, /APPLICATION_MATERIAL_REGENERATED/);
  assert.match(schema, /draftVersion\s+Int/);
});

test("customer UI requires explicit confirmation and preserves existing draft", () => {
  assert.match(editor, /Regenerate truthful draft/);
  assert.match(editor, /window\.confirm\("Create a new truthful draft from your current CareerOS evidence\? Your existing draft will be preserved\."\)/);
  assert.match(editor, /materialType === "RESUME" && !isAi/);
});

test("regeneration does not use the AI improve path", () => {
  assert.match(editor, /request\("regenerate"\)/);
  assert.match(route, /body\.action === "improve"/);
  assert.match(route, /body\.action === "regenerate"/);
  assert.match(route, /createResumeDraft\(context, opportunityId, \{ eventType: "APPLICATION_MATERIAL_REGENERATED"/);
});

test("save and improve controls remain present", () => {
  assert.match(editor, /request\("save"\)/);
  assert.match(editor, /request\("improve"\)/);
  assert.match(editor, /Save draft/);
  assert.match(editor, /Improve wording/);
});
