import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import pkg from "@prisma/client";
import { installBlueprintDeliverableRoutes } from "./blueprintDeliverables.esm.js";

const { PrismaClient } = pkg;
const SERVICE_KEY = "step5a-disposable-service-key";
const ACTOR = "ross-step5a-test-subject";
const AUTH = {
  "content-type": "application/json",
  "x-internal-api-key": SERVICE_KEY,
  "x-staffordos-operator-subject": ACTOR,
  "x-staffordos-operator-permission": "staffordos.revenue_operations.write",
};
const IDS = [
  "workflow_interview_current_state_map",
  "primary_automation_diagnosis",
  "recommended_system_design",
  "prioritized_opportunities",
  "implementation_roadmap",
  "written_blueprint_review",
];

function engagement(suffix) {
  return {
    offerId: "stafford_media_automation_opportunity_blueprint_v1",
    stripeSessionId: `cs_step5a_${suffix}`,
    stripePaymentLinkId: "plink_1UJacwJyylmUTExqQDaNV1dB",
    stripeProductId: "prod_VKF6B7HLG2L0tQ",
    stripePriceId: "price_1UJacYJyylmUTExqBGErXBxb",
    stripePaymentIntentId: `pi_step5a_${suffix}`,
    amountTotal: 75000,
    currency: "usd",
    quantity: 1,
    buyerEmail: "synthetic-step5a@example.test",
    paidAt: new Date("2026-10-12T15:00:00.000Z"),
    onboarding: { create: {} },
    paymentEvent: { create: {
      stripeEventId: `evt_step5a_${suffix}`,
      stripeSessionId: `cs_step5a_${suffix}`,
      stripeEventType: "checkout.session.completed",
      livemode: true,
      providerCreatedAt: new Date("2026-10-12T15:00:00.000Z"),
      receivedAt: new Date("2026-10-12T15:00:01.000Z"),
    } },
  };
}

function draft(extra = {}) {
  return {
    owner: "Ross Stafford",
    contents: { answer: "Synthetic bounded draft", findings: ["Synthetic observation"] },
    evidenceRefs: [{ ref: "evidence://step5a/synthetic", observedAt: "2026-10-12" }],
    claimClassifications: [{ classification: "OBSERVED", claim: "Synthetic observation" }],
    limitations: [],
    prerequisiteRefs: [],
    reason: "Synthetic Step 5A review",
    evidenceRef: "evidence://step5a/review",
    ...extra,
  };
}

