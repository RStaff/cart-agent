import { calculateBlueprintDeliveryDeadline } from "./blueprintOnboardingCalendar.js";

export const BLUEPRINT_ONBOARDING_PERMISSION = "staffordos.revenue_operations.write";

export const BLUEPRINT_ONBOARDING_STATES = Object.freeze({
  paidIdentityReview: "PAID_IDENTITY_REVIEW",
  onboarding: "ONBOARDING",
  waitingForClientInput: "WAITING_FOR_CLIENT_INPUT",
  readyForInterview: "READY_FOR_INTERVIEW",
  interviewComplete: "INTERVIEW_COMPLETE",
  deliveryReady: "DELIVERY_READY",
});

const TRANSITIONS = new Map([
  ["PAID_IDENTITY_REVIEW", new Set(["ONBOARDING"])],
  ["ONBOARDING", new Set(["WAITING_FOR_CLIENT_INPUT", "READY_FOR_INTERVIEW"])],
  ["WAITING_FOR_CLIENT_INPUT", new Set(["ONBOARDING", "READY_FOR_INTERVIEW"])],
  ["READY_FOR_INTERVIEW", new Set(["INTERVIEW_COMPLETE", "WAITING_FOR_CLIENT_INPUT"])],
  ["INTERVIEW_COMPLETE", new Set(["WAITING_FOR_CLIENT_INPUT", "DELIVERY_READY"])],
]);

const IDENTITY_DECISIONS = new Set([
  "CONFIRM_EXISTING_CLIENT",
  "ESTABLISH_NEW_CLIENT",
  "LEAVE_UNASSOCIATED_PENDING",
  "REJECT_CLAIMED_ASSOCIATION",
]);

const PRE_DELIVERY_STATES = new Set([
  "ONBOARDING",
  "WAITING_FOR_CLIENT_INPUT",
  "READY_FOR_INTERVIEW",
  "INTERVIEW_COMPLETE",
]);

const WORKFLOW_DEFINITION_STATES = new Set([
  "ONBOARDING",
  "WAITING_FOR_CLIENT_INPUT",
]);

export class BlueprintOnboardingError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.name = "BlueprintOnboardingError";
    this.code = code;
    this.status = status;
  }
}

function fail(code, status = 400) {
  throw new BlueprintOnboardingError(code, status);
}

function requiredText(value, code, max = 500) {
  if (typeof value !== "string") fail(code);
  const normalized = value.trim();
  if (!normalized || normalized.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(normalized)) fail(code);
  return normalized;
}

function optionalText(value, code, max = 500) {
  if (value === undefined || value === null || value === "") return null;
  return requiredText(value, code, max);
}

function requiredDate(value, code, now, { futureAllowed = false } = {}) {
  if (!(value instanceof Date) && (typeof value !== "string" || !value.trim())) fail(code);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) fail(code);
  if (!futureAllowed && date.getTime() > now.getTime() + 300_000) fail(code);
  return date;
}

function textList(value, code, { min = 0, maxItems = 100, itemMax = 300 } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > maxItems) fail(code);
  return value.map((item) => requiredText(item, code, itemMax));
}

function normalizeParticipants(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) fail("BLUEPRINT_INTERVIEW_PARTICIPANTS_INVALID");
  return value.map((participant) => ({
    name: requiredText(participant?.name, "BLUEPRINT_INTERVIEW_PARTICIPANTS_INVALID", 200),
    role: requiredText(participant?.role, "BLUEPRINT_INTERVIEW_PARTICIPANTS_INVALID", 200),
  }));
}

