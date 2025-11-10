/** Proxy entry for production hosts that still call `node web/index.js` */
require('./src/index.js');

// ---- Stripe Checkout result routes ----
const _publicRoot = path.resolve(process.cwd(), "public");
app.get("/success", (req, res) => res.sendFile(path.join(_publicRoot, "success.html")));
app.get("/cancel",  (req, res) => res.sendFile(path.join(_publicRoot, "cancel.html")));
// -----------------------------------------
