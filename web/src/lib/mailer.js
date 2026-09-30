import { Resend } from "resend";
const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * sendEmail({ to, subject, html, text?, from?, replyTo?, attachments?, idempotencyKey? })
 * attachments: [{ path, filename?, contentId?, content_type? }]
 */
export async function sendEmail({ to, subject, html, text, from, replyTo, attachments = [], idempotencyKey }) {
  const fromAddr = from || process.env.DEFAULT_FROM || "sales@abando.ai";

  if (!resend) {
    throw new Error("email_not_configured");
  }

  const { data, error } = await resend.emails.send({
    from: fromAddr,
    to: [to],
    subject,
    html,
    ...(text ? { text } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
    // Resend supports remote paths; use camelCase contentId
    attachments: attachments.map(a => ({
      path: a.path,
      filename: a.filename,
      contentId: a.contentId,
      content_type: a.content_type
    })),
  }, idempotencyKey ? { idempotencyKey } : undefined);
  if (error) throw new Error(String(error?.message || error));
  if (!data?.id) {
    throw new Error("email_send_missing_id");
  }
  return data;
}
