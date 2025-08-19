import express from 'express';

const app = express();
app.use((req,res,next)=>{ console.log(`[req] ${req.method} ${req.url}`); next(); });
app.use(express.json({ limit: '200kb' }));

app.get('/health', (_req, res) => res.status(200).send('ok'));
app.get('/api/metrics', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

function handleAbandoned(req, res) {
  const body = req.body ?? {};
  console.log('[abandoned-cart] body:', body);
  return res.status(201).json({ received: true, method: req.method, body });
}
app.post('/api/abandoned-cart', handleAbandoned);
app.get('/api/abandoned-cart', handleAbandoned);

app.use((req,res)=>res.status(404).json({ error: 'not_found', path: req.url, method: req.method }));

const PORT = process.env.PORT || 3000;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[boot] listening on ${PORT}`));
