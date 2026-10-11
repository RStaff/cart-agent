import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import pkg from "@prisma/client";
import { installBlueprintOnboardingRoutes } from "./blueprintOnboarding.esm.js";

const { PrismaClient } = pkg;
const SERVICE_KEY = "step4a-disposable-service-key";
const ACTOR = "ross-step4a-test-subject";
const AUTH = {
  "content-type": "application/json",
  "x-internal-api-key": SERVICE_KEY,
  "x-staffordos-operator-subject": ACTOR,
  "x-staffordos-operator-permission": "staffordos.revenue_operations.write",
};

function baseEngagement(suffix) {
  return {
    offerId: "stafford_media_automation_opportunity_blueprint_v1",
    stripeSessionId: `cs_live_step4a_${suffix}`,
    stripePaymentLinkId: "plink_1UJacwJyylmUTExqQDaNV1dB",
    stripeProductId: "prod_VKF6B7HLG2L0tQ",
    stripePriceId: "price_1UJacYJyylmUTExqBGErXBxb",
    stripePaymentIntentId: `pi_step4a_${suffix}`,
    amountTotal: 75000,
    currency: "usd",
    quantity: 1,
    buyerEmail: "synthetic-step4a@example.test",
    paidAt: new Date("2026-09-30T15:00:00.000Z"),
    paymentEvent: {
      create: {
        stripeEventId: `evt_step4a_${suffix}`,
        stripeSessionId: `cs_live_step4a_${suffix}`,
        stripeEventType: "checkout.session.completed",
        livemode: true,
        providerCreatedAt: new Date("2026-09-30T15:00:00.000Z"),
        receivedAt: new Date("2026-09-30T15:00:01.000Z"),
      },
    },
  };
}

const workflow = {
  name: "Synthetic qualification workflow",
  trigger: "Qualified request arrives",
  terminalOutcome: "Approved disposition is recorded",
  includedWork: ["Review", "Decision"],
  roles: ["Owner"],
  teams: ["Operations"],
  systems: ["Synthetic test system"],
  exclusions: ["Implementation"],
  adjacentWorkflows: ["Fulfillment"],
  knownExceptions: ["Insufficient evidence"],
  humanControls: ["Ross approves decisions"],
  clientWorkflowOwner: "Synthetic client owner",
  staffordMediaOwner: "Ross Stafford",
  selectionRationale: "Bounded disposable integration fixture",
};

function common(extra = {}) {
  return { reason: "Synthetic Step 4A verification", evidenceRef: "evidence://step4a/synthetic", ...extra };
}

function completeChecklist({ unavailable = false, agreed = false } = {}) {
  return {
    items: [{
      key: "baseline",
      label: "Current workflow baseline",
      owner: "Synthetic client owner",
      rationale: "Required for all six Blueprint deliverables",
      status: unavailable ? "UNAVAILABLE" : "RECEIVED",
      ...(unavailable
        ? { limitation: "Baseline evidence is unavailable in this synthetic fixture" }
        : { evidenceRef: "evidence://step4a/baseline", receivedAt: "2026-10-01T14:00:00.000Z" }),
    }],
    allSixDeliverablesAchievable: true,
    ...(agreed ? {
      clientAgreesToLimitations: true,
      clientAgreedBy: "Synthetic client owner",
      clientAgreedAt: "2026-10-01T15:00:00.000Z",
      clientAgreementEvidenceRef: "evidence://step4a/limitation-agreement",
    } : {}),
  };
}

