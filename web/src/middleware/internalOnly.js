import { createHash, timingSafeEqual } from "node:crypto";

function digestValue(value) {
  return createHash("sha256").update(String(value || ""), "utf8").digest();
}

export function internalOnly(req, res, next) {
  const configuredKey = String(process.env.INTERNAL_API_KEY || "").trim();

  if (!configuredKey) {
    return res.status(503).json({ error: "internal_api_key_not_configured" });
  }

  const providedKey = String(req.get("x-internal-api-key") || "").trim();
  const providedDigest = digestValue(providedKey);
  const configuredDigest = digestValue(configuredKey);

  if (!timingSafeEqual(providedDigest, configuredDigest)) {
    return res.status(401).json({ error: "unauthorized_internal_route" });
  }

  return next();
}
