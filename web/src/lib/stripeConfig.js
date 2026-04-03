function clean(value) {
  return String(value ?? "").trim();
}

export function getStripeSecretKey() {
  return (
    clean(process.env.STRIPE_SECRET_KEY) ||
    clean(process.env.STRIPE_SECRET) ||
    clean(process.env.STRIPE_API_KEY) ||
    ""
  );
}

export function getStripePriceIds() {
  return {
    starter:
      clean(process.env.STRIPE_PRICE_STARTER) ||
      clean(process.env.PRICE_STARTER) ||
      clean(process.env.STRIPE_PRICE_STARTER_LIVE) ||
      "",
    pro:
      clean(process.env.STRIPE_PRICE_PRO) ||
      clean(process.env.PRICE_PRO) ||
      clean(process.env.STRIPE_PRICE_PRO_LIVE) ||
      "",
  };
}

export function getStripeWebhookSecret() {
  return clean(process.env.STRIPE_WEBHOOK_SECRET);
}

export function getDirectPaymentUrl() {
  return (
    clean(process.env.ABANDO_PAYMENT_URL) ||
    clean(process.env.STRIPE_PAYMENT_LINK_URL) ||
    clean(process.env.ABANDO_ONBOARDING_PAYMENT_URL) ||
    ""
  );
}

export function isStripeConfigured() {
  return Boolean(getStripeSecretKey());
}

export function hasRequiredStripePriceIds() {
  const prices = getStripePriceIds();
  return Boolean(prices.starter && prices.pro);
}

export function hasCollectableBillingConfig() {
  return Boolean(isStripeConfigured() && hasRequiredStripePriceIds());
}
