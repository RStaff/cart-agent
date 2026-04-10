function cleanText(value) {
  return String(value || "").trim();
}

function normalizeChannel(value) {
  const normalized = cleanText(value).toLowerCase();
  return normalized === "sms" ? "sms" : "email";
}

function normalizeAngle(value) {
  const normalized = cleanText(value);
  return ["complete_purchase", "return_to_cart", "simple_reminder"].includes(normalized)
    ? normalized
    : "complete_purchase";
}

function formatValue(amount, currency) {
  const numeric = Number(amount || 0);
  const normalizedCurrency = cleanText(currency) || "USD";
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${numeric} ${normalizedCurrency}`;
  }
}

function recommendAngle(row) {
  if (Number(row?.cart_value || 0) >= 100) {
    return "complete_purchase";
  }
  return "simple_reminder";
}

function buildSubject(shop, messageAngle, cartValueText, channel) {
  if (channel === "sms") {
    return "";
  }

  if (messageAngle === "return_to_cart") {
    return `Your cart is still waiting at ${shop || "the store"}`;
  }
  if (messageAngle === "simple_reminder") {
    return `A quick reminder from ${shop || "the store"}`;
  }
  return cartValueText
    ? `You can still complete your ${cartValueText} order`
    : `You can still complete your order`;
}

function buildBody({ shop, recoveryUrl, messageAngle, cartValueText, channel }) {
  if (messageAngle === "return_to_cart") {
    return channel === "sms"
      ? `You can return to your cart at ${shop || "the store"} here: ${recoveryUrl}.`
      : [
          `You can still return to your cart at ${shop || "the store"}.`,
          `Use this link when you're ready: ${recoveryUrl}.`,
          "If you still want the order, everything should be straightforward from there.",
        ].join("\n\n");
  }

  if (messageAngle === "simple_reminder") {
    return channel === "sms"
      ? `Just a quick reminder that your cart is still available here: ${recoveryUrl}.`
      : [
          "Just a quick reminder that your cart is still available.",
          `You can pick it back up here: ${recoveryUrl}.`,
          "No pressure if the timing is not right.",
        ].join("\n\n");
  }

  return channel === "sms"
    ? `${cartValueText ? `Your ${cartValueText} cart` : "Your cart"} is still available here: ${recoveryUrl}.`
    : [
        `${cartValueText ? `Your ${cartValueText} cart` : "Your cart"} is still available if you want to complete the order.`,
        `You can return here: ${recoveryUrl}.`,
        "If you were interrupted, this should take you back to the right place.",
      ].join("\n\n");
}

export function generateRecoveryMessage(row = {}) {
  const channel = normalizeChannel(row.channel);
  const shop = cleanText(row.shop);
  const recoveryUrl = cleanText(row.recovery_url);
  const messageAngle = normalizeAngle(row.message_angle || recommendAngle(row));
  const cartValueText = formatValue(row.cart_value, row.currency);

  return {
    subject: cleanText(row.subject) || buildSubject(shop, messageAngle, cartValueText, channel),
    body: cleanText(row.body) || buildBody({
      shop,
      recoveryUrl,
      messageAngle,
      cartValueText,
      channel,
    }),
    message_angle: messageAngle,
  };
}

function main() {
  const payload = JSON.parse(process.argv[2] || "{}");
  console.log(JSON.stringify(generateRecoveryMessage(payload), null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
