/**
 * Public checkout inline handler.
 * - Handles GET/etc with 405 JSON.
 * - Handles POST *inline*, so we don't depend on later route order.
 * - If helpers aren't ready yet, returns a safe JSON (no 404s).
 */
module.exports = function mountPublicInline(app, express, getHelpers) {
  app.all('/__public-checkout', express.json(), async (req, res) => {
    if (req.method !== 'POST') {
      res.set('Allow', 'POST');
      return res.status(405).json({ ok:false, code:'method_not_allowed', route:'/__public-checkout' });
    }

    // POST path — handle inline
    const h = getHelpers && getHelpers();
    const have =
      h && typeof h.mapPlanSafe === 'function' &&
      typeof h.checkoutDryRun === 'function' &&
      typeof h.checkoutPublic === 'function' &&
      typeof h.ensureResponse === 'function' &&
      typeof h.checkoutError === 'function';

    // Minimal plan validation if helpers not ready
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const plan = body.plan;

    if (!have) {
      // Helpers not ready yet: respond safely to avoid 404s
      return res.status(503).json({
        ok: false,
        code: 'public_checkout_not_ready',
        hint: 'Helpers not initialized yet; try again shortly'
      });
    }

    // Run the real flow with helpers (mirrors previous behavior)
    try {
      // Validate plan
      await new Promise((resolve, reject) =>
        h.mapPlanSafe(req, res, (err) => err ? reject(err) : resolve())
      );

      if (process.env.CHECKOUT_FORCE_JSON === '1') {
        return h.checkoutDryRun(req, res);
      }

      // Delegate to your real handler
      let responded = false;
      const _json = res.json.bind(res);
      res.json = (x) => { responded = true; return _json(x); };
      await new Promise((resolve, reject) =>
        h.checkoutPublic(req, res, (err) => err ? reject(err) : resolve())
      );
      if (!responded) {
        // ensureResponse equivalent
        return res.status(200).json({ ok:false, code:'checkout_no_response' });
      }
    } catch (err) {
      try { return h.checkoutError(err, req, res, () => {}); }
      catch { return res.status(500).json({ ok:false, code:'checkout_error', message:String(err && err.message || err) }); }
    }
  });
  console.log('[checkout] public inline handler active for /__public-checkout');
};
