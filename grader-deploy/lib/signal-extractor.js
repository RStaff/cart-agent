function normalizeStoreUrl(storeDomain) {
  const raw = String(storeDomain || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

export async function extractCheckoutSignals(storeDomain) {
  const url = normalizeStoreUrl(storeDomain);
  const fallback = {
    free_shipping_threshold_visible: false,
    guest_checkout_required: false,
    shipping_cost_hidden: false,
    guest_checkout_allowed: true,
    shipping_price_shown_before_checkout: true,
    fetch_status: "failed",
  };

  if (!url) {
    return fallback;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "AbandoCheckoutSignalExtractor/1.0",
      },
    });

    if (!response.ok) {
      console.error(`[grader-deploy-signal-extractor] fetch failed for ${url}: ${response.status}`);
      return {
        ...fallback,
        fetch_status: `http_${response.status}`,
      };
    }

    const html = (await response.text()).toLowerCase();
    const freeShippingThresholdVisible = includesAny(html, [
      "free shipping",
      "free shipping over",
      "free shipping on orders",
    ]);
    const guestCheckoutRequired = includesAny(html, [
      "create account to checkout",
    ]);
    const shippingPriceShownBeforeCheckout = includesAny(html, [
      "shipping calculated at checkout",
    ]);

    return {
      free_shipping_threshold_visible: freeShippingThresholdVisible,
      guest_checkout_required: guestCheckoutRequired,
      shipping_cost_hidden: !shippingPriceShownBeforeCheckout,
      guest_checkout_allowed: !guestCheckoutRequired,
      shipping_price_shown_before_checkout: shippingPriceShownBeforeCheckout,
      fetch_status: "ok",
    };
  } catch (error) {
    console.error(`[grader-deploy-signal-extractor] request failed for ${url}:`, error);
    return fallback;
  }
}
