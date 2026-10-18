import crypto from "node:crypto";
import { BLUEPRINT_DELIVERABLE_IDENTIFIERS } from "./blueprintDeliverableAuthority.js";

export const BLUEPRINT_PACKAGE_PERMISSION = "staffordos.revenue_operations.write";
export const BLUEPRINT_PACKAGE_COMMANDS = Object.freeze(["CREATE_PREVIEW_SNAPSHOT", "RELEASE_PACKAGE", "RECORD_DELIVERY"]);
export const BLUEPRINT_PACKAGE_RENDERER_VERSION = "stafford-media-blueprint-html-v1";
const CLIENT_TITLES = Object.freeze({
  workflow_interview_current_state_map: "Workflow interview and current-state map",
  primary_automation_diagnosis: "Primary automation diagnosis",
  recommended_system_design: "Recommended system design",
  prioritized_opportunities: "Prioritized opportunities",
  implementation_roadmap: "Implementation roadmap",
  written_blueprint_review: "Written Blueprint and review",
});

export class BlueprintPackageError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
const clean = (value, max = 4000) => typeof value === "string" && value.trim().length <= max ? value.trim() : "";
const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const digest = (value) => crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
const stable = (value) => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const MANUAL_CHANNELS = new Set(["MANUAL_EMAIL", "MANUAL_SHARED_LINK", "MANUAL_IN_PERSON"]);

function actor(value) {
  if (!value?.subject || value.permission !== BLUEPRINT_PACKAGE_PERMISSION) throw new BlueprintPackageError("OPERATOR_PERMISSION_MISSING", 403);
  return { subject: clean(value.subject, 300), permission: value.permission };
}
function idempotency(value) {
  const result = clean(value, 200);
  if (!result) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_IDEMPOTENCY_REQUIRED");
  return result;
}
function reason(value) {
  const result = clean(value, 2000);
  if (!result) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_REASON_REQUIRED");
  return result;
}
function evidence(value) {
  const result = clean(value, 1000);
  if (!result) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_EVIDENCE_REQUIRED");
  return result;
}

function clientJson(value) {
  if (value === null || value === undefined) return "Not recorded";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return esc(value);
  return esc(JSON.stringify(value, null, 2));
}
function labeled(value) {
  if (value === null || value === undefined) return "<span>Not recorded</span>";
  if (Array.isArray(value)) return `<ul>${value.map((entry) => `<li>${labeled(entry)}</li>`).join("")}</ul>`;
  if (typeof value === "object") return `<dl>${Object.entries(value).map(([key, entry]) => `<div><dt>${esc(key)}</dt><dd>${labeled(entry)}</dd></div>`).join("")}</dl>`;
  return `<span>${esc(value)}</span>`;
}

