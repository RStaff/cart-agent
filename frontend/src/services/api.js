const BASE = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');

const demoItems = [
  { title: 'Cart-Agent Tee', quantity: 1, unitPrice: 24.0 },
  { title: 'Wolf Sticker',   quantity: 2, unitPrice: 2.25 },
];

function normalizeCopyPayload(raw, fallbackItems = demoItems) {
  const subject =
    (raw && raw.subject) ||
    'We saved your cart demo-cart — your items are waiting';

  const items = Array.isArray(raw?.items) && raw.items.length
    ? raw.items
    : fallbackItems;

  const total =
    Number.isFinite(raw?.total) ? raw.total
    : Number.isFinite(raw?.totalComputed) ? raw.totalComputed
    : items.reduce(
        (sum, it) => sum + (Number(it.unitPrice ?? it.price ?? 0) * Number(it.quantity ?? 1)),
        0
      );

  return { subject, total, items };
}

export async function generateDemoCopy() {
  const url = `${BASE}/api/generate-copy`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId: 'demo-cart', items: demoItems }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json().catch(() => ({}));
    return normalizeCopyPayload(data, demoItems);
  } catch {
    // Fallback demo if API unreachable
    return normalizeCopyPayload({}, demoItems);
  }
}

export async function fetchAnalytics() {
  const url = `${BASE}/api/analytics`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json().catch(() => ({}));
    return {
      recoveryRate: Number(data.recoveryRate ?? 8.5),
      emailsSent: Number(data.emailsSent ?? 5),
      recoveredRevenue: Number(data.recoveredRevenue ?? 8.4),
    };
  } catch {
    // Safe mock so Dashboard still renders
    return { recoveryRate: 8.5, emailsSent: 5, recoveredRevenue: 8.4 };
  }
}

export { generateDemoCopy as generateCopy };
