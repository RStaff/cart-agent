const { installSmcAlign } = require("./smc-align");
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import pino from 'pino';

// ---------- config ----------
const cfg = {
  port: Number(process.env.PORT || 3000),
  env: process.env.NODE_ENV || 'development',
  stripeSecret: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  paymentLink: process.env.STRIPE_PAYMENT_LINK || '' // e.g. https://buy.stripe.com/test_...
};

// ---------- logger ----------
const log = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
});

// ---------- app ----------
const app = express();

// Stafford ↔ Abando alignment
installSmcAlign(app);
app.set('trust proxy', 1);

// security & basics
app.use(helmet({
  crossOriginEmbedderPolicy: false, // friendlier in dev
}));
app.use(morgan('tiny'));

// global rate limit (burst-friendly)
app.use(rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

// JSON body for normal APIs
app.use('/api', express.json());

// ---------- health ----------
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/ready', (_req, res) => {
  // add deeper checks if you need (DB, third-parties, etc)
  res.json({ ready: true });
});

// ---------- demo ----------

app.get('/', (_req, res) => {
  res.type('html').send(`
<!doctype html>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Cart Agent – Local</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
  body{font-family: -apple-system,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;display:grid;place-items:center;height:100vh;background:#0f172a;color:#e2e8f0}
  .card{background:#0b1220; border:1px solid #1e293b; padding:32px; border-radius:12px; max-width:560px; text-align:center; box-shadow:0 8px 24px rgba(0,0,0,.35)}
  h1{margin:0 0 8px;font-size:28px;font-weight:700}
  p{margin:0 0 16px;color:#94a3b8}
  a.btn{display:inline-block;padding:12px 18px;border-radius:8px;text-decoration:none;background:#3b82f6;color:white;font-weight:700}
  small{color:#64748b}
</style>
<div class="card">
  <h1>Cart Agent</h1>
  <p>AI-powered cart recovery & personalization</p>
  <p><a class="btn" href="/api/start-trial">Start Free Trial</a></p>
  <small>Local demo – redirects to Stripe test checkout</small>
</div>`);
});

app.get('/api/demo', (_req, res) => {
  res.json({ message: 'Cart Agent API alive', env: cfg.env });
});

// ---------- start free trial (redirect to Payment Link) ----------
app.get('/api/start-trial', (req, res) => {
  if (!cfg.paymentLink) {
    return res.status(503).json({ error: 'Payment link not configured' });
  }
  // Optional: pass tracking params
  const url = new URL(cfg.paymentLink);
  if (req.query.s) url.searchParams.set('s', String(req.query.s));
  return res.redirect(302, url.toString());
});

// ---------- Stripe webhook ----------
let stripe = null;
if (cfg.stripeSecret) {
  stripe = new Stripe(cfg.stripeSecret);
}

// Use raw body ONLY for this route
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  let event = null;

  try {
    if (cfg.stripeWebhookSecret && stripe) {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, sig, cfg.stripeWebhookSecret);
    } else {
      // dev mode fallback if you haven't set a webhook secret yet
      event = JSON.parse(req.body.toString('utf8'));
    }
  } catch (err) {
    log.error({ err }, 'Stripe webhook signature verification failed');
    return res.sendStatus(400);
  }

  try {
    // Handle important events here
    switch (event.type) {
      case 'checkout.session.completed':
        log.info({ id: event.id }, 'Checkout completed');
        break;
      case 'invoice.paid':
        log.info({ id: event.id }, 'Invoice paid');
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        log.info({ id: event.id, type: event.type }, 'Subscription lifecycle');
        break;
      default:
        log.debug({ type: event.type }, 'Unhandled Stripe event');
    }
    res.sendStatus(200);
  } catch (err) {
    log.error({ err }, 'Error processing Stripe webhook');
    res.sendStatus(500);
  }
});

// ---------- start ----------
const server = app.listen(cfg.port, () => {
  log.info({ port: cfg.port, env: cfg.env }, '✅ Server listening');
});

// graceful shutdown
const stop = () => {
  log.info('Shutting down...');
  server.close(() => {
    log.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    log.error('Force exit after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGINT',  stop);
process.on('SIGTERM', stop);
