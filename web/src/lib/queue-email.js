import { prisma } from "../db.js";
import { renderAbandonEmail } from "./email-template.js";

/**
 * Queue an abandon-cart email for later sending
 */
export async function queueAbandonEmail({ cart, shop }) {
  const { subject, html } = renderAbandonEmail({ cart, shop });

  return prisma.emailQueue.create({
    data: {
      shopId: shop?.id,
      cartId: cart?.id,
      to: cart.userEmail,
      subject,
      html,
    },
  });
}
