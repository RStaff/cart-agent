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

test("secondary navigation preserves CareerOS mission discoverability", () => {
  assert.match(nav, /CareerOS Operations/);
  assert.match(nav, /CareerOS Missions/);
  assert.match(nav, /if \(!activeHref\.startsWith\("\/operator\/careeros\/"\)\) return null/);
  assert.doesNotMatch(nav, /Products|ShopiFixer Command Center|Health|Audit/);
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
  assert.match(shell, /\{status\.validationStatus\}<\/div>/);
});
