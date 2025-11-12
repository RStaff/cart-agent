const express = require('express');
const cors = require('cors');

const app = express();

// CORS: allow specific origin (Render dashboard: set ALLOWED_ORIGIN to your Vercel URL)
// Fallback to * during bring-up (OK for now; tighten later)
const allowed = process.env.ALLOWED_ORIGIN;
app.use(cors({
  origin: allowed ? [allowed] : '*',
  credentials: false,
}));
app.use(express.json());

// Health endpoints for Render
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));
app.get('/healthz', (_req, res) => res.sendStatus(200));

// Demo generate-copy endpoint
app.post('/api/generate-copy', (req, res) => {
  try {
    const { cartId = 'demo', items = [] } = req.body || {};
    const total = items.reduce((sum, it) => sum + (Number(it.unitPrice || 0) * Number(it.quantity || 0)), 0);
    const subject = `We saved your cart ${cartId} — ${items[0]?.title || 'your items'} are waiting`;
    res.json({
      ok: true,
      subject,
      totalComputed: Number(total.toFixed(2)),
      lines: items.map(i => `${i.quantity} × ${i.title} @ ${i.unitPrice}`),
    });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e) });
  }
});

// IMPORTANT: bind to Render's port
const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
