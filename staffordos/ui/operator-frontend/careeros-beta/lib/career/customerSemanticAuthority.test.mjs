import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CUSTOMER_SEMANTIC_AUTHORITY, customerEvidenceFitPresentation, matchScoreCustomerPresentation } from "./customerSemanticAuthority.mjs";

const detailPage = readFileSync(new URL("../../app/career/jobs/[opportunityId]/page.tsx", import.meta.url), "utf8");
const jobsPage = readFileSync(new URL("../../app/career/jobs/page.tsx", import.meta.url), "utf8");

test("MATCH_SCORE remains prohibited while readiness is not ready", () => {
  assert.equal(CUSTOMER_SEMANTIC_AUTHORITY.MATCH_SCORE.status, "NOT_READY");
  assert.equal(matchScoreCustomerPresentation().customerFacingAllowed, false);
  assert.equal(matchScoreCustomerPresentation().value, null);
});

test("Evidence fit is explicitly separate from match score", () => {
  assert.equal(CUSTOMER_SEMANTIC_AUTHORITY.EVIDENCE_COVERAGE_PERCENTAGE.authoritativeSource, "buildEvidenceFit");
  assert.equal(customerEvidenceFitPresentation({ semanticKey: "EVIDENCE_COVERAGE_PERCENTAGE", status: "CURRENT", percentage: 31 }).value, "31%");
  assert.equal(customerEvidenceFitPresentation({ semanticKey: "EVIDENCE_COVERAGE_PERCENTAGE", status: "CURRENT", percentage: 31 }).label, "Evidence fit");
  assert.equal(customerEvidenceFitPresentation({ semanticKey: "MATCH_SCORE", status: "CURRENT", percentage: 31 }).value, "—%");
});

test("stale and insufficient evidence fit fail closed to no numeric value", () => {
  assert.equal(customerEvidenceFitPresentation({ status: "STALE", percentage: 31 }).value, "—%");
  assert.equal(customerEvidenceFitPresentation({ status: "INSUFFICIENT", percentage: 100 }).value, "—%");
});

test("opportunity detail uses the governed evidence-fit presentation and breadcrumbs", () => {
  assert.match(detailPage, /customerEvidenceFitPresentation/);
  assert.match(detailPage, /CareerOS Home/);
  assert.match(detailPage, /Job Search Workspace/);
  assert.doesNotMatch(detailPage, /fit\.percentage/);
});

test("saved jobs has one internal opportunity destination and preserves source provenance", () => {
  assert.doesNotMatch(jobsPage, /Open opportunity/);
  assert.match(jobsPage, /Open source link/);
  assert.match(jobsPage, /href=\{"\/career\/jobs\/" \+ job\.id\}/);
});