async function withServer(app, callback) {
  const server = await new Promise((resolve) => {
    const value = app.listen(0, "127.0.0.1", () => resolve(value));
  });
  try {
    const address = server.address();
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("governed HTTP onboarding is durable, atomic, isolated, and preserves payment authority", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const priorKey = process.env.INTERNAL_API_KEY;
  process.env.INTERNAL_API_KEY = SERVICE_KEY;
  const prisma = new PrismaClient();
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const engagement = await prisma.staffordosBlueprintEngagement.create({
    data: baseEngagement(suffix),
    include: { paymentEvent: true },
  });
  const isolated = await prisma.staffordosBlueprintEngagement.create({
    data: baseEngagement(`${suffix}_isolated`),
    include: { paymentEvent: true },
  });
  const paymentBefore = {
    offerId: engagement.offerId,
    stripeSessionId: engagement.stripeSessionId,
    stripePaymentLinkId: engagement.stripePaymentLinkId,
    stripeProductId: engagement.stripeProductId,
    stripePriceId: engagement.stripePriceId,
    stripePaymentIntentId: engagement.stripePaymentIntentId,
    amountTotal: engagement.amountTotal,
    currency: engagement.currency,
    quantity: engagement.quantity,
    paidAt: engagement.paidAt.toISOString(),
    event: engagement.paymentEvent,
  };
  let tick = 0;
  const instants = [
    "2026-10-01T16:00:00.000Z", "2026-10-01T16:01:00.000Z", "2026-10-01T16:02:00.000Z",
    "2026-10-01T16:03:00.000Z", "2026-10-01T16:04:00.000Z", "2026-10-01T16:05:00.000Z",
    "2026-10-01T16:06:00.000Z", "2026-10-01T16:07:00.000Z", "2026-10-01T16:08:00.000Z",
    "2026-10-01T16:09:00.000Z", "2026-10-01T16:10:00.000Z", "2026-10-01T16:11:00.000Z",
  ];
  const application = express();
  application.use(express.json());
  installBlueprintOnboardingRoutes(application, { prisma, now: () => new Date(instants[Math.min(tick++, instants.length - 1)]) });

  try {
    await withServer(application, async (baseUrl) => {
      const collectionEndpoint = `${baseUrl}/api/staffordos/blueprint-engagements`;
      const endpoint = `${baseUrl}/api/staffordos/blueprint-engagements/${engagement.id}/onboarding`;
      const post = (body, headers = AUTH) => fetch(`${endpoint}/commands`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      const command = (expectedVersion, name, data, headers) => post({
        expectedVersion, command: name, data: { ...data, actorSubject: "browser-spoof-must-be-ignored" },
      }, headers);
      let response;

      assert.equal((await fetch(collectionEndpoint)).status, 401);
      assert.equal((await fetch(collectionEndpoint, { headers: { ...AUTH, "x-staffordos-operator-subject": "" } })).status, 403);
      response = await fetch(collectionEndpoint, { headers: AUTH });
      assert.equal(response.status, 200);
      const listed = (await response.json()).engagements.find((item) => item.id === engagement.id);
      assert.equal(listed.paymentStatus, "VERIFIED_PAID");
      assert.equal(listed.amountTotal, 75000);
      assert.equal(listed.buyerEvidence.email, "synthetic-step4a@example.test");
      assert.equal(listed.buyerEvidence.authority, "PAYMENT_PROVIDER_EVIDENCE_NOT_CONFIRMED_IDENTITY");
      assert.equal(listed.clientId, null);
      assert.equal(listed.inquiryId, null);

      assert.equal((await command(0, "DECIDE_IDENTITY", common({
        decision: "LEAVE_UNASSOCIATED_PENDING", safeOperatingContactConfirmed: true,
      }), { "content-type": "application/json" })).status, 401);
      assert.equal((await command(0, "DECIDE_IDENTITY", common({
        decision: "LEAVE_UNASSOCIATED_PENDING", safeOperatingContactConfirmed: true,
      }), { ...AUTH, "x-staffordos-operator-subject": "" })).status, 403);
      assert.equal((await command(0, "DECIDE_IDENTITY", common({
        decision: "LEAVE_UNASSOCIATED_PENDING", safeOperatingContactConfirmed: true,
      }), { ...AUTH, "x-staffordos-operator-permission": "staffordos.revenue_operations.read" })).status, 403);
      assert.equal(await prisma.staffordosBlueprintOnboarding.count({ where: { engagementId: engagement.id } }), 0);

      response = await command(0, "DECIDE_IDENTITY", common({
        decision: "CONFIRM_EXISTING_CLIENT", clientId: "unverified-client-id",
        safeOperatingContactConfirmed: true,
      }));
      assert.equal(response.status, 503);
      assert.equal((await response.json()).error, "BLUEPRINT_CLIENT_AUTHORITY_UNAVAILABLE");
      assert.equal(await prisma.staffordosBlueprintOnboarding.count({ where: { engagementId: engagement.id } }), 0);

      response = await command(0, "DECIDE_IDENTITY", common({
        decision: "ESTABLISH_NEW_CLIENT", safeOperatingContactConfirmed: true,
      }));
      assert.equal(response.status, 503);
      assert.equal((await response.json()).error, "BLUEPRINT_CLIENT_AUTHORITY_UNAVAILABLE");
      assert.equal(await prisma.staffordosBlueprintOnboarding.count({ where: { engagementId: engagement.id } }), 0);

      response = await command(0, "DECIDE_IDENTITY", common({
        decision: "LEAVE_UNASSOCIATED_PENDING",
        candidates: ["Provider-observed buyer evidence; not auto-associated"],
        safeOperatingContactConfirmed: true,
      }));
      assert.equal(response.status, 200);
      let body = await response.json();
      assert.equal(body.onboarding.identityReviewedBy, ACTOR);
      assert.equal(body.engagement.inquiryId, null);
      assert.equal(body.engagement.clientId, null);

      response = await command(1, "TRANSITION", common({ nextState: "ONBOARDING" }));
      assert.equal(response.status, 200);
      assert.equal((await command(2, "TRANSITION", common({ nextState: "DELIVERY_READY" }))).status, 400);
      assert.equal((await command(2, "DEFINE_WORKFLOW", common({
        boundary: workflow, clientConfirmedAt: null,
        clientConfirmedBy: "Synthetic client owner", clientConfirmationEvidenceRef: "evidence://step4a/null-date",
      }))).status, 400);

      const concurrent = await Promise.all([
        command(2, "DEFINE_WORKFLOW", common({
          boundary: workflow, clientConfirmedAt: "2026-10-01T15:30:00.000Z",
          clientConfirmedBy: "Synthetic client owner", clientConfirmationEvidenceRef: "evidence://step4a/workflow",
        })),
        command(2, "DEFINE_WORKFLOW", common({
          boundary: { ...workflow, name: "Competing stale workflow" }, clientConfirmedAt: "2026-10-01T15:30:00.000Z",
          clientConfirmedBy: "Synthetic client owner", clientConfirmationEvidenceRef: "evidence://step4a/workflow-stale",
        })),
      ]);
      assert.deepEqual(concurrent.map((item) => item.status).sort(), [200, 409]);

      response = await command(3, "SET_REQUIRED_INPUTS", common({
        checklist: {
          items: [{ key: "baseline", label: "Baseline", owner: "Client", rationale: "Required", status: "PENDING" }],
          allSixDeliverablesAchievable: false,
        },
      }));
      assert.equal(response.status, 200);
      assert.equal((await command(4, "TRANSITION", common({ nextState: "READY_FOR_INTERVIEW" }))).status, 200);
      assert.equal((await command(5, "DEFINE_WORKFLOW", common({
        boundary: { ...workflow, name: "Late silent scope replacement" },
        clientConfirmedAt: "2026-10-01T15:35:00.000Z",
        clientConfirmedBy: "Synthetic client owner",
        clientConfirmationEvidenceRef: "evidence://step4a/late-workflow",
      }))).status, 400);
      assert.equal((await command(5, "RECORD_INTERVIEW", common({
        completedAt: null,
        participants: [{ name: "Ross Stafford", role: "Facilitator" }],
        interviewEvidenceRef: "evidence://step4a/null-interview-date",
      }))).status, 400);
      assert.equal((await command(5, "RECORD_INTERVIEW", common({
        completedAt: "2026-10-01T15:45:00.000Z",
        participants: [{ name: "Ross Stafford", role: "Facilitator" }, { name: "Synthetic client owner", role: "Workflow owner" }],
        interviewEvidenceRef: "evidence://step4a/interview",
      }))).status, 200);
      assert.equal((await command(6, "RECORD_INTERVIEW", common({
        completedAt: "2026-10-01T15:50:00.000Z",
        participants: [{ name: "Ross Stafford", role: "Facilitator" }],
        interviewEvidenceRef: "evidence://step4a/interview-overwrite",
      }))).status, 400);
      assert.equal((await command(6, "TRANSITION", common({ nextState: "WAITING_FOR_CLIENT_INPUT" }))).status, 200);
      assert.equal((await command(7, "DEFINE_WORKFLOW", common({
        boundary: { ...workflow, name: "Interview-bypassing replacement" },
        clientConfirmedAt: "2026-10-01T15:55:00.000Z",
        clientConfirmedBy: "Synthetic client owner",
        clientConfirmationEvidenceRef: "evidence://step4a/interview-bypass",
      }))).status, 400);
      assert.equal((await command(7, "TRANSITION", common({ nextState: "READY_FOR_INTERVIEW" }))).status, 200);
      assert.equal((await command(8, "TRANSITION", common({ nextState: "INTERVIEW_COMPLETE" }))).status, 200);
      assert.equal((await command(9, "TRANSITION", common({ nextState: "DELIVERY_READY" }))).status, 400);

      response = await command(9, "SET_REQUIRED_INPUTS", common({
        checklist: {
          items: [{
            key: "baseline", label: "Baseline", owner: "Client", rationale: "Required",
            status: "RECEIVED", evidenceRef: "evidence://step4a/baseline", receivedAt: null,
          }],
          allSixDeliverablesAchievable: true,
        },
        readinessEvidenceRef: "evidence://step4a/null-received-date",
      }));
      assert.equal(response.status, 400);

      response = await command(9, "SET_REQUIRED_INPUTS", common({
        checklist: completeChecklist({ unavailable: true }), readinessEvidenceRef: "evidence://step4a/readiness",
      }));
      assert.equal(response.status, 400);
      assert.equal((await prisma.staffordosBlueprintOnboarding.findUnique({ where: { engagementId: engagement.id } })).version, 9);

      assert.equal((await command(9, "SET_REQUIRED_INPUTS", common({
        checklist: completeChecklist({ unavailable: true, agreed: true }), readinessEvidenceRef: "evidence://step4a/readiness",
      }))).status, 200);
      const readyAt = (await prisma.staffordosBlueprintOnboarding.findUnique({ where: { engagementId: engagement.id } })).currentRequiredInformationReadyAt;
      assert.equal((await command(10, "SET_REQUIRED_INPUTS", common({
        checklist: completeChecklist({ unavailable: true, agreed: true }), readinessEvidenceRef: "evidence://step4a/readiness-reconfirmed",
      }))).status, 200);
      assert.equal(
        (await prisma.staffordosBlueprintOnboarding.findUnique({ where: { engagementId: engagement.id } })).currentRequiredInformationReadyAt.toISOString(),
        readyAt.toISOString(),
      );
      assert.equal(
        (await prisma.staffordosBlueprintOnboarding.findUnique({ where: { engagementId: engagement.id } })).originalRequiredInformationReadyAt.toISOString(),
        readyAt.toISOString(),
      );
      response = await command(11, "TRANSITION", common({ nextState: "DELIVERY_READY" }));
      assert.equal(response.status, 200);
      body = await response.json();
      assert.equal(body.onboarding.originalDeliveryClockStartedAt, "2026-10-01T16:11:00.000Z");
      assert.equal(body.onboarding.currentDeliveryDueAt, "2026-10-08T21:00:00.000Z");
      const originalDates = {
        interview: body.onboarding.originalInterviewCompletedAt,
        readiness: body.onboarding.originalRequiredInformationReadyAt,
        clock: body.onboarding.originalDeliveryClockStartedAt,
        due: body.onboarding.originalDeliveryDueAt,
      };

      assert.equal((await command(12, "APPROVE_MATERIAL_WORKFLOW_CHANGE", common({
        boundary: { ...workflow, name: "Revised workflow" }, deadlineEffect: "UNCHANGED",
      }))).status, 400);
      response = await command(12, "APPROVE_MATERIAL_WORKFLOW_CHANGE", common({
        boundary: { ...workflow, name: "Revised workflow" },
        clientAgreedBy: "Synthetic client owner", clientAgreedAt: "2026-10-01T16:00:00.000Z",
        clientAgreementEvidenceRef: "evidence://step4a/material-change", deadlineEffect: "UNCHANGED",
      }));
      assert.equal(response.status, 200);
      body = await response.json();
      assert.equal(body.engagement.state, "ONBOARDING");
      assert.deepEqual({
        interview: body.onboarding.originalInterviewCompletedAt,
        readiness: body.onboarding.originalRequiredInformationReadyAt,
        clock: body.onboarding.originalDeliveryClockStartedAt,
        due: body.onboarding.originalDeliveryDueAt,
      }, originalDates);

      response = await fetch(endpoint, { headers: AUTH });
      assert.equal(response.status, 200);
      body = await response.json();
      assert.equal(body.onboarding.version, 13);
      assert.equal(body.auditEvents.length, 13);
      assert.equal(body.auditEvents.every((event) => event.actorSubject === ACTOR), true);
      assert.equal(body.auditEvents[0].payload.actorSubject, undefined);
      assert.equal(body.auditEvents.at(-1).payload.previousDates.dueAt, originalDates.due);
    });

    const stored = await prisma.staffordosBlueprintEngagement.findUnique({
      where: { id: engagement.id }, include: { paymentEvent: true, onboarding: true },
    });
    assert.deepEqual({
      offerId: stored.offerId,
      stripeSessionId: stored.stripeSessionId,
      stripePaymentLinkId: stored.stripePaymentLinkId,
      stripeProductId: stored.stripeProductId,
      stripePriceId: stored.stripePriceId,
      stripePaymentIntentId: stored.stripePaymentIntentId,
      amountTotal: stored.amountTotal,
      currency: stored.currency,
      quantity: stored.quantity,
      paidAt: stored.paidAt.toISOString(),
      event: stored.paymentEvent,
    }, paymentBefore);
    const untouched = await prisma.staffordosBlueprintEngagement.findUnique({
      where: { id: isolated.id }, include: { onboarding: true, onboardingAuditEvents: true },
    });
    assert.equal(untouched.state, "PAID_IDENTITY_REVIEW");
    assert.equal(untouched.onboarding, null);
    assert.deepEqual(untouched.onboardingAuditEvents, []);

    const audit = await prisma.staffordosBlueprintOnboardingAuditEvent.findFirst({ where: { engagementId: engagement.id } });
    await assert.rejects(
      prisma.staffordosBlueprintOnboardingAuditEvent.update({ where: { id: audit.id }, data: { reason: "mutation forbidden" } }),
      /append-only/i,
    );
    assert.equal(await prisma.staffordosBlueprintOnboardingAuditEvent.count({ where: { engagementId: engagement.id } }), 13);
  } finally {
    await prisma.$disconnect();
    if (priorKey === undefined) delete process.env.INTERNAL_API_KEY;
    else process.env.INTERNAL_API_KEY = priorKey;
  }
});
