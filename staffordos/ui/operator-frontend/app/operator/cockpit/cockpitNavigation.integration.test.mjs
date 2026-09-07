import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const cockpit = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../../../components/operator/OperatorShell.tsx", import.meta.url), "utf8");

test("Cockpit has canonical naming and purpose", () => {
  assert.match(cockpit, /StaffordOS Cockpit/);
  assert.match(cockpit, /Your daily co-operator/);
  assert.match(shell, /href: "\/operator\/cockpit"/);
});

test("generic execution control is not rendered by the Cockpit", () => {
  assert.doesNotMatch(cockpit, /ExecutePrimaryActionButton/);
  assert.doesNotMatch(cockpit, /execute-primary-action/);
  assert.match(cockpit, /Execution controls remain available only from their explicitly named product workflow/);
});

test("Cockpit uses product-specific and operator-readable labels", () => {
  assert.match(cockpit, /ShopiFixer Command Center/);
  assert.doesNotMatch(cockpit, />Command Center<\/|>Primary Action<\/|>Top 5 Actions<\//);
  assert.match(cockpit, /What needs your decision/);
  assert.match(cockpit, /What matters now/);
});

test("Cockpit keeps source-driven operating sections", () => {
  assert.match(cockpit, /System Health/);
  assert.match(cockpit, /What needs your decision/);
  assert.match(cockpit, /What matters now/);
  assert.doesNotMatch(cockpit, /career evidence|resume|provider call/i);
});
