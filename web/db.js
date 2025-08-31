// db.js — data helpers for your API/server
import { prisma } from './lib/prisma.js';

/**
 * Normalize cart line items into a consistent structure.
 * Input items may contain { title/name, quantity, unitPrice/price }
 * Output: [{ title, quantity, unitPrice, subtotal }]
 */
export function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((it = {}) => {
      const title = String(it.title ?? it.name ?? '').trim();
      const quantity = Number(it.quantity ?? 1);
      const unitPrice = it.unitPrice ?? it.price ?? null;
      const up = unitPrice == null ? null : Number(unitPrice);
      const subtotal =
        up != null && !Number.isNaN(up)
          ? Number((up * quantity).toFixed(2))
          : null;
      return { title, quantity, unitPrice: up, subtotal };
    })
    .filter(row => row.title.length > 0);
}

/**
 * Save or update an abandoned cart.
 * Adjust field names if your Prisma schema differs.
 */
export async function saveAbandonedCart({
  cartId,
  shopDomain,
  customerEmail = null,
  items = [],
  total = null,
}) {
  const itemsNorm = normalizeItems(items);

  const computedTotal =
    total != null
      ? Number(total)
      : itemsNorm.every(x => x.subtotal != null)
      ? Number(itemsNorm.reduce((s, x) => s + x.subtotal, 0).toFixed(2))
      : null;

  return prisma.abandonedCart.upsert({
    where: { cartId },
    update: {
      shopDomain,
      customerEmail,
      itemsJson: itemsNorm,
      total: computedTotal,
    },
    create: {
      cartId,
      shopDomain,
      customerEmail,
      itemsJson: itemsNorm,
      total: computedTotal,
    },
  });
}

/**
 * Log a generated copy variant for a cart (subject lines, SMS text, etc.).
 */
export async function logGeneratedCopy({ cartId, variant, text }) {
  if (!cartId || !text) return null;
  return prisma.generatedCopy.create({
    data: { cartId, variant: variant ?? 'default', text },
  });
}

export { prisma }; // optional re-export
