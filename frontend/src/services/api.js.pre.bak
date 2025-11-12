export const API_BASE = import.meta.env.VITE_API_BASE;

function normalizeCopyPayload(d = {}) {
  return {
    subject: d.subject ?? d.title ?? d.message ?? '',
    total: Number(d.totalComputed ?? d.computedTotal ?? d.total ?? 0),
    items: Array.isArray(d.items) ? d.items
         : Array.isArray(d.lineItems) ? d.lineItems
         : [],
  };
}

export async function generateDemoCopy() {
  const res = await fetch(`${API_BASE}/api/generate-copy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cartId: 'demo-cart',
      items: [
        { title: 'Cart-Agent Tee', quantity: 1, unitPrice: 24.0 },
        { title: 'Wolf Sticker',   quantity: 2, unitPrice: 2.25 },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }

  const data = await res.json().catch(() => ({}));
  return normalizeCopyPayload(data);
}
