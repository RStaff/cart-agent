import test from "node:test";
import assert from "node:assert/strict";
import { buildShopifixerRepairPlan } from "./shopifixerRepairPlanAdapter.js";

const completedAt = "2026-07-29T01:00:02.000Z";

function makeRetrievedAudit(overrides = {}) {
  return {
    audit: {
      id: "audit_123",
      status: "completed",
      normalizedShopifyDomain: "no-kings-athletics.myshopify.com",
      auditSequence: 1,
      requestFingerprint: "fingerprint_123",
      completedAt,
      evidence: {
        analysisSnapshot: {
          issues: [
            {
              id: "trust_friction",
              title: "Purchase reassurance may be thin near the first action",
              detail: "The entry-page markup does not show strong reassurance cues near the purchase path.",
              severity: "medium",
            },
          ],
        },
        findingsSnapshot: {
          canonicalPayload: {
            top_issue: "Purchase reassurance may be thin near the first action",
          },
        },
        findingSummary: {
          issueCount: 1,
          topIssue: "Purchase reassurance may be thin near the first action",
        },
        recommendedAction: "Strengthen Purchase Reassurance",
        estimatedRevenueLoss: "$9,999",
      },
    },
    merchant: {
      id: "merchant_1",
      normalizedShopifyDomain: "no-kings-athletics.myshopify.com",
    },
    lead: {
      id: "lead_1",
      idempotencyKey: "shopifixer:lead:no-kings-athletics.myshopify.com:staffordmedia_shopifixer",
    },
    events: [],
    packetLinks: [],
    proofReferences: [],
    ...overrides,
  };
}

test("builds stable output for identical stored audit evidence", () => {
  const input = makeRetrievedAudit();
  const first = buildShopifixerRepairPlan(input, { generatedAt: "2026-07-29T02:00:00.000Z" });
  const second = buildShopifixerRepairPlan(input, { generatedAt: "2026-07-29T02:00:00.000Z" });

  assert.deepEqual(first, second);
  assert.equal(first.ok, true);
  assert.equal(first.plan.repairItems[0].repairItemId, second.plan.repairItems[0].repairItemId);
});

test("ranks high-severity conversion blockers above low-severity cosmetic findings", () => {
  const plan = buildShopifixerRepairPlan(makeRetrievedAudit({
    audit: {
      ...makeRetrievedAudit().audit,
      evidence: {
        ...makeRetrievedAudit().audit.evidence,
        analysisSnapshot: {
          issues: [
            {
              id: "brand_spacing",
              title: "Minor visual spacing issue",
              detail: "Spacing could be cleaner.",
              severity: "low",
            },
            {
              id: "slow_checkout_signals",
              title: "Slow checkout signals",
              detail: "Checkout handoff may introduce hesitation.",
              severity: "high",
            },
          ],
        },
      },
    },
  }), { generatedAt: "2026-07-29T02:00:00.000Z" });

  assert.equal(plan.ok, true);
  assert.equal(plan.plan.repairItems[0].sourceFindingId, "slow_checkout_signals");
  assert.equal(plan.plan.repairItems[0].severity, "high");
});

test("low-confidence findings are not overstated as directly actionable", () => {
  const plan = buildShopifixerRepairPlan(makeRetrievedAudit({
    audit: {
      ...makeRetrievedAudit().audit,
      evidence: {
        ...makeRetrievedAudit().audit.evidence,
        analysisSnapshot: {
          issues: [
            {
              id: "capture_signal",
              title: "Capture path needs review",
              severity: "medium",
            },
          ],
        },
      },
    },
  }), { generatedAt: "2026-07-29T02:00:00.000Z" });

  assert.equal(plan.plan.repairItems[0].confidence, "low");
  assert.equal(plan.plan.repairItems[0].actionableStatus, "REQUIRES_CONFIRMATION");
  assert.equal(plan.plan.repairItems[0].eligibilityForControlledExecution, false);
});

test("unsupported findings are excluded and counted", () => {
  const plan = buildShopifixerRepairPlan(makeRetrievedAudit({
    audit: {
      ...makeRetrievedAudit().audit,
      evidence: {
        ...makeRetrievedAudit().audit.evidence,
        analysisSnapshot: {
          issues: [
            { id: "unsupported_blank", title: "", detail: "No title.", severity: "high" },
            { id: "trust_friction", title: "Trust cue issue", detail: "Reassurance is thin.", severity: "medium" },
          ],
        },
      },
    },
  }), { generatedAt: "2026-07-29T02:00:00.000Z" });

  assert.equal(plan.plan.totalFindingsConsidered, 2);
  assert.equal(plan.plan.totalRepairItems, 1);
  assert.equal(plan.plan.excludedOrUnsupportedFindingCount, 1);
  assert.deepEqual(plan.plan.unsupportedFindings, [{ reason: "missing_finding_title" }]);
});

test("computes severity counts and actionable status classifications", () => {
  const plan = buildShopifixerRepairPlan(makeRetrievedAudit({
    audit: {
      ...makeRetrievedAudit().audit,
      evidence: {
        ...makeRetrievedAudit().audit.evidence,
        analysisSnapshot: {
          issues: [
            { id: "shipping_uncertainty", title: "Shipping issue", detail: "Shipping is unclear.", severity: "high" },
            { id: "navigation_clutter", title: "Navigation issue", detail: "Too many links.", severity: "medium" },
            { id: "low_signal_ambiguity", title: "Insufficient signal clarity", detail: "Evidence is thin.", severity: "low" },
          ],
        },
      },
    },
  }), { generatedAt: "2026-07-29T02:00:00.000Z" });

  assert.equal(plan.plan.highCount, 1);
  assert.equal(plan.plan.mediumCount, 1);
  assert.equal(plan.plan.lowCount, 1);
  assert.equal(plan.plan.repairItems[0].actionableStatus, "DIRECTLY_ACTIONABLE");
  assert.equal(
    plan.plan.repairItems.find((item) => item.sourceFindingId === "low_signal_ambiguity").actionableStatus,
    "REQUIRES_ADDITIONAL_DISCOVERY",
  );
});

test("does not invoke analyzer, database writes, Packet actions, Shopify actions, or fabricate revenue claims", () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("unexpected_fetch");
  };

  try {
    const plan = buildShopifixerRepairPlan(makeRetrievedAudit(), {
      generatedAt: "2026-07-29T02:00:00.000Z",
    });
    const serialized = JSON.stringify(plan);

    assert.equal(plan.ok, true);
    assert.equal(fetchCalled, false);
    assert.equal(serialized.includes("$9,999"), false);
    assert.equal(serialized.includes("paymentReference"), false);
    assert.equal(serialized.includes("DATABASE_URL"), false);
    assert.equal(plan.plan.summary.revenueClaimIncluded, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns insufficient evidence when no finding evidence exists", () => {
  const plan = buildShopifixerRepairPlan(makeRetrievedAudit({
    audit: {
      ...makeRetrievedAudit().audit,
      evidence: {
        analysisSnapshot: { issues: [] },
        findingsSnapshot: {},
        findingSummary: {},
      },
    },
  }));

  assert.deepEqual(plan, {
    ok: false,
    status: 422,
    error: "insufficient_audit_evidence",
    missing: ["audit.evidence.analysisSnapshot.issues"],
  });
});
