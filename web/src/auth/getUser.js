import { prisma } from "../clients/prisma.js";

export async function getOrCreateUser(req) {
  const email =
    req.headers["x-user-email"] ||
    (typeof req.query.email === "string" ? req.query.email : null);
  if (!email) return null;

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email } });
  }
  return user;
}
