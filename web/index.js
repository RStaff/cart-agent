/** Proxy entry for production hosts that still call `node web/index.js` */
require('./src/index.js');

// ---- Stripe Checkout result routes ----
const _publicRoot = (typeof process !== 'undefined' && process.cwd) ? require('path').resolve(process.cwd(), "public") : "";
if (typeof app !== 'undefined' && _publicRoot) {
  const _p = require('path');
  app.get("/success", (req, res) => res.sendFile(_p.join(_publicRoot, "success.html")));
  app.get("/cancel",  (req, res) => res.sendFile(_p.join(_publicRoot, "cancel.html")));
}
// --------------------------------------
