import express from 'express';
import cors from 'cors';

function computeTotalFromLineItems(items){
  try{
    if(!Array.isArray(items)) return null;
    let anyUnit=false;
    const total = items.reduce((sum,it)=>{
      const qty = Number(it.quantity||1);
      const up  = (it.unitPrice==null)? null : Number(it.unitPrice);
      if(up!=null && !Number.isNaN(up)){ anyUnit=true; return sum + qty*up; }
      return sum;
    },0);
    return anyUnit? Number(total.toFixed(2)) : null;
  }catch{return null}
}
const app = express();
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type'] }));

// health first (Render checks this)
app.get('/health', (_req, res) => res.status(200).send('ok'));

// --- your new route(s) GO HERE ---
app.post('/api/generate-copy', async (req, res) => {
  try {
    const { items = [], tone = 'Friendly', brand = 'Default', goal = 'recover', total = 0 } = req.body || {};
    const computed = computeTotalFromLineItems(items);
    const finalTotal = computed ?? Number(total||0);
    const subject = goal === 'upsell'
      ? 'A little something extra for your cart'
      : 'You left something behind 🛒';
    const lines = Array.isArray(items)
      ? items.map(it=> it.title + (it.quantity?` x${it.quantity}`:'')).join(', ')
      : String(items||'');
    const body = `Hi there,

We saved your cart${finalTotal ? ` (total $${finalTotal.toFixed(2)})` : ''}.
Items: ${lines || 'n/a'}.

Tone: ${tone} | Brand: ${brand} | Goal: ${goal}

Finish checkout here: {{checkout_url}}

Thanks!`;
    res.json({ subject, body, provider: 'local' });
  } catch (e) { (e) {
    res.status(500).json({ error: String(e) });
  }
});

// metrics
app.get('/api/metrics', (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// --- Abandoned cart endpoint ---
app.post('/api/abandoned-cart', async (req, res) => {
  try {
    const { checkoutId, email, lineItems = [], totalPrice = 0 } = req.body || {};

    if (!checkoutId || !email) {
      return res.status(400).json({ error: 'missing_fields', need: ['checkoutId','email'] });
    }

    // Try to persist (optional). If DB/env is missing, we still succeed.
    let saved = null;
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      saved = await prisma.abandonedCart.create({
        data: { checkoutId, email, lineItems, totalPrice }
      });
    } catch (e) {
      console.warn('[abandoned-cart] db_skip:', e?.message || String(e));
    }

    // (Optionally: enqueue email here later)
    return res.status(201).json({
      ok: true,
      savedId: saved?.id ?? null,
      received: { checkoutId, email, items: lineItems.length, totalPrice }
    });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

// --- catch-all 404 MUST BE LAST ---
app.use((req, res) => {
  res.status(404).json({ error: 'not_found', path: req.path, method: req.method });
});

// boot
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[boot] listening on ${PORT}`));

export default app;

