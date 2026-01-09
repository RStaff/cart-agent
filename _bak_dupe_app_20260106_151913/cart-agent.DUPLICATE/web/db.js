// web/db.js
import { prisma } from './lib/prisma.js';

/** Normalize line items into a consistent structure */
export function normalizeItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((it = {}) => {
      const title = String(it.title ?? it.name ?? '').trim();
      const quantity = Number(it.quantity ?? 1);
      const unitPrice = it.unitPrice == null ? null : Number(it.unitPrice);
      const subtotal =
        unitPrice != null && !Number.isNaN(unitPrice)
          ? Number((unitPrice * quantity).toFixed(2))
          : null;
      return { title, quantity, unitPrice, subtotal };
    })
    .filter((r) => r.title.length > 0);
}

/** Compute total only if at least one item has a unit price */
export function computeTotalFromItems(items = []) {
  try {
    if (!Array.isArray(items)) return null;
    let anyPriced = false;
    const total = items.reduce((sum, it) => {
      const q = Number(it.quantity || 1);
      const up =
        it.unitPrice == null || Number.isNaN(Number(it.unitPrice))
          ? null
          : Number(it.unitPrice);
      if (up != null) anyPriced = true;
      return sum + (up ? q * up : 0);
    }, 0);
    return anyPriced ? Number(total.toFixed(2)) : null;
  } catch {
    return null;
  }
}

/** Persist/merge an abandoned cart for ANY platform */
export async function upsertAbandonedCart({
  cartId,
  shopDomain,
  customerEmail = null,
  items = [],
  total = null,
  channel = null, // 'email' | 'sms' | 'whatsapp' (optional hint)
  consents = {},  // { email: true, sms: false, whatsapp: true }
  metadata = {},  // any extra fields you want to keep
}) {
  if (!cartId || !shopDomain) {
    throw new Error('cartId and shopDomain are required');
  }

  const normalized = normalizeItems(items);
  const computedTotal = total ?? computeTotalFromItems(normalized);

  // upsert the cart record
  const cart = await prisma.abandonedCart.upsert({
    where: { cartId },
    create: {
      id: undefined, // prisma will generate cuid
      cartId,
      shopDomain,
      customerEmail,
      channel,
      itemsJson: normalized,
      total: computedTotal,
      status: 'pending',
      // store consents/metadata inside JSON columns you already have
      // if you later add dedicated columns, update here.
    },
    update: {
      customerEmail,
      channel,
      itemsJson: normalized,
      total: computedTotal,
      updatedAt: new Date(),
    },
    include: { items: true },
  });

  // replace item rows (keep simple & robust)
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  if (normalized.length) {
    await prisma.cartItem.createMany({
      data: normalized.map((r) => ({
        cartId: cart.id,
        title: r.title,
        quantity: r.quantity ?? 1,
        unitPrice: r.unitPrice,
      })),
    });
  }

  return cart;
}

/** Optional logging for AI copy generations */
export async function logGeneratedCopy({ cartId, variant, prompt, output, meta }) {
  return prisma.generatedCopy.create({
    data: {
      cartId: cartId ?? null,
      variant: variant ?? null,
      prompt: prompt ?? null,
      output: output ?? null,
      meta: meta ?? null,
    },
  });
}

