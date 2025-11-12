// src/lib/api.js
// Unified API connector with auto-mock fallback for Cart-Agent frontend

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Performs a safe fetch with consistent defaults and fallback
 * @param {string} endpoint
 * @param {RequestInit} [options]
 * @param {any} [fallback]
 */
async function safeFetch(endpoint, options = {}, fallback = null) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      mode: "cors",
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`⚠️ API fallback for ${endpoint}:`, err.message);
    return { error: err.message, ...(fallback || {}) };
  }
}

/** Get abandoned carts summary */
async function fetchAbandonedCarts() {
  return safeFetch(
    "/api/abandoned-carts",
    {},
    {
      carts: [],
      total: 0,
      message: "No abandoned carts yet (mock data).",
    }
  );
}

/** Generate AI recovery copy for a cart */
async function generateRecoveryCopy(cartId, cartData = {}) {
  return safeFetch(
    "/api/generate-copy",
    {
      method: "POST",
      body: JSON.stringify({ cartId, ...cartData }),
    },
    {
      subject: "Mock Recovery Copy",
      body: "Hey! Looks like you left something in your cart. Come back for 10% off!",
      totalComputed: 42.5,
      itemsNormalized: [
        { title: "Mock Product", quantity: 1, unitPrice: 42.5 },
      ],
    }
  );
}

/** Get analytics summary (mock for now) */
async function fetchAnalytics() {
  return safeFetch("/api/analytics", {}, {
    recoveryRate: 0.0,
    sentEmails: 0,
    recoveredRevenue: 0.0,
  });
}

export const api = {
  fetchAbandonedCarts,
  generateRecoveryCopy,
  fetchAnalytics,
};

export default api;
