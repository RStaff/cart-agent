export const PROVIDER_ID = "RESEND";

async function existingMailerSend(moduleUrl, message) {
  if (!moduleUrl?.startsWith("file:")) throw new Error("RESEND_MAILER_MODULE_URL_INVALID");
  const { sendEmail } = await import(/* webpackIgnore: true */ moduleUrl);
  return sendEmail(message);
}

export function createResendProspectProvider({ send, mailerModuleUrl } = {}) {
  const sendMessage = send || ((message) => existingMailerSend(mailerModuleUrl, message));
  return {
    async send({ to, from, subject, body, idempotencyKey }) {
      const result = await sendMessage({
        to,
        from,
        subject,
        text: body,
        idempotencyKey,
      });
      return { id: result.id };
    },
  };
}
