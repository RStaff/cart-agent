import test from "node:test";
import assert from "node:assert/strict";
import { BROTHER_BETA_DISCOVERY_QUALITY_THRESHOLD, evaluateDiscoveryQualityLabels } from "./discoveryQualityHarness.mjs";

test("Brother Beta discovery-quality threshold requires several meaningful top-ten jobs", () => {
  const result = evaluateDiscoveryQualityLabels([
    { label: "WOULD_APPLY", explanationTrusted: true },
    { label: "WOULD_CONSIDER", explanationTrusted: true },
    { label: "WOULD_CONSIDER", explanationTrusted: true },
    { label: "NOT_RELEVANT", explanationTrusted: true },
    { label: "NOT_RELEVANT", explanationTrusted: true },
    { label: "NOT_RELEVANT", explanationTrusted: true },
    { label: "NOT_RELEVANT", explanationTrusted: true },
    { label: "NOT_RELEVANT", explanationTrusted: false },
    { label: "NOT_RELEVANT", explanationTrusted: true },
    { label: "NOT_RELEVANT", explanationTrusted: true },
  ]);
  assert.equal(BROTHER_BETA_DISCOVERY_QUALITY_THRESHOLD.topN, 10);
  assert.equal(result.positive, 3);
  assert.equal(result.passed, true);
});

test("Brother Beta discovery-quality threshold fails high junk or duplicate rates", () => {
  const result = evaluateDiscoveryQualityLabels([
    { label: "WOULD_CONSIDER", explanationTrusted: true },
    { label: "WOULD_CONSIDER", explanationTrusted: true, duplicate: true },
    { label: "WOULD_CONSIDER", explanationTrusted: true, junk: true },
    { label: "NOT_RELEVANT", explanationTrusted: true, junk: true },
    { label: "NOT_RELEVANT", explanationTrusted: false },
  ]);
  assert.equal(result.passed, false);
});
