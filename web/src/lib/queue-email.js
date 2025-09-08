import { prisma } from "../db.js";
import { renderAbandonEmail } from "./renderAbandonedEmail.js";

const DELAY_MS = parseInt(process.env.EMAIL_DELAY_MS || String(30 * 60 * 1000), 10); // default 30m

export async function queueAbandonEmail({ cart, shop }) {
  const { subject, html } = renderAbandonEmail({ cart, shop });
  const runAt = new Date(Date.now() + DELAY_MS);

  const cartRowId = cart?.id ?? null;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.emailQueue.findFirst({
      where: { cartId: cartRowId, status: "queued" },
      select: { id: true },
    });

    if (existing) {
      return tx.emailQueue.update({
        where: { id: existing.id },
        data: { to: cart.userEmail, subject, html, runAt },
      });
    }

    return tx.emailQueue.create({
      data: {
        shopId: shop?.id ?? null,
        cartId: cartRowId,
        to: cart.userEmail,
        subject,
        html,
        status: "queued",
        runAt,
      },
    });
  });
}
