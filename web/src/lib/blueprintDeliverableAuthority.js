export const BLUEPRINT_DELIVERABLE_PERMISSION = "staffordos.revenue_operations.write";

export const BLUEPRINT_DELIVERABLE_IDENTIFIERS = Object.freeze([
  "workflow_interview_current_state_map",
  "primary_automation_diagnosis",
  "recommended_system_design",
  "prioritized_opportunities",
  "implementation_roadmap",
  "written_blueprint_review",
]);

const CLAIM_CLASSES = new Set(["CLIENT_STATED", "OBSERVED", "ESTIMATE", "ASSUMPTION"]);
const COMMANDS = new Set(["REGISTER_DRAFT", "REVISE_DRAFT", "RECORD_QUALITY_REVIEW"]);

export class BlueprintDeliverableError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function clean(value, max = 4000) {
  if (typeof value !== "string") return "";
  const result = value.trim();
  return result.length <= max ? result : "";
}

function array(value, name, { required = false } = {}) {
  if (!Array.isArray(value)) {
    if (!required && value === undefined) return [];
    throw new BlueprintDeliverableError(`BLUEPRINT_DELIVERABLE_${name.toUpperCase()}_INVALID`);
  }
  if (value.length > 50) throw new BlueprintDeliverableError(`BLUEPRINT_DELIVERABLE_${name.toUpperCase()}_TOO_LARGE`, 413);
  return value;
}

function jsonObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BlueprintDeliverableError(`BLUEPRINT_DELIVERABLE_${name.toUpperCase()}_INVALID`);
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > 64 * 1024) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_CONTENTS_TOO_LARGE", 413);
  return value;
}

function evidenceRefs(value) {
  const refs = array(value, "evidence_refs", { required: true });
  if (!refs.length || refs.some((ref) => !clean(typeof ref === "string" ? ref : ref?.ref, 1000))) {
    throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_EVIDENCE_REQUIRED");
  }
  return refs;
}

function claims(value) {
  const values = array(value, "claim_classifications", { required: true });
  if (!values.length || values.some((item) => !CLAIM_CLASSES.has(clean(item?.classification)))) {
    throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_CLAIM_CLASSIFICATION_REQUIRED");
  }
  return values;
}

function limitations(value) {
  return array(value, "limitations").map((item) => {
    const text = clean(typeof item === "string" ? item : item?.text, 2000);
    if (!text) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_LIMITATION_INVALID");
    return typeof item === "string" ? { text } : item;
  });
}

function normalizedDraft(data) {
  const owner = clean(data?.owner, 300);
  if (!owner) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_OWNER_REQUIRED");
  return {
    owner,
    prerequisiteRefs: array(data?.prerequisiteRefs, "prerequisite_refs"),
    contents: jsonObject(data?.contents, "contents"),
    evidenceRefs: evidenceRefs(data?.evidenceRefs),
    claimClassifications: claims(data?.claimClassifications),
    limitations: limitations(data?.limitations),
  };
}

function identifier(value) {
  const result = clean(value, 100);
  if (!BLUEPRINT_DELIVERABLE_IDENTIFIERS.includes(result)) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_IDENTIFIER_INVALID");
  return result;
}

function reason(value) {
  const result = clean(value, 2000);
  if (!result) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_REASON_REQUIRED");
  return result;
}

function actor(value) {
  if (!value?.subject || value.permission !== BLUEPRINT_DELIVERABLE_PERMISSION) {
    throw new BlueprintDeliverableError("OPERATOR_PERMISSION_MISSING", 403);
  }
  return { subject: clean(value.subject, 300), permission: value.permission };
}

function expectedVersion(value) {
  if (!Number.isInteger(value) || value < 0) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_EXPECTED_VERSION_INVALID");
  return value;
}

function auditData({ deliverableId, engagementId, sequence, version, action, previousStatus, nextStatus, actorSubject, reasonText, evidenceRef, payload }) {
  return {
    deliverableId,
    engagementId,
    sequence,
    version,
    action,
    previousStatus,
    nextStatus,
    actorSubject,
    reason: reasonText,
    evidenceRef,
    payload,
  };
}

