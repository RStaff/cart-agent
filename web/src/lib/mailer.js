import { Resend } from "resend";
const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * sendEmail({ to, subject, html, from? })
 * - If RESEND_API_KEY is present, actually send via Resend.
 * - Else, "fake send" (console.log) for local/dev.
 */
export async function sendEmail({ to, subject, html, from }) {
  const fromAddr = from || process.env.DEFAULT_FROM || "sales@example.com";

  if (!resend) {
    console.log("=== FAKE SENT ===");
    console.log("From:", fromAddr);
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("HTML:", html);
    console.log("=================\n");
    return { id: "fake-" + Date.now() };
  }

  const { data, error } = await resend.emails.send({
    from: fromAddr,
    to: [to],
    subject,
    html,
  });
  if (error) throw new Error(String(error?.message || error));
  return data;
}
