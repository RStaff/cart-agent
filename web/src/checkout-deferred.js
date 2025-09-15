/**
 * Deferred public checkout mount
 * - Waits until helpers exist, then mounts POST /__public-checkout exactly once
 * - Adds GET /__public-checkout/_debug to show mount + env flags
 */
module.exports = function deferredMount(app, express, getHelpers) {
  if (!app.locals) app.locals = {};
  if (app.locals.__publicCheckoutMounted) {
    return; // already mounted by us
  }

  // Debug/probe — always safe to expose as read-only info
  app.get('/__public-checkout/_debug', (req, res) => {
    const h = getHelpers();
    const hasHelpers = !!(h && h.mapPlanSafe && h.checkoutDryRun && h.checkoutPublic && h.ensureResponse && h.checkoutError);
    const stack = (app._router && app._router.stack || []).map(l => {
      if (l.route && l.route.path) {
        return { path: l.route.path, methods: l.route.methods };
      }
      return null;
    }).filter(Boolean);
    const route = stack.find(r => r.path === '/__public-checkout');
    res.json({
      ok: true,
      mounted: !!app.locals.__publicCheckoutMounted || !!route,
      helpersReady: hasHelpers,
      env: {
        CHECKOUT_FORCE_JSON: process.env.CHECKOUT_FORCE_JSON || null
      },
      route
    });
  });

  // Guard (POST only) — register early; harmless if POST mounts later
  app.all('/__public-checkout', (req, res, next) => {
    if (req.method !== 'POST') {
      res.set('Allow', 'POST');
      return res.status(405).json({ ok:false, code:'method_not_allowed', route:'/__public-checkout' });
    }
    return next();
  });

  let tries = 0;
  const MAX_TRIES = 100; // ~5s at 50ms
  const iv = setInterval(() => {
    tries++;
    const h = getHelpers();
    if (h && h.mapPlanSafe && h.checkoutDryRun && h.checkoutPublic && h.ensureResponse && h.checkoutError) {
      if (!app.locals.__publicCheckoutMounted) {
        app.post(
          '/__public-checkout',
          express.json(),
          h.mapPlanSafe,
          (req, res, next) => {
            if (process.env.CHECKOUT_FORCE_JSON === '1') return h.checkoutDryRun(req, res);
            return h.checkoutPublic(req, res, next);
          },
          h.ensureResponse,
          h.checkoutError
        );
        app.locals.__publicCheckoutMounted = true;
        console.log('[checkout] public POST mounted (deferred)');
      }
      clearInterval(iv);
    } else if (tries >= MAX_TRIES) {
      clearInterval(iv);
      console.error('[checkout] deferred mount timed out — helpers never became ready');
    }
  }, 50);
};