export function createBlueprintDeliverableAuthority({ prisma, now = () => new Date() } = {}) {
  if (!prisma?.staffordosBlueprintDeliverable || !prisma?.$transaction) throw new Error("BLUEPRINT_DELIVERABLE_DEPENDENCIES_REQUIRED");

  async function list(engagementId) {
    return prisma.staffordosBlueprintDeliverable.findMany({ where: { engagementId }, orderBy: [{ identifier: "asc" }, { version: "desc" }], include: { auditEvents: { orderBy: { sequence: "asc" } } } });
  }

  return {
    async read({ engagementId }) {
      const id = clean(engagementId, 100);
      if (!id) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_ENGAGEMENT_REQUIRED");
      const engagement = await prisma.staffordosBlueprintEngagement.findUnique({ where: { id }, select: { id: true } });
      if (!engagement) throw new BlueprintDeliverableError("BLUEPRINT_ENGAGEMENT_NOT_FOUND", 404);
      return { engagementId: id, deliverables: await list(id) };
    },

    async execute({ engagementId, expectedVersion: rawExpected, command, data, actor: rawActor }) {
      const id = clean(engagementId, 100);
      if (!id) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_ENGAGEMENT_REQUIRED");
      const expected = expectedVersion(rawExpected);
      const commandName = clean(command, 60);
      if (!COMMANDS.has(commandName)) {
        if (["RELEASE", "DELIVER"].includes(commandName)) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_AUTHORITY_UNAVAILABLE", 409);
        throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_COMMAND_INVALID");
      }
      const operator = actor(rawActor);
      const reasonText = reason(data?.reason);
      const evidenceRef = clean(data?.evidenceRef, 1000);
      if (!evidenceRef) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_EVIDENCE_REQUIRED");

      const result = await prisma.$transaction(async (tx) => {
        const engagement = await tx.staffordosBlueprintEngagement.findUnique({ where: { id }, select: { id: true } });
        if (!engagement) throw new BlueprintDeliverableError("BLUEPRINT_ENGAGEMENT_NOT_FOUND", 404);
        const key = identifier(data?.identifier);
        const current = await tx.staffordosBlueprintDeliverable.findFirst({ where: { engagementId: id, identifier: key }, orderBy: { version: "desc" } });

        if (commandName === "REGISTER_DRAFT") {
          if (current) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_ALREADY_EXISTS", 409);
          const draft = normalizedDraft(data);
          const created = await tx.staffordosBlueprintDeliverable.create({ data: { engagementId: id, identifier: key, version: 1, recordVersion: 1, status: "recorded", ...draft } });
          await tx.staffordosBlueprintDeliverableAuditEvent.create({ data: auditData({ deliverableId: created.id, engagementId: id, sequence: 1, version: 1, action: commandName, previousStatus: "NONE", nextStatus: "recorded", actorSubject: operator.subject, reasonText, evidenceRef, payload: { identifier: key } }) });
          return created;
        }

        if (!current || current.recordVersion !== expected) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_STALE", 409);
        if (commandName === "REVISE_DRAFT") {
          const draft = normalizedDraft(data);
          const created = await tx.staffordosBlueprintDeliverable.create({ data: { engagementId: id, identifier: key, version: current.version + 1, recordVersion: 1, status: "recorded", ...draft, supersedesId: current.id } });
          await tx.staffordosBlueprintDeliverableAuditEvent.create({ data: auditData({ deliverableId: created.id, engagementId: id, sequence: 1, version: created.version, action: commandName, previousStatus: "NONE", nextStatus: "recorded", actorSubject: operator.subject, reasonText, evidenceRef, payload: { supersedesId: current.id } }) });
          return created;
        }

        if (current.status !== "recorded") throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_REVIEW_NOT_EDITABLE", 409);
        const updated = await tx.staffordosBlueprintDeliverable.updateMany({ where: { id: current.id, recordVersion: expected, status: "recorded" }, data: { recordVersion: { increment: 1 }, status: "reviewed", qualityReviewEvidenceRef: evidenceRef } });
        if (updated.count !== 1) throw new BlueprintDeliverableError("BLUEPRINT_DELIVERABLE_STALE", 409);
        const reviewed = await tx.staffordosBlueprintDeliverable.findUnique({ where: { id: current.id } });
        await tx.staffordosBlueprintDeliverableAuditEvent.create({ data: auditData({ deliverableId: current.id, engagementId: id, sequence: reviewed.recordVersion, version: current.version, action: commandName, previousStatus: "recorded", nextStatus: "reviewed", actorSubject: operator.subject, reasonText, evidenceRef, payload: {} }) });
        return reviewed;
      });
      return { deliverable: result, deliverables: await list(id) };
    },
  };
}
