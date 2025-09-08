import { prisma } from "./db.js";
import { sendEmail } from "./mailer.js";
import { renderAbandonedEmail } from "./renderAbandonedEmail.js";

/**
 * Queue an abandoned cart email.
 * Expects cart: { id, shopId, userEmail, items: [...], resumeUrl? }
 * Stores a row in the email queue; your worker will send it.
 */
export async function queueAbandonedEmail(cart) {
  const html = renderAbandonedEmail({
    items: Array.isArray(cart?.items) ? cart.items : [],
    resumeUrl: cart?.resumeUrl || "#",
  });

  // simple, safe default subject
  const subject = "You left something in your cart 🛒";

  return prisma.email.create({
    data: {
      shopId: cart.shopId,
      cartId: cart.id,
      to: cart.userEmail,
      subject,
      html,
      status: "queued",
      runAt: new Date(),
    },
  });
}
