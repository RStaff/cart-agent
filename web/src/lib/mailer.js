import { Resend } from "resend";
const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * sendEmail({ to, subject, html, from?, attachments? })
 * attachments: [{ path, filename?, contentId?, content_type? }]
 */
export async function sendEmail({ to, subject, html, from, attachments = [] }) {
  const fromAddr = from || process.env.DEFAULT_FROM || "sales@abando.ai";

  if (!resend) {
    throw new Error("email_not_configured");
  }

  const { data, error } = await resend.emails.send({
    from: fromAddr,
    to: [to],
    subject,
    html,
    // Resend supports remote paths; use camelCase contentId
    attachments: attachments.map(a => ({
      path: a.path,
      filename: a.filename,
      contentId: a.contentId,
      content_type: a.content_type
    })),
  });
  if (error) throw new Error(String(error?.message || error));
  if (!data?.id) {
    throw new Error("email_send_missing_id");
  }
  return data;
}
