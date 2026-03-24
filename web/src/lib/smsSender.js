function env(name) {
  return String(process.env[name] || "").trim();
}

export function isSmsSenderConfigured() {
  return Boolean(
    env("TWILIO_ACCOUNT_SID") &&
    env("TWILIO_AUTH_TOKEN") &&
    (env("TWILIO_FROM") || env("TWILIO_FROM_NUMBER"))
  );
}

export async function sendRecoverySMS({ to, message }) {
  const recipient = String(to || "").trim();
  if (!recipient) {
    return { success: false, reason: "missing_sms_recipient" };
  }

  const accountSid = env("TWILIO_ACCOUNT_SID");
  const authToken = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM") || env("TWILIO_FROM_NUMBER");

  if (!accountSid || !authToken || !from) {
    return { success: false, reason: "not_configured" };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const payload = new URLSearchParams({
    To: recipient,
    From: from,
    Body: String(message || "").trim(),
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });

    const text = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const errorMessage =
        parsed?.message ||
        parsed?.detail ||
        text ||
        `sms_send_failed:${response.status}`;
      return { success: false, error: String(errorMessage) };
    }

    return {
      success: true,
      sid: parsed?.sid || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export { sendRecoverySMS as sendRecoverySms };
