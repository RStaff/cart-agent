/**
 * ESM Public checkout inline handler (order-proof).
 * - GET/etc => 405 JSON
 * - POST handled inline so global 404 cannot eat it
 * - Uses helpers if available; otherwise returns 503 (never 404)
 */
export default function mountPublicInline(app, express, getHelpers) {
  app.all('/__public-checkout', express.json(), async (req, res) => {
    if (req.method !== 'POST') {
      res.set('Allow', 'POST');
      return res.status(405).json({ ok:false, code:'method_not_allowed', route:'/__public-checkout' });
    }

    const h = typeof getHelpers === 'function' ? getHelpers() : null;
    const have = !!(h && h.mapPlanSafe && h.checkoutDryRun && h.checkoutPublic && h.ensureResponse && h.checkoutError);

    if (!have) {
      return res.status(503).json({
        ok: false,
        code: 'public_checkout_not_ready',
        hint: 'Helpers not initialized yet; retry shortly'
      });
    }

    try {
      await new Promise((resolve, reject) => h.mapPlanSafe(req, res, (err)=>err?reject(err):resolve()));

      if (process.env.CHECKOUT_FORCE_JSON === '1') {
        return h.checkoutDryRun(req, res);
      }

      let responded = false;
      const _json = res.json.bind(res);
      res.json = (x) => { responded = true; return _json(x); };

      await new Promise((resolve, reject) => h.checkoutPublic(req, res, (err)=>err?reject(err):resolve()));

      if (!responded) {
        return res.status(200).json({ ok:false, code:'checkout_no_response' });
      }
    } catch (err) {
      try { return h.checkoutError(err, req, res, () => {}); }
      catch { return res.status(500).json({ ok:false, code:'checkout_error', message: String(err && err.message || err) }); }
    }
  });

  console.log('[checkout] ESM inline handler active for /__public-checkout');
}
