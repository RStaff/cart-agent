import { prisma } from "../db.js";
import { sendEmail } from "./mailer.js";

async function processEmails() {
  const batch = await prisma.emailQueue.findMany({
    where: { status: "queued", runAt: { lte: new Date() } },
    orderBy: { runAt: "asc" },
    take: 5,
  });

  if (batch.length === 0) {
    console.log("[send-worker] nothing to send");
    return;
  }

  for (const email of batch) {
    try {
      await sendEmail({
        to: email.to,
        subject: email.subject,
        html: email.html,
        from: process.env.DEFAULT_FROM, // optional override
      });

      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          attempts: { increment: 1 },
        },
      });
    } catch (err) {
      console.error("[send-worker] fail", email.id, err);
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: "failed",
          attempts: { increment: 1 },
          error: String(err?.message || err),
        },
      });
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
