import { PrismaClient } from "@prisma/client";
import { sendEmail } from "./mailer.js";

const prisma = new PrismaClient();
const MAX_ATTEMPTS = 5;

function guessContentType(url = "") {
  const u = url.toLowerCase();
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
  if (u.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

function injectCidImgIfMissing(html, alt = "item") {
  if (!html) return html;
  if (html.includes('src="cid:cart-thumb"')) return html;
  const snippet = `<p><img src="cid:cart-thumb" alt="${alt}" style="max-width:240px;display:block;border:0"/></p>`;
  // Place after the “You left a few items” paragraph if present, else insert near top.
  return html.replace(/(<p>You left[^<]*<\/p>)/i, `$1\n${snippet}`) || (snippet + html);
}

function nextBackoffMs(attempt) {
  // 1m, 2m, 4m, 8m, 16m capped at 30m + jitter
  const base = 60_000;
  const cap  = 30 * 60_000;
  const exp  = Math.min(base * Math.pow(2, attempt), cap);
  const jitter = Math.floor(Math.random() * 0.2 * exp);
  return exp + jitter;
}

export async function processEmails() {
  const due = await prisma.emailQueue.findMany({
    where: { status: "queued", runAt: { lte: new Date() } },
    take: 20,
    orderBy: { runAt: "asc" },
  });

  if (!due.length) {
    console.log("[send-worker] nothing to send");
    return;
  }

  for (const email of due) {
    try {
      // Reuse persisted html/attachments if present
      let effectiveHtml = email.html;
      let attachments = email.attachments ?? null;

      if (!attachments || (Array.isArray(attachments) && attachments.length === 0)) {
        // Try to build a thumbnail attachment from the cart payload
        const cart = await prisma.cart.findUnique({ where: { id: email.cartId } });
        const items = Array.isArray(cart?.items) ? cart.items : [];
        const first = items[0] || null;
        const thumb = first?.image;

        if (thumb) {
          const filename = thumb.split("/").pop() || "thumb";
          attachments = [
            {
              path: thumb,
              filename,
              contentId: "cart-thumb",
              content_type: guessContentType(thumb),
            },
          ];
          const alt = first?.sku || "item";
          effectiveHtml = injectCidImgIfMissing(effectiveHtml, alt);

          // Persist for reliable requeue behavior
          await prisma.emailQueue.update({
            where: { id: email.id },
            data: { attachments, html: effectiveHtml },
          });
        }
      }

      await sendEmail({
        to: email.to,
        subject: email.subject,
        html: effectiveHtml,
        from: process.env.DEFAULT_FROM,
        attachments: attachments || undefined,
      });

      // Dedupe & mark sent
      await prisma.$transaction([
        prisma.emailQueue.deleteMany({ where: { cartId: email.cartId, status: "sent" } }),
        prisma.emailQueue.update({
          where: { id: email.id },
          data: { status: "sent", sentAt: new Date(), attempts: { increment: 1 } },
        }),
      ]);
    } catch (err) {
      console.error("[send-worker] fail", email.id, err);

      const currentAttempts = email.attempts ?? 0;
      const overLimit = currentAttempts + 1 >= MAX_ATTEMPTS;

      if (overLimit) {
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: "failed",
            attempts: { increment: 1 },
            error: String(err?.message || err),
          },
        });
      } else {
        const delay = nextBackoffMs(currentAttempts);
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: "queued",
            runAt: new Date(Date.now() + delay),
            attempts: { increment: 1 },
            error: String(err?.message || err),
          },
        });
      }
    }
  }
}

processEmails()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
