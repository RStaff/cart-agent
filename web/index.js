// index.js — minimal, no duplicate normalizeItems
import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';
// NOTE: don't import normalizeItems to avoid collision
import { saveAbandonedCart, logGeneratedCopy } from './db.js';

function computeTotalFromLineItems(items) {
  try {
    if (!Array.isArray(items)) return null;
    let anyUnit = false;
    const total = items.reduce((sum, it) => {
      const qty = Number(it.quantity || 1);
      const up = (it.unitPrice == null) ? null : Number(it.unitPrice);
      if (up != null && !Number.isNaN(up)) {
        anyUnit = true;
        return sum + qty * up;
      }
      return sum;
    }, 0);
    return anyUnit ? Number(total.toFixed(2)) : null;
  } catch {
    return null;
  }
}

const app = express();
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type'] }));

// request logging
app.use((req, res, next) => {
  const t = Date.now();
  res.on('finish', () => {
    const pth = req.path || req.originalUrl || '';
    if (!['/', '/health', '/healthz'].includes(pth)) {
      console.log(`[req] ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${Date.now() - t}ms`);
    }
  });
  next();
});

// health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// root
app.get('/', (_req, res) => {
  res.json({ message: 'Server running with Prisma + Express!' });
});

export { prisma, app };
// --- start the server ---
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

