const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

async function safeFetch(path, options = {}, mock = null) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (err) {
    if (mock !== null) return mock;
    throw err;
  }
}

export function generateCopy(cartId, cartData = {}) {
  return safeFetch(
    "/api/generate-copy",
    { method: "POST", body: JSON.stringify({ cartId, ...cartData }) },
    {
      subject: "Mock Recovery Copy",
      body: "Hey! Looks like you left something in your cart. Come back for 10% off!",
      totalComputed: 42.5,
      itemsNormalized: [{ title: "Mock Product", quantity: 1, unitPrice: 42.5 }],
    }
  );
}

export function fetchAnalytics() {
  return safeFetch(
    "/api/analytics",
    {},
    { recoveryRate: 8.5, sentEmails: 5, recoveredRevenue: 8.4 }
  );
}