function normalizeBoundary(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("BLUEPRINT_WORKFLOW_BOUNDARY_INVALID");
  return {
    name: requiredText(value.name, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID", 200),
    trigger: requiredText(value.trigger, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID", 500),
    terminalOutcome: requiredText(value.terminalOutcome, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID", 500),
    includedWork: textList(value.includedWork, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID", { min: 1 }),
    roles: textList(value.roles, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID"),
    teams: textList(value.teams, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID"),
    systems: textList(value.systems, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID"),
    exclusions: textList(value.exclusions, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID"),
    adjacentWorkflows: textList(value.adjacentWorkflows, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID"),
    knownExceptions: textList(value.knownExceptions, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID"),
    humanControls: textList(value.humanControls, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID"),
    clientWorkflowOwner: requiredText(value.clientWorkflowOwner, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID", 200),
    staffordMediaOwner: requiredText(value.staffordMediaOwner, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID", 200),
    selectionRationale: requiredText(value.selectionRationale, "BLUEPRINT_WORKFLOW_BOUNDARY_INVALID", 1000),
  };
}

function normalizeChecklist(value, now) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("BLUEPRINT_REQUIRED_INPUT_CHECKLIST_INVALID");
  if (!Array.isArray(value.items) || value.items.length === 0 || value.items.length > 100) fail("BLUEPRINT_REQUIRED_INPUT_CHECKLIST_INVALID");
  const keys = new Set();
  const items = value.items.map((item) => {
    const key = requiredText(item?.key, "BLUEPRINT_REQUIRED_INPUT_CHECKLIST_INVALID", 100);
    if (keys.has(key)) fail("BLUEPRINT_REQUIRED_INPUT_DUPLICATE");
    keys.add(key);
    const status = requiredText(item?.status, "BLUEPRINT_REQUIRED_INPUT_STATUS_INVALID", 40);
    if (!new Set(["PENDING", "RECEIVED", "UNAVAILABLE"]).has(status)) fail("BLUEPRINT_REQUIRED_INPUT_STATUS_INVALID");
    const normalized = {
      key,
      label: requiredText(item?.label, "BLUEPRINT_REQUIRED_INPUT_CHECKLIST_INVALID", 300),
      owner: requiredText(item?.owner, "BLUEPRINT_REQUIRED_INPUT_CHECKLIST_INVALID", 200),
      rationale: requiredText(item?.rationale, "BLUEPRINT_REQUIRED_INPUT_CHECKLIST_INVALID", 500),
      status,
      evidenceRef: null,
      receivedAt: null,
      limitation: null,
    };
    if (status === "RECEIVED") {
      normalized.evidenceRef = requiredText(item.evidenceRef, "BLUEPRINT_REQUIRED_INPUT_EVIDENCE_REQUIRED", 1000);
      normalized.receivedAt = requiredDate(item.receivedAt, "BLUEPRINT_REQUIRED_INPUT_RECEIVED_AT_INVALID", now).toISOString();
    }
    if (status === "UNAVAILABLE") {
      normalized.limitation = requiredText(item.limitation, "BLUEPRINT_REQUIRED_INPUT_LIMITATION_REQUIRED", 2000);
    }
    return normalized;
  });

  const unavailable = items.some((item) => item.status === "UNAVAILABLE");
  const complete = items.every((item) => item.status === "RECEIVED" || item.status === "UNAVAILABLE");
  const allSixDeliverablesAchievable = value.allSixDeliverablesAchievable === true;
  let limitationAgreement = null;
  if (unavailable) {
    if (value.clientAgreesToLimitations !== true || !allSixDeliverablesAchievable) {
      fail("BLUEPRINT_REQUIRED_INPUT_LIMITATION_AGREEMENT_REQUIRED");
    }
    limitationAgreement = {
      clientAgreedBy: requiredText(value.clientAgreedBy, "BLUEPRINT_REQUIRED_INPUT_LIMITATION_AGREEMENT_REQUIRED", 200),
      clientAgreedAt: requiredDate(value.clientAgreedAt, "BLUEPRINT_REQUIRED_INPUT_LIMITATION_AGREEMENT_REQUIRED", now).toISOString(),
      evidenceRef: requiredText(value.clientAgreementEvidenceRef, "BLUEPRINT_REQUIRED_INPUT_LIMITATION_AGREEMENT_REQUIRED", 1000),
    };
  }
  return {
    items,
    allSixDeliverablesAchievable,
    clientLimitationAgreement: limitationAgreement,
    readinessSatisfied: complete && allSixDeliverablesAchievable && (!unavailable || Boolean(limitationAgreement)),
  };
}

function normalizeCommon(data) {
  return {
    reason: requiredText(data?.reason, "BLUEPRINT_ONBOARDING_REASON_REQUIRED", 1000),
    evidenceRef: requiredText(data?.evidenceRef, "BLUEPRINT_ONBOARDING_EVIDENCE_REQUIRED", 1000),
  };
}

function assertIdentityReady(onboarding) {
  if (!onboarding?.identityDecision || onboarding.safeOperatingContactConfirmed !== true) {
    fail("BLUEPRINT_IDENTITY_DECISION_REQUIRED");
  }
}

function assertWorkflowReady(onboarding) {
  if (!onboarding?.workflowBoundary || !onboarding.workflowClientConfirmedAt || !onboarding.workflowClientConfirmationEvidenceRef) {
    fail("BLUEPRINT_WORKFLOW_CONFIRMATION_REQUIRED");
  }
}

function assertChecklistExists(onboarding) {
  if (!onboarding?.requiredInputChecklist) fail("BLUEPRINT_REQUIRED_INPUT_CHECKLIST_REQUIRED");
}

function assertDeliveryReady(onboarding) {
  assertIdentityReady(onboarding);
  assertWorkflowReady(onboarding);
  assertChecklistExists(onboarding);
  if (!onboarding.currentInterviewCompletedAt || !onboarding.currentInterviewEvidenceRef) fail("BLUEPRINT_INTERVIEW_EVIDENCE_REQUIRED");
  if (!onboarding.currentRequiredInformationReadyAt || !onboarding.requiredInformationReadinessEvidenceRef) {
    fail("BLUEPRINT_REQUIRED_INPUT_READINESS_INCOMPLETE");
  }
  const checklist = onboarding.requiredInputChecklist;
  if (checklist.allSixDeliverablesAchievable !== true || checklist.readinessSatisfied !== true) {
    fail("BLUEPRINT_SIX_DELIVERABLE_READINESS_REQUIRED");
  }
  if (checklist.items?.some((item) => item.status === "UNAVAILABLE") && !checklist.clientLimitationAgreement) {
    fail("BLUEPRINT_REQUIRED_INPUT_LIMITATION_AGREEMENT_REQUIRED");
  }
}

function stateTransitionAllowed(from, to) {
  return TRANSITIONS.get(from)?.has(to) === true;
}

function auditPayload(value) {
  return JSON.parse(JSON.stringify(value));
}

function resultShape(engagement, onboarding, auditEvents = []) {
  return {
    engagement: {
      id: engagement.id,
      offerId: engagement.offerId,
      state: engagement.state,
      associationStatus: engagement.associationStatus,
      clientId: engagement.clientId,
      inquiryId: engagement.inquiryId,
      paymentStatus: "VERIFIED_PAID",
      amountTotal: engagement.amountTotal,
      currency: engagement.currency,
      quantity: engagement.quantity,
      stripeSessionId: engagement.stripeSessionId,
      stripePaymentLinkId: engagement.stripePaymentLinkId,
      stripeProductId: engagement.stripeProductId,
      stripePriceId: engagement.stripePriceId,
      buyerEvidence: {
        email: engagement.buyerEmail,
        name: engagement.buyerName,
        phone: engagement.buyerPhone,
        claimedInquiryReference: engagement.claimedInquiryReference,
        authority: "PAYMENT_PROVIDER_EVIDENCE_NOT_CONFIRMED_IDENTITY",
      },
      paidAt: engagement.paidAt,
      createdAt: engagement.createdAt,
    },
    onboarding,
    auditEvents,
  };
}

function listShape(engagement) {
  return {
    ...resultShape(engagement, engagement.onboarding).engagement,
    onboarding: engagement.onboarding ? {
      version: engagement.onboarding.version,
      identityDecision: engagement.onboarding.identityDecision,
      identityReviewedAt: engagement.onboarding.identityReviewedAt,
      safeOperatingContactConfirmed: engagement.onboarding.safeOperatingContactConfirmed,
      workflowVersion: engagement.onboarding.workflowVersion,
      workflowName: engagement.onboarding.workflowBoundary?.name || null,
      checklistVersion: engagement.onboarding.checklistVersion,
      requiredInformationReadyAt: engagement.onboarding.currentRequiredInformationReadyAt,
      interviewCompletedAt: engagement.onboarding.currentInterviewCompletedAt,
      deliveryClockStartedAt: engagement.onboarding.currentDeliveryClockStartedAt,
      deliveryDueAt: engagement.onboarding.currentDeliveryDueAt,
      calendarVersion: engagement.onboarding.calendarVersion,
    } : null,
  };
}

function mapConcurrentError(error) {
  if (error instanceof BlueprintOnboardingError) throw error;
  if (error?.code === "P2002" || error?.code === "P2034") {
    throw new BlueprintOnboardingError("BLUEPRINT_ONBOARDING_STALE_VERSION", 409);
  }
  throw error;
}

export function createBlueprintOnboardingAuthority({
  prisma,
  now = () => new Date(),
  approvedClosures = [],
  verifyClientAssociation = null,
}) {
  if (!prisma?.staffordosBlueprintEngagement || !prisma?.$transaction) {
    throw new Error("blueprint_onboarding_authority_dependencies_required");
  }

  async function read({ engagementId }) {
    const id = requiredText(engagementId, "BLUEPRINT_ENGAGEMENT_ID_REQUIRED", 191);
    const engagement = await prisma.staffordosBlueprintEngagement.findUnique({
      where: { id },
      include: {
        onboarding: true,
        onboardingAuditEvents: { orderBy: [{ version: "asc" }, { createdAt: "asc" }] },
      },
    });
    if (!engagement) fail("BLUEPRINT_ENGAGEMENT_NOT_FOUND", 404);
    return resultShape(engagement, engagement.onboarding, engagement.onboardingAuditEvents);
  }

  async function list() {
    const engagements = await prisma.staffordosBlueprintEngagement.findMany({
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: { onboarding: true },
    });
    return { engagements: engagements.map(listShape) };
  }

  async function execute({ engagementId, expectedVersion, command, data, actor }) {
    const id = requiredText(engagementId, "BLUEPRINT_ENGAGEMENT_ID_REQUIRED", 191);
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) fail("BLUEPRINT_ONBOARDING_VERSION_INVALID");
    const commandName = requiredText(command, "BLUEPRINT_ONBOARDING_COMMAND_INVALID", 80);
    const subject = requiredText(actor?.subject, "OPERATOR_IDENTITY_MISSING", 320);
    if (actor?.permission !== BLUEPRINT_ONBOARDING_PERMISSION) fail("OPERATOR_PERMISSION_MISSING", 403);
    const occurredAt = now();
    if (!(occurredAt instanceof Date) || Number.isNaN(occurredAt.getTime())) throw new Error("blueprint_onboarding_clock_invalid");

    try {
      return await prisma.$transaction(async (tx) => {
        const engagement = await tx.staffordosBlueprintEngagement.findUnique({
          where: { id },
          include: { onboarding: true },
        });
        if (!engagement) fail("BLUEPRINT_ENGAGEMENT_NOT_FOUND", 404);
        const current = engagement.onboarding;
        const currentVersion = current?.version || 0;
        if (currentVersion !== expectedVersion) fail("BLUEPRINT_ONBOARDING_STALE_VERSION", 409);
        const nextVersion = currentVersion + 1;
        const common = normalizeCommon(data);
        const onboardingData = {};
        const engagementData = {};
        let previousState = engagement.state;
        let nextState = engagement.state;
        let payload = {};

        if (commandName === "DECIDE_IDENTITY") {
          if (engagement.state !== BLUEPRINT_ONBOARDING_STATES.paidIdentityReview) fail("BLUEPRINT_IDENTITY_STATE_INVALID");
          const decision = requiredText(data?.decision, "BLUEPRINT_IDENTITY_DECISION_INVALID", 80);
          if (!IDENTITY_DECISIONS.has(decision)) fail("BLUEPRINT_IDENTITY_DECISION_INVALID");
          if (data?.safeOperatingContactConfirmed !== true) fail("BLUEPRINT_SAFE_OPERATING_CONTACT_REQUIRED");
          const clientId = optionalText(data?.clientId, "BLUEPRINT_CLIENT_ID_INVALID", 191);
          const inquiryId = optionalText(data?.inquiryId, "BLUEPRINT_INQUIRY_ID_INVALID", 191);
          const candidates = textList(data?.candidates || [], "BLUEPRINT_IDENTITY_CANDIDATES_INVALID", { maxItems: 50, itemMax: 500 });
          if (decision === "CONFIRM_EXISTING_CLIENT" && !clientId) fail("BLUEPRINT_CLIENT_ID_REQUIRED");
          if (decision === "CONFIRM_EXISTING_CLIENT") {
            if (typeof verifyClientAssociation !== "function") fail("BLUEPRINT_CLIENT_AUTHORITY_UNAVAILABLE", 503);
            const verifiedAssociation = await verifyClientAssociation({ clientId, actorSubject: subject, tx });
            if (verifiedAssociation?.clientId !== clientId || verifiedAssociation?.verified !== true) {
              fail("BLUEPRINT_CLIENT_ASSOCIATION_UNVERIFIED");
            }
          } else if (clientId) {
            fail("BLUEPRINT_CLIENT_ID_NOT_VERIFIED");
          }
          if (decision === "ESTABLISH_NEW_CLIENT") fail("BLUEPRINT_CLIENT_AUTHORITY_UNAVAILABLE", 503);
          if ((decision === "LEAVE_UNASSOCIATED_PENDING" || decision === "REJECT_CLAIMED_ASSOCIATION") && (clientId || inquiryId)) {
            fail("BLUEPRINT_IDENTITY_ASSOCIATION_CONFLICT");
          }
          if (inquiryId) {
            const inquiry = await tx.staffordosInboundAutomationInquiry.findUnique({ where: { id: inquiryId }, select: { id: true } });
            if (!inquiry) fail("BLUEPRINT_INQUIRY_NOT_FOUND", 404);
          }
          onboardingData.identityDecision = decision;
          onboardingData.identityCandidates = candidates;
          onboardingData.identityEvidenceRef = common.evidenceRef;
          onboardingData.identityReviewedAt = occurredAt;
          onboardingData.identityReviewedBy = subject;
          onboardingData.safeOperatingContactConfirmed = true;
          engagementData.clientId = clientId;
          engagementData.inquiryId = inquiryId;
          engagementData.associationStatus = decision === "CONFIRM_EXISTING_CLIENT"
            ? "CONFIRMED"
            : decision === "REJECT_CLAIMED_ASSOCIATION" ? "REJECTED" : "PENDING_REVIEW";
          payload = { decision, candidates, clientId, inquiryId, safeOperatingContactConfirmed: true };
        } else if (commandName === "DEFINE_WORKFLOW") {
          if (!WORKFLOW_DEFINITION_STATES.has(engagement.state)) fail("BLUEPRINT_WORKFLOW_STATE_INVALID");
          if (current?.currentInterviewCompletedAt) fail("BLUEPRINT_WORKFLOW_CHANGE_REQUIRES_MATERIAL_AGREEMENT");
          const boundary = normalizeBoundary(data?.boundary);
          const clientConfirmedAt = requiredDate(data?.clientConfirmedAt, "BLUEPRINT_WORKFLOW_CLIENT_CONFIRMATION_REQUIRED", occurredAt);
          const clientConfirmedBy = requiredText(data?.clientConfirmedBy, "BLUEPRINT_WORKFLOW_CLIENT_CONFIRMATION_REQUIRED", 200);
          const clientConfirmationEvidenceRef = requiredText(data?.clientConfirmationEvidenceRef, "BLUEPRINT_WORKFLOW_CLIENT_CONFIRMATION_REQUIRED", 1000);
          onboardingData.workflowVersion = (current?.workflowVersion || 0) + 1;
          onboardingData.workflowBoundary = boundary;
          onboardingData.workflowClientConfirmedAt = clientConfirmedAt;
          onboardingData.workflowClientConfirmedBy = clientConfirmedBy;
          onboardingData.workflowClientConfirmationEvidenceRef = clientConfirmationEvidenceRef;
          if (current?.workflowBoundary) {
            onboardingData.requiredInputChecklist = null;
            onboardingData.currentRequiredInformationReadyAt = null;
            onboardingData.requiredInformationReadinessEvidenceRef = null;
          }
          payload = {
            workflowVersion: onboardingData.workflowVersion,
            previousBoundary: current?.workflowBoundary || null,
            boundary,
            clientConfirmedAt: clientConfirmedAt.toISOString(),
            clientConfirmedBy,
            clientConfirmationEvidenceRef,
            requiredInputsInvalidated: Boolean(current?.workflowBoundary),
          };
        } else if (commandName === "SET_REQUIRED_INPUTS") {
          if (!PRE_DELIVERY_STATES.has(engagement.state)) fail("BLUEPRINT_REQUIRED_INPUT_STATE_INVALID");
          const checklist = normalizeChecklist(data?.checklist, occurredAt);
          const readinessEvidenceRef = checklist.readinessSatisfied
            ? requiredText(data?.readinessEvidenceRef, "BLUEPRINT_REQUIRED_INPUT_READINESS_EVIDENCE_REQUIRED", 1000)
            : null;
          onboardingData.checklistVersion = (current?.checklistVersion || 0) + 1;
          onboardingData.requiredInputChecklist = checklist;
          const priorReadinessStillValid = current?.requiredInputChecklist?.readinessSatisfied === true
            && current?.currentRequiredInformationReadyAt;
          onboardingData.currentRequiredInformationReadyAt = checklist.readinessSatisfied
            ? (priorReadinessStillValid || occurredAt)
            : null;
          if (checklist.readinessSatisfied) {
            onboardingData.originalRequiredInformationReadyAt = current?.originalRequiredInformationReadyAt
              || onboardingData.currentRequiredInformationReadyAt;
          }
          onboardingData.requiredInformationReadinessEvidenceRef = readinessEvidenceRef;
          payload = {
            checklistVersion: onboardingData.checklistVersion,
            previousChecklist: current?.requiredInputChecklist || null,
            checklist,
            requiredInformationReadyAt: onboardingData.currentRequiredInformationReadyAt?.toISOString() || null,
            readinessEvidenceRef,
          };
        } else if (commandName === "RECORD_INTERVIEW") {
          if (engagement.state !== BLUEPRINT_ONBOARDING_STATES.readyForInterview) fail("BLUEPRINT_INTERVIEW_STATE_INVALID");
          if (current?.currentInterviewCompletedAt) fail("BLUEPRINT_INTERVIEW_ALREADY_RECORDED");
          const completedAt = requiredDate(data?.completedAt, "BLUEPRINT_INTERVIEW_COMPLETED_AT_INVALID", occurredAt);
          const participants = normalizeParticipants(data?.participants);
          const interviewEvidenceRef = requiredText(data?.interviewEvidenceRef, "BLUEPRINT_INTERVIEW_EVIDENCE_REQUIRED", 1000);
          onboardingData.currentInterviewCompletedAt = completedAt;
          onboardingData.currentInterviewParticipants = participants;
          onboardingData.currentInterviewEvidenceRef = interviewEvidenceRef;
          onboardingData.interviewRecordedBy = subject;
          onboardingData.originalInterviewCompletedAt = current?.originalInterviewCompletedAt || completedAt;
          payload = { completedAt: completedAt.toISOString(), participants, interviewEvidenceRef };
        } else if (commandName === "TRANSITION") {
          const requestedState = requiredText(data?.nextState, "BLUEPRINT_ONBOARDING_TRANSITION_INVALID", 80);
          if (!stateTransitionAllowed(engagement.state, requestedState)) fail("BLUEPRINT_ONBOARDING_TRANSITION_INVALID");
          if (engagement.state === "PAID_IDENTITY_REVIEW" && requestedState === "ONBOARDING") assertIdentityReady(current);
          if (requestedState === "READY_FOR_INTERVIEW") {
            assertIdentityReady(current);
            assertWorkflowReady(current);
            assertChecklistExists(current);
          }
          if (requestedState === "INTERVIEW_COMPLETE" && !current?.currentInterviewCompletedAt) fail("BLUEPRINT_INTERVIEW_EVIDENCE_REQUIRED");
          if (requestedState === "DELIVERY_READY") {
            assertDeliveryReady(current);
            const clockStartedAt = new Date(Math.max(
              current.currentInterviewCompletedAt.getTime(),
              current.currentRequiredInformationReadyAt.getTime(),
            ));
            const deadline = calculateBlueprintDeliveryDeadline({ startAt: clockStartedAt, approvedClosures });
            const dueAt = current.approvedRevisedDueAt || deadline.dueAt;
            onboardingData.originalInterviewCompletedAt = current.originalInterviewCompletedAt || current.currentInterviewCompletedAt;
            onboardingData.originalRequiredInformationReadyAt = current.originalRequiredInformationReadyAt || current.currentRequiredInformationReadyAt;
            onboardingData.originalDeliveryClockStartedAt = current.originalDeliveryClockStartedAt || clockStartedAt;
            onboardingData.originalDeliveryDueAt = current.originalDeliveryDueAt || deadline.dueAt;
            onboardingData.currentDeliveryClockStartedAt = clockStartedAt;
            onboardingData.currentDeliveryDueAt = dueAt;
            onboardingData.calendarVersion = deadline.calendarVersion;
            payload = {
              clockStartedAt: clockStartedAt.toISOString(),
              calculatedDueAt: deadline.dueAt.toISOString(),
              dueAt: dueAt.toISOString(),
              dayZero: deadline.dayZero,
              dueDate: deadline.dueDate,
              calendarVersion: deadline.calendarVersion,
              approvedRevisionApplied: Boolean(current.approvedRevisedDueAt),
            };
          }
          engagementData.state = requestedState;
          nextState = requestedState;
        } else if (commandName === "APPROVE_MATERIAL_WORKFLOW_CHANGE") {
          if (engagement.state !== BLUEPRINT_ONBOARDING_STATES.deliveryReady) fail("BLUEPRINT_MATERIAL_CHANGE_STATE_INVALID");
          const boundary = normalizeBoundary(data?.boundary);
          const clientAgreedBy = requiredText(data?.clientAgreedBy, "BLUEPRINT_MATERIAL_CHANGE_CLIENT_AGREEMENT_REQUIRED", 200);
          const clientAgreedAt = requiredDate(data?.clientAgreedAt, "BLUEPRINT_MATERIAL_CHANGE_CLIENT_AGREEMENT_REQUIRED", occurredAt);
          const clientAgreementEvidenceRef = requiredText(data?.clientAgreementEvidenceRef, "BLUEPRINT_MATERIAL_CHANGE_CLIENT_AGREEMENT_REQUIRED", 1000);
          const deadlineEffect = requiredText(data?.deadlineEffect, "BLUEPRINT_MATERIAL_CHANGE_DEADLINE_EFFECT_INVALID", 20);
          if (!new Set(["UNCHANGED", "REVISED"]).has(deadlineEffect)) fail("BLUEPRINT_MATERIAL_CHANGE_DEADLINE_EFFECT_INVALID");
          const revisedDueAt = deadlineEffect === "REVISED"
            ? requiredDate(data?.revisedDueAt, "BLUEPRINT_MATERIAL_CHANGE_REVISED_DUE_REQUIRED", occurredAt, { futureAllowed: true })
            : current.currentDeliveryDueAt;
          if (!revisedDueAt) fail("BLUEPRINT_MATERIAL_CHANGE_REVISED_DUE_REQUIRED");
          if (deadlineEffect === "REVISED" && revisedDueAt.getTime() <= occurredAt.getTime()) fail("BLUEPRINT_MATERIAL_CHANGE_REVISED_DUE_INVALID");
          onboardingData.workflowVersion = (current.workflowVersion || 0) + 1;
          onboardingData.workflowBoundary = boundary;
          onboardingData.workflowClientConfirmedAt = clientAgreedAt;
          onboardingData.workflowClientConfirmedBy = clientAgreedBy;
          onboardingData.workflowClientConfirmationEvidenceRef = clientAgreementEvidenceRef;
          onboardingData.requiredInputChecklist = null;
          onboardingData.currentRequiredInformationReadyAt = null;
          onboardingData.requiredInformationReadinessEvidenceRef = null;
          onboardingData.currentInterviewCompletedAt = null;
          onboardingData.currentInterviewParticipants = null;
          onboardingData.currentInterviewEvidenceRef = null;
          onboardingData.interviewRecordedBy = null;
          onboardingData.currentDeliveryClockStartedAt = null;
          onboardingData.currentDeliveryDueAt = revisedDueAt;
          onboardingData.approvedRevisedDueAt = revisedDueAt;
          onboardingData.approvedRevisionEvidenceRef = clientAgreementEvidenceRef;
          engagementData.state = BLUEPRINT_ONBOARDING_STATES.onboarding;
          nextState = BLUEPRINT_ONBOARDING_STATES.onboarding;
          payload = {
            previousBoundary: current.workflowBoundary,
            previousWorkflowVersion: current.workflowVersion,
            previousDates: {
              interviewCompletedAt: current.currentInterviewCompletedAt,
              requiredInformationReadyAt: current.currentRequiredInformationReadyAt,
              clockStartedAt: current.currentDeliveryClockStartedAt,
              dueAt: current.currentDeliveryDueAt,
            },
            boundary,
            workflowVersion: onboardingData.workflowVersion,
            clientAgreedBy,
            clientAgreedAt: clientAgreedAt.toISOString(),
            clientAgreementEvidenceRef,
            deadlineEffect,
            revisedDueAt: revisedDueAt.toISOString(),
            rossAgreedBy: subject,
          };
        } else {
          fail("BLUEPRINT_ONBOARDING_COMMAND_INVALID");
        }

        let onboarding;
        if (!current) {
          if (expectedVersion !== 0) fail("BLUEPRINT_ONBOARDING_STALE_VERSION", 409);
          onboarding = await tx.staffordosBlueprintOnboarding.create({
            data: { engagementId: id, version: nextVersion, ...onboardingData },
          });
        } else {
          const updated = await tx.staffordosBlueprintOnboarding.updateMany({
            where: { id: current.id, version: expectedVersion },
            data: { ...onboardingData, version: nextVersion },
          });
          if (updated.count !== 1) fail("BLUEPRINT_ONBOARDING_STALE_VERSION", 409);
          onboarding = await tx.staffordosBlueprintOnboarding.findUnique({ where: { id: current.id } });
        }

        const updatedEngagement = Object.keys(engagementData).length
          ? await tx.staffordosBlueprintEngagement.update({ where: { id }, data: engagementData })
          : engagement;
        await tx.staffordosBlueprintOnboardingAuditEvent.create({
          data: {
            onboardingId: onboarding.id,
            engagementId: id,
            version: nextVersion,
            action: commandName,
            previousState,
            nextState,
            actorSubject: subject,
            reason: common.reason,
            evidenceRef: common.evidenceRef,
            payload: auditPayload(payload),
            createdAt: occurredAt,
          },
        });
        return resultShape(updatedEngagement, onboarding);
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      mapConcurrentError(error);
    }
  }

  return { list, read, execute };
}
