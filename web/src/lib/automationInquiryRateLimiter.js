import crypto from "node:crypto";

export const AUTOMATION_INQUIRY_RATE_LIMIT = 10;
export const AUTOMATION_INQUIRY_RATE_WINDOW_MS = 15 * 60 * 1000;

function digest(value, secret) {
  return crypto.createHmac("sha256", secret).update(value, "utf8").digest("base64url");
}

export function verifyAutomationVisitorToken(token, secret, now = Date.now()) {
  if (!secret || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;
  const [, id, issued, signature] = parts;
  if (!/^[A-Za-z0-9_-]{32}$/.test(id) || !/^\d+$/.test(issued)) return null;
  const issuedAt = Number(issued);
  if (!Number.isSafeInteger(issuedAt) || issuedAt > now + 60_000 || now - issuedAt > 24 * 60 * 60 * 1000) return null;
  const expected = digest(`${parts[0]}.${id}.${issued}`, secret);
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !crypto.timingSafeEqual(actual, wanted)) return null;
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function createAutomationInquiryRateLimiter({ prisma, secret, emailHashSecret, now = () => new Date() }) {
  return {
    async consume(token, email) {
      const visitorHash = verifyAutomationVisitorToken(token, secret, now().getTime());
      if (!visitorHash) throw Object.assign(new Error("INQUIRY_VISITOR_TOKEN_INVALID"), { code: "INQUIRY_VISITOR_TOKEN_INVALID" });
      const normalizedEmail = String(email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw Object.assign(new Error("INQUIRY_EMAIL_INVALID"), { code: "INQUIRY_EMAIL_INVALID" });
      if (!emailHashSecret) throw Object.assign(new Error("INQUIRY_RATE_LIMIT_KEY_UNAVAILABLE"), { code: "INQUIRY_RATE_LIMIT_KEY_UNAVAILABLE" });
      const emailHash = crypto.createHmac("sha256", emailHashSecret).update(normalizedEmail, "utf8").digest("hex");
      const current = now();
      const windowStart = new Date(Math.floor(current.getTime() / AUTOMATION_INQUIRY_RATE_WINDOW_MS) * AUTOMATION_INQUIRY_RATE_WINDOW_MS);
      const rows = await Promise.all([visitorHash, emailHash].map((scopeHash) => prisma.$queryRaw`
        INSERT INTO "StaffordosInboundAutomationRateLimit" ("scopeHash", "windowStart", "count", "updatedAt")
        VALUES (${scopeHash}, ${windowStart}, 1, ${current})
        ON CONFLICT ("scopeHash", "windowStart")
        DO UPDATE SET "count" = "StaffordosInboundAutomationRateLimit"."count" + 1, "updatedAt" = ${current}
        RETURNING "count"
      `));
      const counts = rows.map((row) => Number(row?.[0]?.count || 0));
      return { allowed: counts.every((count) => count <= AUTOMATION_INQUIRY_RATE_LIMIT), retryAfterSeconds: Math.max(1, Math.ceil((windowStart.getTime() + AUTOMATION_INQUIRY_RATE_WINDOW_MS - current.getTime()) / 1000)) };
    },
  };
}