async function withServer(app, callback) {
  const server = await new Promise((resolve) => {
    const value = app.listen(0, "127.0.0.1", () => resolve(value));
  });
  try { return await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test("deliverable drafting/review is durable, governed, versioned, isolated, and payment-immutable", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const priorKey = process.env.INTERNAL_API_KEY;
  process.env.INTERNAL_API_KEY = SERVICE_KEY;
  const prisma = new PrismaClient();
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const primary = await prisma.staffordosBlueprintEngagement.create({ data: engagement(`${suffix}_primary`) });
  const isolated = await prisma.staffordosBlueprintEngagement.create({ data: engagement(`${suffix}_isolated`) });
  const paymentBefore = await prisma.staffordosBlueprintEngagement.findUnique({ where: { id: primary.id }, include: { paymentEvent: true, onboarding: true } });
  const app = express();
  app.use(express.json());
  installBlueprintDeliverableRoutes(app, { prisma });
  try {
    await withServer(app, async (base) => {
      const endpoint = `${base}/api/staffordos/blueprint-engagements/${primary.id}/deliverables`;
      const post = (body, headers = AUTH) => fetch(`${endpoint}/commands`, { method: "POST", headers, body: JSON.stringify(body) });
      for (const id of IDS) {
        const response = await post({ expectedVersion: 0, command: "REGISTER_DRAFT", data: { identifier: id, ...draft() } });
        assert.equal(response.status, 200);
      }
      const invalidInitial = await post({ expectedVersion: 1, command: "REGISTER_DRAFT", data: { identifier: "workflow_interview_current_state_map", ...draft() } });
      assert.equal(invalidInitial.status, 409);
      const collection = await fetch(endpoint, { headers: AUTH });
      assert.equal(collection.status, 200);
      const listed = await collection.json();
      assert.equal(listed.deliverables.length, 6);
      assert.equal(listed.deliverables.every((item) => item.status === "recorded"), true);

      const detail = listed.deliverables[0];
      const reviewed = await post({ expectedVersion: detail.recordVersion, command: "RECORD_QUALITY_REVIEW", data: { identifier: detail.identifier, expectedDraftVersion: detail.version, ...draft() } });
      assert.equal(reviewed.status, 200);
      const reviewedBody = await reviewed.json();
      assert.equal(reviewedBody.deliverable.status, "reviewed");
      assert.equal(reviewedBody.deliverable.contents.answer, "Synthetic bounded draft");
      assert.equal(reviewedBody.deliverable.evidenceRefs[0].ref, "evidence://step5a/synthetic");
      assert.equal(reviewedBody.deliverable.claimClassifications[0].classification, "OBSERVED");
      assert.deepEqual(reviewedBody.deliverable.limitations, []);
      assert.equal(reviewedBody.deliverable.qualityReviewEvidenceRef, "evidence://step5a/review");
      assert.equal(reviewedBody.deliverables.find((item) => item.id === reviewedBody.deliverable.id).auditEvents.at(-1).actorSubject, ACTOR);
      assert.equal(reviewedBody.deliverables.find((item) => item.id === reviewedBody.deliverable.id).auditEvents.at(-1).evidenceRef, "evidence://step5a/review");

      const revised = await post({ expectedVersion: reviewedBody.deliverable.recordVersion, command: "REVISE_DRAFT", data: { identifier: detail.identifier, expectedDraftVersion: reviewedBody.deliverable.version, ...draft({ contents: { answer: "Revised draft" } }) } });
      assert.equal(revised.status, 200);
      const revisedBody = await revised.json();
      const versions = revisedBody.deliverables.filter((item) => item.identifier === detail.identifier).sort((a, b) => b.version - a.version);
      assert.deepEqual(versions.map((item) => [item.version, item.status]), [[2, "recorded"], [1, "reviewed"]]);

      const concurrentRevisionTarget = listed.deliverables[1];
      const revisionResults = await Promise.all([
        post({ expectedVersion: concurrentRevisionTarget.recordVersion, command: "REVISE_DRAFT", data: { identifier: concurrentRevisionTarget.identifier, expectedDraftVersion: concurrentRevisionTarget.version, ...draft({ contents: { answer: "Concurrent revision A" } }) } }),
        post({ expectedVersion: concurrentRevisionTarget.recordVersion, command: "REVISE_DRAFT", data: { identifier: concurrentRevisionTarget.identifier, expectedDraftVersion: concurrentRevisionTarget.version, ...draft({ contents: { answer: "Concurrent revision B" } }) } }),
      ]);
      assert.deepEqual(revisionResults.map((response) => response.status).sort(), [200, 409]);

      const stale = await post({ expectedVersion: 0, command: "RECORD_QUALITY_REVIEW", data: { identifier: detail.identifier, expectedDraftVersion: detail.version, ...draft() } });
      assert.equal(stale.status, 409);
      const unauthorized = await post({ expectedVersion: 0, command: "REGISTER_DRAFT", data: { identifier: "workflow_interview_current_state_map", ...draft() } }, { ...AUTH, "x-staffordos-operator-permission": "staffordos.revenue_operations.read" });
      assert.equal(unauthorized.status, 403);
      const release = await post({ expectedVersion: 1, command: "RELEASE", data: { identifier: "workflow_interview_current_state_map", ...draft() } });
      assert.equal(release.status, 409);
      const deliver = await post({ expectedVersion: 1, command: "DELIVER", data: { identifier: "workflow_interview_current_state_map", ...draft() } });
      assert.equal(deliver.status, 409);

      const concurrentTarget = versions[0];
      const results = await Promise.all([
        post({ expectedVersion: concurrentTarget.recordVersion, command: "RECORD_QUALITY_REVIEW", data: { identifier: concurrentTarget.identifier, expectedDraftVersion: concurrentTarget.version, ...draft() } }),
        post({ expectedVersion: concurrentTarget.recordVersion, command: "RECORD_QUALITY_REVIEW", data: { identifier: concurrentTarget.identifier, expectedDraftVersion: concurrentTarget.version, ...draft() } }),
      ]);
      assert.deepEqual(results.map((response) => response.status).sort(), [200, 409]);
    });

    const stored = await prisma.staffordosBlueprintEngagement.findUnique({ where: { id: primary.id }, include: { paymentEvent: true, onboarding: true } });
    assert.equal(stored.amountTotal, paymentBefore.amountTotal);
    assert.equal(stored.stripeSessionId, paymentBefore.stripeSessionId);
    assert.equal(stored.paymentEvent.stripeEventId, paymentBefore.paymentEvent.stripeEventId);
    assert.equal(stored.state, paymentBefore.state);
    assert.equal(stored.associationStatus, paymentBefore.associationStatus);
    assert.deepEqual(stored.onboarding, paymentBefore.onboarding);
    assert.equal(await prisma.staffordosBlueprintDeliverable.count({ where: { engagementId: isolated.id } }), 0);
    assert.equal(await prisma.staffordosBlueprintDeliverableAuditEvent.count({ where: { engagementId: isolated.id } }), 0);
  } finally {
    await prisma.staffordosBlueprintDeliverableAuditEvent.deleteMany({ where: { engagementId: primary.id } });
    await prisma.staffordosBlueprintDeliverable.deleteMany({ where: { engagementId: primary.id } });
    await prisma.staffordosBlueprintOnboarding.deleteMany({ where: { engagementId: isolated.id } });
    await prisma.staffordosBlueprintOnboarding.deleteMany({ where: { engagementId: primary.id } });
    await prisma.staffordosBlueprintPaymentEvent.deleteMany({ where: { engagementId: isolated.id } });
    await prisma.staffordosBlueprintPaymentEvent.deleteMany({ where: { engagementId: primary.id } });
    await prisma.staffordosBlueprintEngagement.delete({ where: { id: isolated.id } });
    await prisma.staffordosBlueprintEngagement.delete({ where: { id: primary.id } });
    await prisma.$disconnect();
    if (priorKey === undefined) delete process.env.INTERNAL_API_KEY; else process.env.INTERNAL_API_KEY = priorKey;
  }
});
