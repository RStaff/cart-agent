import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const shell = fs.readFileSync(new URL("./OperatorShell.tsx", import.meta.url), "utf8");
const nav = fs.readFileSync(new URL("./OperatorNav.tsx", import.meta.url), "utf8");

test("primary navigation exposes only the canonical operator groups", () => {
  assert.match(shell, /label: "Today"/);
  assert.match(shell, /label: "Business"/);
  assert.match(shell, /label: "System"/);
  assert.match(shell, /label: "StaffordOS Cockpit"/);
  assert.match(shell, /label: "Products"/);
  assert.match(shell, /label: "ShopiFixer Command Center"/);
  assert.match(shell, /label: "Health"/);
  assert.match(shell, /label: "Audit"/);
  assert.doesNotMatch(shell, /planned: true/);
});

test("global navigation owns CareerOS discoverability without a competing OperatorNav", () => {
  assert.match(shell, /label: "CareerOS Operations"/);
  assert.match(shell, /label: "CareerOS Missions"/);
  assert.doesNotMatch(nav, /CAREEROS_ROUTES|<nav|<Link/);
  assert.match(nav, /return null/);
});

test("navigation uses stable links, accessible current-page state, and mobile disclosure", () => {
  assert.match(shell, /href=\{item\.href!\}/);
  assert.match(shell, /aria-current=\{isActive\(pathname, item\.href\) \? "page" : undefined\}/);
  assert.match(shell, /aria-label="Operator navigation"/);
  assert.match(shell, /aria-expanded=\{mobileNavOpen\}/);
  assert.match(shell, /aria-controls="operator-mobile-navigation"/);
  assert.match(shell, /hidden=\{!mobileNavOpen\}/);
  assert.match(shell, /<details className="operatorShellValidationDetails">/);
  assert.match(shell, /<summary>/);
  assert.match(shell, /validationSummary\(status\.validationStatus\)/);
  assert.match(shell, /<strong>\{validationSummary\(status\.validationStatus\)\}<\/strong>/);
  assert.match(shell, /\{status\.validationStatus\}<\/div>/);
  assert.equal((shell.match(/\{status\.validationStatus\}/g) || []).length, 1);
  assert.doesNotMatch(shell, /<details[^>]*\bopen\b/);
});

test("navigation preserves the truthful validation language contract", () => {
  assert.match(shell, /operatorValidationPresentation\.mjs/);
  assert.match(shell, /validationExplanation/);
  assert.match(shell, /validationSummary/);
  assert.match(shell, /Product overview/);
  assert.doesNotMatch(shell, /CareerOS, ShopiFixer, and Abando/);
});
