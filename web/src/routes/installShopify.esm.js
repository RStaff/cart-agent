/**
 * Shopify no-manual installer
 * Routes:
 *   GET  /install/shopify          -> landing with Connect + Enable
 *   POST /install/shopify/enable   -> creates/ensures ScriptTag for https://abando.ai/abando.js
 */
export async function installShopify(app) {
  // Try to import your Shopify app instance (common template paths)
  let shopify = null;
  for (const path of ["../shopify.js","../shopify.mjs","../config/shopify.js","../../shopify.js"]) {
    try {
      const mod = await import(path);
      shopify = mod.default || mod.shopify || mod.app || mod;
      if (shopify?.api?.rest) break;
    } catch {}
  }
  const HAVE_SDK = Boolean(shopify?.api?.rest);

  function page({ title, body }) {
    return `<!doctype html><html lang="en">
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0b0b0c;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:880px;margin:0 auto;padding:40px 20px}
.card{background:#121214;border:1px solid #222;border-radius:16px;padding:22px}
h1{font-size:clamp(28px,5vw,42px);margin:.2rem 0 1rem}
.lead{opacity:.9;font-size:clamp(16px,2.2vw,19px);line-height:1.7}
.row{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}
.kv{flex:1 1 240px;background:#0f0f11;border:1px solid #222;border-radius:12px;padding:12px}
.kv b{display:block;opacity:.75;font-weight:600;margin-bottom:4px}
.cta{display:inline-block;padding:12px 16px;border-radius:12px;background:#5b8cff;color:#0b0b0c;font-weight:800;text-decoration:none}
.ghost{display:inline-block;padding:12px 16px;border-radius:12px;background:#0f0f11;border:1px solid #222;color:#f2f2f2;text-decoration:none}
.small{opacity:.65;font-size:12px;margin-top:10px}
footer{opacity:.6;font-size:13px;margin-top:20px}
input,button{font:inherit}
input[type=text]{width:100%;padding:12px;border-radius:10px;border:1px solid #333;background:#0e0e10;color:#f2f2f2}
form{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
</style>
<body><div class="wrap">${body}</div></body></html>`;
  }

  // GET /install/shopify
  app.get("/install/shopify", (_req, res) => {
    const body = `
      <div class="card">
        <h1>Install on Shopify (no manual theme edits)</h1>
        <p class="lead">Click <b>Connect</b>, approve access, then click <b>Enable</b> to auto-inject Abando.</p>

        <div class="row">
          <div class="kv"><b>Status</b><div>${HAVE_SDK ? "Shopify SDK detected" : "Shopify SDK missing — Enable will explain next steps"}</div></div>
          <div class="kv"><b>Script URL</b><div>https://abando.ai/abando.js</div></div>
        </div>

        <div style="margin-top:12px">
          <form method="GET" action="/auth">
            <input type="text" name="shop" placeholder="your-store.myshopify.com" aria-label="Shop domain" required>
            <button class="cta" type="submit">Connect Shopify</button>
          </form>
        </div>

        <div style="margin-top:12px">
          <form method="POST" action="/install/shopify/enable">
            <input type="text" name="shop" placeholder="your-store.myshopify.com" aria-label="Shop domain" required>
            <button class="ghost" type="submit">Enable ScriptTag</button>
          </form>
        </div>

        <p class="small">This creates (or updates) a ScriptTag to load <code>https://abando.ai/abando.js</code> on all storefront pages.</p>
      </div>
      <footer>© <span id="y"></span> Abando™</footer>
      <script>document.getElementById("y").textContent = new Date().getFullYear()</script>
    `;
    res.status(200).type("html").send(page({ title: "Install Abando on Shopify", body }));
  });

  // POST /install/shopify/enable
  app.post("/install/shopify/enable", async (req, res) => {
    const shop = String(req.body?.shop || req.query?.shop || "").trim();
    if (!shop) return res.status(400).json({ ok:false, error:"missing shop ?shop=your-store.myshopify.com" });
    if (!HAVE_SDK) return res.status(500).json({ ok:false, error:"Shopify SDK not detected in server; cannot create ScriptTag yet" });

    try {
      // Get an authenticated Admin API client for this shop
      const sessionId = await shopify.session.getCurrentId({
        isOnline: true,
        rawRequest: req,
        rawResponse: res,
      });
      const session = await shopify.session.storage.loadSession(sessionId);
      if (!session?.shop || session.shop !== shop) {
        return res.status(401).json({ ok:false, error:"Not authorized for this shop. Use Connect at /install/shopify first." });
      }

      const client = new shopify.api.clients.Rest({ session });
      const SRC = "https://abando.ai/abando.js";

      // Look for existing ScriptTag
      const list = await client.get({ path: "script_tags", query: { src: SRC, limit: 50 } });
      const existing = (list?.body?.script_tags || []).find(s => s.src === SRC);

      if (existing) {
        const updated = await client.put({
          path: `script_tags/${existing.id}`,
          data: { script_tag: { event: "onload", src: SRC, display_scope: "online_store" } },
          type: "application/json",
        });
        return res.json({ ok:true, action:"updated", id: existing.id, script_tag: updated?.body?.script_tag || null });
      }

      // Create new ScriptTag
      const created = await client.post({
        path: "script_tags",
        data: { script_tag: { event: "onload", src: SRC, display_scope: "online_store" } },
        type: "application/json",
      });
      return res.json({ ok:true, action:"created", id: created?.body?.script_tag?.id || null, script_tag: created?.body?.script_tag || null });
    } catch (e) {
      return res.status(500).json({ ok:false, error: String((e && e.message) || e) });
    }
  });
}
