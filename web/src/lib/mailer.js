import { Resend } from "resend";
const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * sendEmail({ to, subject, html, from?, attachments? })
 * attachments: [{ path, filename?, contentId?, content_type? }]
 */
export async function sendEmail({ to, subject, html, from, attachments = [] }) {
  const fromAddr = from || process.env.DEFAULT_FROM || "sales@example.com";

  if (!resend) {
    console.log("=== FAKE SENT ===");
    console.log("From:", fromAddr);
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("HTML:", html);
    if (attachments?.length) {
      console.log("Attachments:", attachments);
    }
    console.log("=================\n");
    return { id: "fake-" + Date.now() };
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
  return data;
}
