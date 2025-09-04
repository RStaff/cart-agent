import { prisma } from "../db.js";
import { renderAbandonEmail } from "./email-template.js";

export async function queueAbandonEmail({ cart, shop }) {
  const { subject, html } = renderAbandonEmail({ cart, shop });
  return prisma.emailQueue.upsert({
    where: { cartId_status: { cartId: cart?.id ?? null, status: "queued" } },
    create: {
      shopId: shop?.id ?? null,
      cartId: cart?.id ?? null,
      to: cart.userEmail,
      subject,
      html,
      status: "queued",
      runAt: new Date(Date.now() + 30 * 60 * 1000),
    },
    update: { to: cart.userEmail, subject, html, runAt: new Date() },
  });
}
