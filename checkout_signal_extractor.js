function normalizeStoreUrl(storeDomain) {
  const raw = String(storeDomain || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

export async function extractCheckoutSignals(storeDomain) {
  const url = normalizeStoreUrl(storeDomain);
  const fallback = {
    free_shipping_threshold_visible: false,
    guest_checkout_required: false,
    shipping_cost_hidden: false,
    guest_checkout_allowed: true,
    shipping_price_shown_before_checkout: true,
    shipping_context_detected: false,
    checkout_context_detected: false,
    primary_cta_detected: false,
    trust_context_detected: false,
    nav_density: 0,
    signal_quality: "insufficient",
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
      console.error(`[checkout-signal-extractor] fetch failed for ${url}: ${response.status}`);
      return {
        ...fallback,
        fetch_status: `http_${response.status}`,
      };
    }

    const html = (await response.text()).toLowerCase();

    const freeShippingPatterns = [
      "free shipping",
      "free shipping over",
      "free shipping on orders",
    ];

    const guestCheckoutRequiredPatterns = [
      "create account to checkout",
    ];

    const shippingPriceIndicatorPatterns = [
      "shipping calculated at checkout",
      "calculated at checkout",
      "delivery calculated",
      "shipping & returns",
    ];
    const shippingContextPatterns = [
      "shipping",
      "delivery",
      "returns",
      "free shipping",
      "ship",
    ];
    const checkoutContextPatterns = [
      "checkout",
      "cart",
      "add to cart",
      "bag",
      "shop pay",
      "apple pay",
    ];
    const primaryCtaPatterns = [
      "add to cart",
      "shop now",
      "buy now",
      "checkout",
      "view product",
    ];
    const trustContextPatterns = [
      "reviews",
      "returns",
      "guarantee",
      "secure checkout",
      "customer service",
      "support",
    ];

    const freeShippingThresholdVisible = includesAny(html, freeShippingPatterns);
    const guestCheckoutRequired = includesAny(html, guestCheckoutRequiredPatterns);
    const shippingPriceShownBeforeCheckout = includesAny(html, shippingPriceIndicatorPatterns);
    const shippingContextDetected = includesAny(html, shippingContextPatterns);
    const checkoutContextDetected = includesAny(html, checkoutContextPatterns);
    const primaryCtaDetected = includesAny(html, primaryCtaPatterns);
    const trustContextDetected = includesAny(html, trustContextPatterns);
    const navDensity = countMatches(html, /<a\b/g);
    const evidenceCount = [
      freeShippingThresholdVisible,
      shippingPriceShownBeforeCheckout,
      shippingContextDetected,
      checkoutContextDetected,
      primaryCtaDetected,
      trustContextDetected,
    ].filter(Boolean).length;
    const shippingCostHidden =
      shippingContextDetected &&
      checkoutContextDetected &&
      !freeShippingThresholdVisible &&
      !shippingPriceShownBeforeCheckout;

    return {
      free_shipping_threshold_visible: freeShippingThresholdVisible,
      guest_checkout_required: guestCheckoutRequired,
      shipping_cost_hidden: shippingCostHidden,
      guest_checkout_allowed: !guestCheckoutRequired,
      shipping_price_shown_before_checkout: shippingPriceShownBeforeCheckout,
      shipping_context_detected: shippingContextDetected,
      checkout_context_detected: checkoutContextDetected,
      primary_cta_detected: primaryCtaDetected,
      trust_context_detected: trustContextDetected,
      nav_density: navDensity,
      signal_quality: evidenceCount >= 3 ? "medium" : evidenceCount >= 1 ? "low" : "insufficient",
      fetch_status: "ok",
    };
  } catch (error) {
    console.error(`[checkout-signal-extractor] request failed for ${url}:`, error);
    return fallback;
  }
}
