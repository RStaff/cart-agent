import { Resend } from "resend";
let resend = null;
let resendApiKey = "";

export function getMailerClient() {
  const configuredKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!configuredKey) return null;
  if (!resend || resendApiKey !== configuredKey) {
    resend = new Resend(configuredKey);
    resendApiKey = configuredKey;
  }
  return resend;
}

export function buildResendPayload({ to, subject, html, text, from, replyTo, attachments = [] }) {
  const fromAddr = from || process.env.DEFAULT_FROM || "sales@abando.ai";
  return {
    from: fromAddr,
    to: [to],
    subject,
    html,
    ...(text ? { text } : {}),
    ...(replyTo ? { replyTo } : {}),
    attachments: attachments.map(a => ({
      path: a.path,
      filename: a.filename,
      contentId: a.contentId,
      content_type: a.content_type
    })),
  };
}

/**
 * sendEmail({ to, subject, html, text?, from?, replyTo?, attachments?, idempotencyKey? })
 * attachments: [{ path, filename?, contentId?, content_type? }]
 */
export async function sendEmail({ to, subject, html, text, from, replyTo, attachments = [], idempotencyKey }) {
  const client = getMailerClient();
  if (!client) {
    throw new Error("email_not_configured");
  }

  const { data, error } = await client.emails.send(buildResendPayload({ to, subject, html, text, from, replyTo, attachments }), idempotencyKey ? { idempotencyKey } : undefined);
  if (error) throw new Error(String(error?.message || error));
  if (!data?.id) {
    throw new Error("email_send_missing_id");
  }
  return data;
}
