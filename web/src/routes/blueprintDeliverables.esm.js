import { internalOnly } from "../middleware/internalOnly.js";
import { requireOperatorReviewContext } from "../lib/automationInquiryReview.js";
import {
  BlueprintDeliverableError,
  createBlueprintDeliverableAuthority,
} from "../lib/blueprintDeliverableAuthority.js";

const MAX_COMMAND_BYTES = 64 * 1024;

function governedOperator(req, res, next) {
  try {
    req.blueprintDeliverableActor = requireOperatorReviewContext(req);
    return next();
  } catch (error) {
    return res.status(403).json({ ok: false, error: String(error?.code || "OPERATOR_AUTHORIZATION_REQUIRED") });
  }
}

function boundedCommand(req, res, next) {
  const declared = Number(req.get("content-length") || 0);
  const actual = Buffer.byteLength(JSON.stringify(req.body || {}), "utf8");
  if (declared > MAX_COMMAND_BYTES || actual > MAX_COMMAND_BYTES) return res.status(413).json({ ok: false, error: "BLUEPRINT_DELIVERABLE_PAYLOAD_TOO_LARGE" });
  return next();
}

function failure(res, error) {
  if (error instanceof BlueprintDeliverableError) return res.status(error.status).json({ ok: false, error: error.code });
  console.error("[staffordos:blueprint-deliverables] operation failed", error?.message || String(error));
  return res.status(503).json({ ok: false, error: "BLUEPRINT_DELIVERABLE_STORAGE_UNAVAILABLE" });
}

export function installBlueprintDeliverableRoutes(app, { prisma, now } = {}) {
  const authority = createBlueprintDeliverableAuthority({ prisma, now });
  const base = "/api/staffordos/blueprint-engagements/:engagementId/deliverables";
  app.get(base, internalOnly, governedOperator, async (req, res) => {
    try { return res.status(200).json({ ok: true, ...(await authority.read({ engagementId: req.params.engagementId })) }); }
    catch (error) { return failure(res, error); }
  });
  app.post(`${base}/commands`, internalOnly, governedOperator, boundedCommand, async (req, res) => {
    try {
      return res.status(200).json({ ok: true, ...(await authority.execute({
        engagementId: req.params.engagementId,
        expectedVersion: req.body?.expectedVersion,
        command: req.body?.command,
        data: req.body?.data,
        actor: req.blueprintDeliverableActor,
      })) });
    } catch (error) { return failure(res, error); }
  });
  return { base, maxCommandBytes: MAX_COMMAND_BYTES };
}
