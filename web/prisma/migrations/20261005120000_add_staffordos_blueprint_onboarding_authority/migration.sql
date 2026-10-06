CREATE TABLE "StaffordosBlueprintOnboarding" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "identityDecision" TEXT,
    "identityCandidates" JSONB,
    "identityEvidenceRef" TEXT,
    "identityReviewedAt" TIMESTAMP(3),
    "identityReviewedBy" TEXT,
    "safeOperatingContactConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "workflowVersion" INTEGER NOT NULL DEFAULT 0,
    "workflowBoundary" JSONB,
    "workflowClientConfirmedAt" TIMESTAMP(3),
    "workflowClientConfirmedBy" TEXT,
    "workflowClientConfirmationEvidenceRef" TEXT,
    "checklistVersion" INTEGER NOT NULL DEFAULT 0,
    "requiredInputChecklist" JSONB,
    "currentRequiredInformationReadyAt" TIMESTAMP(3),
    "requiredInformationReadinessEvidenceRef" TEXT,
    "currentInterviewCompletedAt" TIMESTAMP(3),
    "currentInterviewParticipants" JSONB,
    "currentInterviewEvidenceRef" TEXT,
    "interviewRecordedBy" TEXT,
    "originalInterviewCompletedAt" TIMESTAMP(3),
    "originalRequiredInformationReadyAt" TIMESTAMP(3),
    "originalDeliveryClockStartedAt" TIMESTAMP(3),
    "originalDeliveryDueAt" TIMESTAMP(3),
    "currentDeliveryClockStartedAt" TIMESTAMP(3),
    "currentDeliveryDueAt" TIMESTAMP(3),
    "approvedRevisedDueAt" TIMESTAMP(3),
    "approvedRevisionEvidenceRef" TEXT,
    "calendarVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffordosBlueprintOnboarding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffordosBlueprintOnboardingAuditEvent" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "previousState" TEXT NOT NULL,
    "nextState" TEXT NOT NULL,
    "actorSubject" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceRef" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffordosBlueprintOnboardingAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffordosBlueprintOnboarding_engagementId_key"
ON "StaffordosBlueprintOnboarding"("engagementId");

CREATE UNIQUE INDEX "StaffordosBlueprintOnboardingAuditEvent_onboardingId_version_key"
ON "StaffordosBlueprintOnboardingAuditEvent"("onboardingId", "version");

CREATE INDEX "StaffordosBlueprintOnboardingAuditEvent_engagementId_createdAt_idx"
ON "StaffordosBlueprintOnboardingAuditEvent"("engagementId", "createdAt");

ALTER TABLE "StaffordosBlueprintOnboarding"
ADD CONSTRAINT "StaffordosBlueprintOnboarding_engagementId_fkey"
FOREIGN KEY ("engagementId") REFERENCES "StaffordosBlueprintEngagement"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffordosBlueprintOnboardingAuditEvent"
ADD CONSTRAINT "StaffordosBlueprintOnboardingAuditEvent_onboardingId_fkey"
FOREIGN KEY ("onboardingId") REFERENCES "StaffordosBlueprintOnboarding"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffordosBlueprintOnboardingAuditEvent"
ADD CONSTRAINT "StaffordosBlueprintOnboardingAuditEvent_engagementId_fkey"
FOREIGN KEY ("engagementId") REFERENCES "StaffordosBlueprintEngagement"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION staffordos_blueprint_onboarding_audit_append_only()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Staffordos Blueprint onboarding audit events are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "StaffordosBlueprintOnboardingAuditEvent_append_only"
BEFORE UPDATE OR DELETE ON "StaffordosBlueprintOnboardingAuditEvent"
FOR EACH ROW EXECUTE FUNCTION staffordos_blueprint_onboarding_audit_append_only();
