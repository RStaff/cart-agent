import { internalOnly } from "../middleware/internalOnly.js";
import { requireOperatorReviewContext } from "../lib/automationInquiryReview.js";
import { BlueprintPackageError, BLUEPRINT_PACKAGE_PERMISSION, createBlueprintPackageAuthority } from "../lib/blueprintPackageAuthority.js";

const MAX_COMMAND_BYTES = 64 * 1024;
function governedOperator(req, res, next) {
  try { req.blueprintPackageActor = requireOperatorReviewContext(req); return next(); }
  catch (error) { return res.status(403).json({ ok: false, error: String(error?.code || "OPERATOR_AUTHORIZATION_REQUIRED") }); }
}
function bounded(req, res, next) {
  const declared = Number(req.get("content-length") || 0); const actual = Buffer.byteLength(JSON.stringify(req.body || {}), "utf8");
  if (declared > MAX_COMMAND_BYTES || actual > MAX_COMMAND_BYTES) return res.status(413).json({ ok: false, error: "BLUEPRINT_PACKAGE_PAYLOAD_TOO_LARGE" }); return next();
}
function failure(res, error) {
  if (error instanceof BlueprintPackageError) return res.status(error.status).json({ ok: false, error: error.code });
  if (error?.code === "P2034") return res.status(409).json({ ok: false, error: "BLUEPRINT_PACKAGE_STALE" });
  console.error("[staffordos:blueprint-package] operation failed", error?.message || String(error));
  return res.status(503).json({ ok: false, error: "BLUEPRINT_PACKAGE_STORAGE_UNAVAILABLE" });
}
export function installBlueprintPackageRoutes(app, { prisma, now } = {}) {
  const authority = createBlueprintPackageAuthority({ prisma, now });
  const base = "/api/staffordos/blueprint-engagements/:engagementId/package";
  const read = async (req, res) => { try { return res.status(200).json({ ok: true, ...(await authority.read({ engagementId: req.params.engagementId, snapshotId: req.params.snapshotId })) }); } catch (error) { return failure(res, error); } };
  app.get(base, internalOnly, governedOperator, read);
  app.get(`${base}/:snapshotId`, internalOnly, governedOperator, read);
  app.post(`${base}/commands`, internalOnly, governedOperator, bounded, async (req, res) => { try { return res.status(200).json({ ok: true, ...(await authority.execute({ engagementId: req.params.engagementId, command: req.body?.command, data: req.body?.data, actor: req.blueprintPackageActor })) }); } catch (error) { return failure(res, error); } });
  return { base, permission: BLUEPRINT_PACKAGE_PERMISSION, maxCommandBytes: MAX_COMMAND_BYTES };
}
