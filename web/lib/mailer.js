import nodemailer from "nodemailer";

export async function sendRecoveryEmail({ to, subject, text }) {
  const testAccount = await nodemailer.createTestAccount();

  const transport = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  const info = await transport.sendMail({
    from: `"Cart Agent" <noreply@example.com>`,
    to,
    subject,
    text,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`📬 Email queued: ${previewUrl || "(no preview url)"}`);
  return { messageId: info.messageId, previewUrl };
}
