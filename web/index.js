import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type'] }));

// health first (Render checks this)
app.get('/health', (_req, res) => res.status(200).send('ok'));

// --- your new route(s) GO HERE ---
app.post('/api/generate-copy', async (req, res) => {
  try {
    const { items = [], tone = 'Friendly', brand = 'Default', goal = 'recover', total = 0 } = req.body || {};
    const subject = goal === 'upsell'
      ? 'A little something extra for your cart'
      : 'You left something behind 🛒';
    const lines = Array.isArray(items) ? items.join(', ') : String(items || '');
    const body = `Hi there,

We saved your cart${total ? ` (total $${Number(total).toFixed(2)})` : ''}.
Items: ${lines || 'n/a'}.

Tone: ${tone} | Brand: ${brand} | Goal: ${goal}

Finish checkout here: {{checkout_url}}

Thanks!`;
    res.json({ subject, body, provider: 'local' });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// metrics
app.get('/api/metrics', (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// --- catch-all 404 MUST BE LAST ---
app.use((req, res) => {
  res.status(404).json({ error: 'not_found', path: req.path, method: req.method });
});

// boot
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[boot] listening on ${PORT}`));

export default app;

