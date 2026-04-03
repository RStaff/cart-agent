function env(name) {
  return String(process.env[name] || "").trim();
}

function smsRuntimeState() {
  return {
    TWILIO_ACCOUNT_SID: Boolean(env("TWILIO_ACCOUNT_SID")),
    TWILIO_AUTH_TOKEN: Boolean(env("TWILIO_AUTH_TOKEN")),
    TWILIO_FROM: Boolean(env("TWILIO_FROM") || env("TWILIO_FROM_NUMBER")),
    accountSidPrefix: env("TWILIO_ACCOUNT_SID") ? env("TWILIO_ACCOUNT_SID").slice(0, 6) : null,
  };
}

function getMissingSmsKeys() {
  const missing = [];
  if (!env("TWILIO_ACCOUNT_SID")) missing.push("TWILIO_ACCOUNT_SID");
  if (!env("TWILIO_AUTH_TOKEN")) missing.push("TWILIO_AUTH_TOKEN");
  if (!env("TWILIO_FROM") && !env("TWILIO_FROM_NUMBER")) missing.push("TWILIO_FROM|TWILIO_FROM_NUMBER");
  return missing;
}

function requireSmsConfig() {
  const missing = getMissingSmsKeys();
  if (missing.length > 0) {
    console.log("[twilio] provider missing", { missing });
    throw new Error(`TWILIO NOT CONFIGURED: missing ${missing.join(", ")}`);
  }
}

export function isSmsSenderConfigured() {
  return Boolean(
    env("TWILIO_ACCOUNT_SID") &&
    env("TWILIO_AUTH_TOKEN") &&
    (env("TWILIO_FROM") || env("TWILIO_FROM_NUMBER"))
  );
}

function buildTwilioAuthHeader() {
  const accountSid = env("TWILIO_ACCOUNT_SID");
  const authToken = env("TWILIO_AUTH_TOKEN");
  return {
    accountSid,
    authToken,
    auth: Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
  };
}

function normalizeTwilioMessage(parsed = {}) {
  if (!parsed || typeof parsed !== "object") return null;
  return {
    sid: parsed.sid || null,
    status: parsed.status || null,
    errorCode: parsed.error_code || parsed.errorCode || null,
    errorMessage: parsed.error_message || parsed.errorMessage || null,
    dateCreated: parsed.date_created || parsed.dateCreated || null,
    dateUpdated: parsed.date_updated || parsed.dateUpdated || null,
    dateSent: parsed.date_sent || parsed.dateSent || null,
    messagingServiceSid: parsed.messaging_service_sid || parsed.messagingServiceSid || null,
    accountSid: parsed.account_sid || parsed.accountSid || null,
    direction: parsed.direction || null,
    to: parsed.to || null,
    from: parsed.from || null,
    numSegments: parsed.num_segments || parsed.numSegments || null,
    uri: parsed.uri || null,
  };
}

export function interpretTwilioDeliveryStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) {
    return {
      state: "unknown",
      label: "unknown",
      explanation: "Twilio has not returned a delivery state yet.",
    };
  }
  if (normalized === "queued" || normalized === "accepted" || normalized === "scheduled") {
    return {
      state: "provider_accepted",
      label: "handed to provider",
      explanation: "Twilio accepted the message, but handset delivery is not confirmed.",
    };
  }
  if (normalized === "sending" || normalized === "sent") {
    return {
      state: "carrier_handoff",
      label: "sent to carrier",
      explanation: "Twilio sent the message onward, but handset delivery is not confirmed.",
    };
  }
  if (normalized === "delivered") {
    return {
      state: "handset_delivered",
      label: "delivered to handset",
      explanation: "Twilio reports delivery to the handset.",
    };
  }
  if (normalized === "undelivered" || normalized === "failed" || normalized === "canceled") {
    return {
      state: "delivery_failed",
      label: "delivery did not complete",
      explanation: "Twilio reports that delivery did not complete.",
    };
  }
  return {
    state: normalized,
    label: normalized,
    explanation: "Twilio returned a provider status that should be interpreted carefully.",
  };
}

export async function fetchTwilioMessageStatus({ sid }) {
  const messageSid = String(sid || "").trim();
  if (!messageSid) {
    return { success: false, error: "missing_sid" };
  }

  try {
    requireSmsConfig();
    const { accountSid, auth } = buildTwilioAuthHeader();
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages/${encodeURIComponent(messageSid)}.json`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    const text = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      return {
        success: false,
        provider: "twilio",
        sid: messageSid,
        httpStatus: response.status,
        error: parsed?.message || parsed?.detail || text || `twilio_status_failed:${response.status}`,
        errorCode: parsed?.code || null,
        moreInfo: parsed?.more_info || null,
      };
    }

    const message = normalizeTwilioMessage(parsed);
    return {
      success: true,
      provider: "twilio",
      sid: messageSid,
      httpStatus: response.status,
      message,
      interpretation: interpretTwilioDeliveryStatus(message?.status),
    };
  } catch (error) {
    return {
      success: false,
      provider: "twilio",
      sid: messageSid,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function sendRecoverySMS({ to, message }) {
  const recipient = String(to || "").trim();
  if (!recipient) {
    return { success: false, reason: "missing_sms_recipient" };
  }

  const accountSid = env("TWILIO_ACCOUNT_SID");
  const from = env("TWILIO_FROM") || env("TWILIO_FROM_NUMBER");

  try {
    requireSmsConfig();
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
    const { auth } = buildTwilioAuthHeader();
    const payload = new URLSearchParams({
      To: recipient,
      From: from,
      Body: String(message || "").trim(),
    });
    console.log("[sms-send] attempting send", {
      to: recipient,
      runtime: smsRuntimeState(),
    });
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
      console.log("[sms-send] send failed", {
        to: recipient,
        runtime: smsRuntimeState(),
        status: response.status,
        error: String(errorMessage),
        code: parsed?.code || null,
        moreInfo: parsed?.more_info || null,
      });
      return {
        success: false,
        error: String(errorMessage),
        provider: "twilio",
        twilioMessage: normalizeTwilioMessage(parsed),
        details: `status=${response.status} code=${parsed?.code || "unknown"} more_info=${parsed?.more_info || "none"}`,
      };
    }

    const twilioMessage = normalizeTwilioMessage(parsed);
    console.log("[sms-send] send success", {
      to: recipient,
      runtime: smsRuntimeState(),
      sid: twilioMessage?.sid || null,
      status: twilioMessage?.status || null,
      errorCode: twilioMessage?.errorCode || null,
      messagingServiceSid: twilioMessage?.messagingServiceSid || null,
    });
    return {
      success: true,
      sid: twilioMessage?.sid || null,
      provider: "twilio",
      status: twilioMessage?.status || null,
      twilioMessage,
      interpretation: interpretTwilioDeliveryStatus(twilioMessage?.status),
      details: `status=${twilioMessage?.status || "queued"}`,
    };
  } catch (error) {
    console.log("[sms-send] send failed", {
      to: recipient,
      runtime: smsRuntimeState(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        code: error.code || null,
        cause: error.cause || null,
      } : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      provider: "twilio",
      details: error instanceof Error
        ? `code=${error.code || "unknown"}`
        : String(error),
    };
  }
}

export { sendRecoverySMS as sendRecoverySms };
