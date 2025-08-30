import { PrismaClient } from '@prisma/client';

// Reuse in dev to avoid "Too many Prisma clients" while nodemon restarts
export const prisma = globalThis.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma;

export function normalizeItems(items) {
  const list = Array.isArray(items)
    ? items
    : (typeof items === 'string'
        ? items.split(/\n+/).map(t=>t.trim()).filter(Boolean)
        : []);
  return list.map((it,i) => {
    if (typeof it === 'string') return { title: it, quantity: 1, unitPrice: 0 };
    const title = it?.title ? String(it.title) : `Item ${i+1}`;
    const quantity = Number(it?.quantity ?? 1) || 1;
    const unitPrice = Number(it?.unitPrice ?? 0) || 0;
    return { title, quantity, unitPrice };
  });
}

export async function saveAbandonedCart({ checkoutId, email, lineItems, totalPrice }) {
  const normalized = normalizeItems(lineItems);
  const computed = normalized.reduce((s,{quantity,unitPrice}) => s + quantity*unitPrice, 0);
  const finalTotal = computed > 0 ? computed : Number(totalPrice||0);
  const cart = await prisma.abandonedCart.upsert({
    where: { checkoutId: String(checkoutId || 'NONE') },
    update: {
      email: email || null,
      total: finalTotal ? String(finalTotal.toFixed(2)) : null,
      items: {
        deleteMany: {},
        create: normalized.map(({title,quantity,unitPrice}) => ({
          title,
          quantity,
          unitPrice: String(Number(unitPrice||0).toFixed(2)),
        })),
      },
    },
    create: {
      checkoutId: String(checkoutId || 'NONE'),
      email: email || null,
      total: finalTotal ? String(finalTotal.toFixed(2)) : null,
      items: {
        create: normalized.map(({title,quantity,unitPrice}) => ({
          title,
          quantity,
          unitPrice: String(Number(unitPrice||0).toFixed(2)),
        })),
      },
    },
  });
  return { cart, normalized, finalTotal };
}

export async function logGeneratedCopy({ checkoutId, subject, body, goal, tone, brand, total }) {
  return prisma.generatedCopy.create({
    data: {
      provider: 'local',
      subject,
      body,
      goal,
      tone,
      brand,
      total: total ? String(Number(total).toFixed(2)) : null,
      ...(checkoutId ? { cart: { connect: { checkoutId: String(checkoutId) } } } : {}),
    },
  });
}
