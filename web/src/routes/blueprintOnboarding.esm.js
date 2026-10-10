import { internalOnly } from "../middleware/internalOnly.js";
import { requireOperatorReviewContext } from "../lib/automationInquiryReview.js";
import {
  BlueprintOnboardingError,
  createBlueprintOnboardingAuthority,
} from "../lib/blueprintOnboardingAuthority.js";

const MAX_COMMAND_BYTES = 64 * 1024;

function governedOperator(req, res, next) {
  try {
    req.blueprintOnboardingActor = requireOperatorReviewContext(req);
    return next();
  } catch (error) {
    return res.status(403).json({ ok: false, error: String(error?.code || "OPERATOR_AUTHORIZATION_REQUIRED") });
  }
}

function boundedCommand(req, res, next) {
  const declared = Number(req.get("content-length") || 0);
  const actual = Buffer.byteLength(JSON.stringify(req.body || {}), "utf8");
  if (declared > MAX_COMMAND_BYTES || actual > MAX_COMMAND_BYTES) {
    return res.status(413).json({ ok: false, error: "BLUEPRINT_ONBOARDING_PAYLOAD_TOO_LARGE" });
  }
  return next();
}

function failure(res, error) {
  if (error instanceof BlueprintOnboardingError) {
    return res.status(error.status).json({ ok: false, error: error.code });
  }
  console.error("[staffordos:blueprint-onboarding] operation failed", error?.message || String(error));
  return res.status(503).json({ ok: false, error: "BLUEPRINT_ONBOARDING_STORAGE_UNAVAILABLE" });
}

export function installBlueprintOnboardingRoutes(app, {
  prisma,
  now,
  approvedClosures,
  verifyClientAssociation,
} = {}) {
  const authority = createBlueprintOnboardingAuthority({ prisma, now, approvedClosures, verifyClientAssociation });
  const collectionPath = "/api/staffordos/blueprint-engagements";
  const path = "/api/staffordos/blueprint-engagements/:engagementId/onboarding";

  app.get(collectionPath, internalOnly, governedOperator, async (_req, res) => {
    try {
      return res.status(200).json({ ok: true, ...(await authority.list()) });
    } catch (error) {
      return failure(res, error);
    }
  });

  app.get(path, internalOnly, governedOperator, async (req, res) => {
    try {
      return res.status(200).json({ ok: true, ...(await authority.read({ engagementId: req.params.engagementId })) });
    } catch (error) {
      return failure(res, error);
    }
  });

  app.post(`${path}/commands`, internalOnly, governedOperator, boundedCommand, async (req, res) => {
    try {
      const result = await authority.execute({
        engagementId: req.params.engagementId,
        expectedVersion: req.body?.expectedVersion,
        command: req.body?.command,
        data: req.body?.data,
        actor: req.blueprintOnboardingActor,
      });
      return res.status(200).json({ ok: true, ...result });
    } catch (error) {
      return failure(res, error);
    }
  });

  return { collectionPath, path, maxCommandBytes: MAX_COMMAND_BYTES };
}
