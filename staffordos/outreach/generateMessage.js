export function generatePaymentSuggestionMessage({ lead, checkoutUrl } = {}) {
  const url = String(checkoutUrl || "").trim();

  if (url) {
    return `This looks like a clean fit for the Shopify dev fix path.

If you want me to take it on, here’s the payment link:
${url}

Once that’s through, I’ll move straight into the fix path.`;
  }

  return `This looks like a clean fit for the Shopify dev fix path.

If you want, I can generate a fresh payment link from here and move you into the fix path.`;
}
