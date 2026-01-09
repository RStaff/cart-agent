import { PrismaClient } from "@prisma/client";
const prisma = globalThis.__prisma ?? new PrismaClient();
if (!globalThis.__prisma) globalThis.__prisma = prisma;

/**
 * Dev-only auth shim.
 * Requires Authorization: Bearer <DEV_AUTH_TOKEN>.
 * Picks email from body.email (POST) or ?email=<...> (GET), defaults to dev@example.com.
 * Ensures a User row exists and sets req.user = {id,email}.
 */
export async function devAuth(req, res, next) {
  try {
    const required = process.env.DEV_AUTH_TOKEN;
    if (!required) return next();                       // disabled if not set
    const hdr = req.headers.authorization || "";
    if (!hdr.startsWith("Bearer ")) return next();      // no dev token => ignore
    const token = hdr.slice(7).trim();
    if (token !== required) return res.status(401).json({ error: "bad_dev_token" });

    const email = (req.body && req.body.email) || req.query.email || "dev@example.com";
    if (!email) return res.status(400).json({ error: "missing_email" });

    let u = await prisma.user.findUnique({ where: { email } });
    if (!u) u = await prisma.user.create({ data: { email } });
    req.user = { id: u.id, email: u.email };
    return next();
  } catch (e) {
    console.error("[devAuth] error", e);
    return res.status(500).json({ error: "dev_auth_error" });
  }
}