export function renderBlueprintPackageHtml({ packageVersion, deliverables }) {
  const sections = deliverables.map((item) => {
    const title = CLIENT_TITLES[item.identifier] || item.identifier;
    const evidenceRefs = Array.isArray(item.evidenceRefs) ? item.evidenceRefs : [];
    const claims = Array.isArray(item.claimClassifications) ? item.claimClassifications : [];
    const limitations = Array.isArray(item.limitations) ? item.limitations : [];
    return `<section class="deliverable"><h2>${esc(title)}</h2><p class="version">Version ${esc(item.version)} · reviewed</p><h3>Owner</h3><p>${esc(item.owner)}</p><h3>Contents</h3><div class="contents">${labeled(item.contents)}</div><h3>Evidence references</h3><ul>${evidenceRefs.map((entry) => `<li>${clientJson(typeof entry === "string" ? entry : entry?.ref)}${entry?.observedAt ? ` <span>(${esc(entry.observedAt)})</span>` : ""}</li>`).join("")}</ul><h3>Claim classifications</h3><ul>${claims.map((entry) => `<li>${esc(entry?.classification)}: ${clientJson(entry?.claim)}</li>`).join("")}</ul><h3>Limitations</h3>${limitations.length ? `<ul>${limitations.map((entry) => `<li>${clientJson(typeof entry === "string" ? entry : entry?.text)}</li>`).join("")}</ul>` : "<p>None recorded.</p>"}</section>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Stafford Media Automation Opportunity Blueprint</title><style>body{font-family:system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem;color:#17202a;line-height:1.45}h1{font-size:2rem}h2{border-top:1px solid #ccd;padding-top:1.5rem;break-after:avoid}.version{color:#52606d}.contents{background:#f5f7f9;padding:1rem;border-radius:.35rem;overflow-wrap:anywhere}.contents dl{margin:0}.contents dt{font-weight:700;margin-top:.6rem}.contents dd{margin:.15rem 0 0 1rem}.contents ul{margin:.2rem 0}.contents li{overflow-wrap:anywhere}li{overflow-wrap:anywhere}@media print{body{margin:0}.deliverable{break-inside:auto}h2{break-after:avoid}}</style></head><body><header><h1>Stafford Media Automation Opportunity Blueprint</h1><p>Package version ${esc(packageVersion)}</p><p>Preparation evidence only: implementation, client acceptance, and business outcomes are separate.</p></header>${sections}<section class="measurement-status"><h2>Measurement status</h2><p>Baseline: Not measured yet.</p><p>Agreed target: Not measured yet.</p><p>Observed result: Not measured yet.</p><p>Business outcomes and ROI: Not measured yet.</p></section></body></html>`;
}

export function createBlueprintPackageAuthority({ prisma, now = () => new Date() } = {}) {
  if (!prisma?.staffordosBlueprintPackage || !prisma?.$transaction) throw new Error("BLUEPRINT_PACKAGE_DEPENDENCIES_REQUIRED");
  const latestReviewed = async (tx, engagementId) => {
    const rows = [];
    for (const identifier of BLUEPRINT_DELIVERABLE_IDENTIFIERS) {
      const item = await tx.staffordosBlueprintDeliverable.findFirst({ where: { engagementId, identifier }, orderBy: { version: "desc" } });
      if (!item || item.status !== "reviewed") throw new BlueprintPackageError("BLUEPRINT_PACKAGE_SIX_REVIEWED_REQUIRED", 409);
      rows.push(item);
    }
    return rows;
  };
  const sourceTuple = (rows) => rows.map((item) => ({ id: item.id, identifier: item.identifier, version: item.version, recordVersion: item.recordVersion, contentDigest: digest(stable({ owner: item.owner, contents: item.contents, evidenceRefs: item.evidenceRefs, claimClassifications: item.claimClassifications, limitations: item.limitations })) }));
  const audit = ({ packageId, engagementId, sequence, action, previousStatus, nextStatus, actorSubject, reasonText, evidenceRef, payload }) => ({ packageId, engagementId, sequence, action, previousStatus, nextStatus, actorSubject, reason: reasonText, evidenceRef, payload });
  async function readSnapshot({ engagementId, snapshotId }) {
    const packageRow = await prisma.staffordosBlueprintPackage.findFirst({ where: { id: snapshotId, engagementId }, include: { auditEvents: { orderBy: { sequence: "asc" } }, deliveries: { orderBy: { createdAt: "asc" } } } });
    if (!packageRow) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_NOT_FOUND", 404);
    return { package: packageRow };
  }
  return {
    async preview({ engagementId, actor: rawActor, data }) {
      const operator = actor(rawActor); const id = clean(engagementId, 100); if (!id) throw new BlueprintPackageError("BLUEPRINT_ENGAGEMENT_REQUIRED");
      const idem = idempotency(data?.idempotencyKey); const reasonText = reason(data?.reason); const evidenceRef = evidence(data?.evidenceRef);
      return prisma.$transaction(async (tx) => {
        const existing = await tx.staffordosBlueprintPackage.findUnique({ where: { creationIdempotencyKey: idem } });
        if (existing) {
          if (existing.engagementId !== id) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_IDEMPOTENCY_CONFLICT", 409);
          return { package: existing };
        }
        if (!await tx.staffordosBlueprintEngagement.findUnique({ where: { id }, select: { id: true } })) throw new BlueprintPackageError("BLUEPRINT_ENGAGEMENT_NOT_FOUND", 404);
        const rows = await latestReviewed(tx, id); const sourceVersions = sourceTuple(rows); const last = await tx.staffordosBlueprintPackage.findFirst({ where: { engagementId: id }, orderBy: { packageVersion: "desc" }, select: { packageVersion: true } }); const packageVersion = (last?.packageVersion || 0) + 1; const renderedHtml = renderBlueprintPackageHtml({ packageVersion, deliverables: rows });
        const contentDigest = digest(renderedHtml);
        const created = await tx.staffordosBlueprintPackage.create({ data: { engagementId: id, packageVersion, sourceVersions, rendererVersion: BLUEPRINT_PACKAGE_RENDERER_VERSION, templateDigest: digest("stafford-media-blueprint-template-v1"), assetDigest: digest(""), renderedHtml, contentDigest, creationIdempotencyKey: idem } });
        await tx.staffordosBlueprintPackageAuditEvent.create({ data: audit({ packageId: created.id, engagementId: id, sequence: 1, action: "CREATE_PREVIEW_SNAPSHOT", previousStatus: "NONE", nextStatus: "preview", actorSubject: operator.subject, reasonText, evidenceRef, payload: { sourceVersions } }) });
        return { package: created };
      });
    },
    async read({ engagementId, snapshotId }) { return readSnapshot({ engagementId: clean(engagementId, 100), snapshotId: clean(snapshotId, 100) }); },
    async execute({ engagementId, actor: rawActor, command, data }) {
      const operator = actor(rawActor); const id = clean(engagementId, 100); const commandName = clean(command, 60); if (!BLUEPRINT_PACKAGE_COMMANDS.includes(commandName)) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_COMMAND_INVALID");
      if (commandName === "CREATE_PREVIEW_SNAPSHOT") return this.preview({ engagementId: id, actor: operator, data });
      const snapshotId = clean(data?.snapshotId, 100); if (!snapshotId) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_SNAPSHOT_REQUIRED"); const reasonText = reason(data?.reason); const evidenceRef = evidence(data?.evidenceRef);
      return prisma.$transaction(async (tx) => {
        const packageRow = await tx.staffordosBlueprintPackage.findFirst({ where: { id: snapshotId, engagementId: id } }); if (!packageRow) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_NOT_FOUND", 404);
        if (commandName === "RELEASE_PACKAGE") {
          const idem = idempotency(data?.idempotencyKey); const suppliedDigest = clean(data?.contentDigest, 128); if (!suppliedDigest || suppliedDigest !== packageRow.contentDigest) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_DIGEST_MISMATCH", 409); if (packageRow.status === "released" && packageRow.releaseIdempotencyKey === idem) return { package: packageRow };
          if (packageRow.status !== "preview") throw new BlueprintPackageError("BLUEPRINT_PACKAGE_ALREADY_RELEASED", 409);
          const rows = await latestReviewed(tx, id); const current = sourceTuple(rows); if (stable(current) !== stable(packageRow.sourceVersions)) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_STALE", 409);
          const updated = await tx.staffordosBlueprintPackage.updateMany({ where: { id: snapshotId, engagementId: id, status: "preview", recordVersion: packageRow.recordVersion }, data: { status: "released", releasedAt: now(), releasedBy: operator.subject, releaseIdempotencyKey: idem, recordVersion: { increment: 1 } } }); if (updated.count !== 1) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_STALE", 409);
          const released = await tx.staffordosBlueprintPackage.findUnique({ where: { id: snapshotId } }); await tx.staffordosBlueprintPackageAuditEvent.create({ data: audit({ packageId: snapshotId, engagementId: id, sequence: released.recordVersion, action: commandName, previousStatus: "preview", nextStatus: "released", actorSubject: operator.subject, reasonText, evidenceRef, payload: { contentDigest: released.contentDigest } }) }); return { package: released };
        }
        const idem = idempotency(data?.idempotencyKey); const recipient = clean(data?.recipient, 320); const channel = clean(data?.channel, 100); const handoffAt = new Date(data?.handoffAt || ""); if (!recipient || !MANUAL_CHANNELS.has(channel) || !data?.recipientVerified || !evidenceRef || Number.isNaN(handoffAt.getTime())) throw new BlueprintPackageError("BLUEPRINT_DELIVERY_HANDOFF_INVALID");
        const existing = await tx.staffordosBlueprintDelivery.findUnique({ where: { idempotencyKey: idem } }); if (existing) { if (existing.engagementId !== id || existing.packageId !== snapshotId) throw new BlueprintPackageError("BLUEPRINT_DELIVERY_IDEMPOTENCY_CONFLICT", 409); return { delivery: existing, package: packageRow }; } if (packageRow.status !== "released") throw new BlueprintPackageError("BLUEPRINT_DELIVERY_RELEASE_REQUIRED", 409);
        const advanced = await tx.staffordosBlueprintPackage.updateMany({ where: { id: snapshotId, engagementId: id, status: "released", recordVersion: packageRow.recordVersion }, data: { recordVersion: { increment: 1 } } }); if (advanced.count !== 1) throw new BlueprintPackageError("BLUEPRINT_PACKAGE_STALE", 409);
        const delivery = await tx.staffordosBlueprintDelivery.create({ data: { packageId: snapshotId, engagementId: id, recipient, channel, handoffAt, evidenceRef, verified: true, actorSubject: operator.subject, idempotencyKey: idem } });
        await tx.staffordosBlueprintPackageAuditEvent.create({ data: audit({ packageId: snapshotId, engagementId: id, sequence: packageRow.recordVersion + 1, action: commandName, previousStatus: "released", nextStatus: "released", actorSubject: operator.subject, reasonText, evidenceRef, payload: { deliveryId: delivery.id, recipient, channel, handoffAt: handoffAt.toISOString() } }) }); return { delivery, package: { ...packageRow, recordVersion: packageRow.recordVersion + 1 } };
      });
    },
  };
}
