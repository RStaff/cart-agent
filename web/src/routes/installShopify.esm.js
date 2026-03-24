const SCRIPT_TAG_BASE = process.env.ABANDO_STOREFRONT_SCRIPT_SRC || "https://abando.ai/abando.js";
const EVENT_INGEST_BASE =
  process.env.ABANDO_PUBLIC_APP_ORIGIN ||
  process.env.NEXT_PUBLIC_ABANDO_PUBLIC_APP_ORIGIN ||
  process.env.APP_URL ||
  "https://pay.abando.ai";

function buildScriptTagSrc({ shop, eventBase = EVENT_INGEST_BASE }) {
  const normalizedShop = normalizeShop(shop);
  const url = new URL(SCRIPT_TAG_BASE);
  let normalizedEventBase = "";

  try {
    normalizedEventBase = eventBase ? new URL(String(eventBase)).origin : "";
  } catch {
    normalizedEventBase = String(eventBase || "").replace(/\/+$/, "");
  }

  if (normalizedShop) {
    url.searchParams.set("shop", normalizedShop);
  }

  if (normalizedEventBase) {
    url.searchParams.set("event_base", normalizedEventBase);
  }

  return url.toString();
}

function isManagedAbandoScriptTag(scriptTag, src) {
  try {
    const left = new URL(String(scriptTag?.src || ""));
    const right = new URL(src);
    return left.hostname === right.hostname && left.pathname === right.pathname;
  } catch {
    return false;
  }
}

function normalizeShop(raw) {
  if (!raw) return "";
  let value = String(raw).trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.split("/")[0].split("?")[0].split("#")[0];
  if (value && !value.includes(".")) {
    value = `${value}.myshopify.com`;
  }
  if (!value.endsWith(".myshopify.com")) {
    return "";
  }
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(value)) {
    return "";
  }
  return value;
}

async function shopifyAdminRequest({ shop, accessToken, path, method = "GET", body = null, searchParams = null }) {
  const normalizedShop = normalizeShop(shop);
  if (!normalizedShop) {
    throw new Error("Invalid shop domain for Shopify admin request.");
  }
  if (!accessToken) {
    throw new Error("Missing Shopify access token.");
  }

  const url = new URL(`https://${normalizedShop}/admin/api/2024-10/${path}`);
  if (searchParams && typeof searchParams === "object") {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Shopify admin request failed (${response.status} ${response.statusText}): ${errorBody}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function ensureScriptTagInstalled({ shop, accessToken, src = buildScriptTagSrc({ shop }) }) {
  const list = await shopifyAdminRequest({
    shop,
    accessToken,
    path: "script_tags.json",
    searchParams: { limit: 50 },
  });

  const existing = (list?.script_tags || []).find((scriptTag) => isManagedAbandoScriptTag(scriptTag, src));
  if (existing?.id) {
    const updated = await shopifyAdminRequest({
      shop,
      accessToken,
      path: `script_tags/${existing.id}.json`,
      method: "PUT",
      body: {
        script_tag: {
          event: "onload",
          src,
          display_scope: "online_store",
        },
      },
    });

    return {
      ok: true,
      action: "updated",
      id: existing.id,
      script_tag: updated?.script_tag || null,
      src,
    };
  }

  const created = await shopifyAdminRequest({
    shop,
    accessToken,
    path: "script_tags.json",
    method: "POST",
    body: {
      script_tag: {
        event: "onload",
        src,
        display_scope: "online_store",
      },
    },
  });

  return {
    ok: true,
    action: "created",
    id: created?.script_tag?.id || null,
    script_tag: created?.script_tag || null,
    src,
  };
}

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

export function installShopify(app, { getShopRecord } = {}) {
  app.get("/install/shopify", (req, res) => {
    const prefilledShop = normalizeShop(req.query.shop);
    const inviteId = typeof req.query.invite === "string" ? req.query.invite.trim() : "";
    const selectedPlan = typeof req.query.plan === "string" ? req.query.plan.trim().toLowerCase() : "";
    const planLabel = selectedPlan === "starter"
      ? "Starter"
      : selectedPlan === "growth"
        ? "Growth"
        : "";
    const body = `
      <div class="card">
        <h1>Abando helps you recover lost checkout revenue.</h1>
        <p class="lead">Connect your store, detect checkout abandonment signals, and activate recovery with a simple merchant view.</p>
        ${planLabel ? `<p class="small" style="margin-top:8px">Selected plan: ${planLabel}. Billing is not collected on this page. This step only starts the install flow.</p>` : ""}

        <div class="row">
          <div class="kv"><b>Store connected</b><div>After Shopify approval</div></div>
          <div class="kv"><b>Checkout signals detected</b><div>After live store activity begins</div></div>
          <div class="kv"><b>Recovery trigger ready</b><div>Shown in your merchant view</div></div>
        </div>

        <div style="margin-top:12px">
          <form method="GET" action="/auth">
            <input type="text" name="shop" placeholder="your-store.myshopify.com" aria-label="Shop domain" value="${prefilledShop || ""}" required>
            ${inviteId ? `<input type="hidden" name="invite" value="${inviteId}">` : ""}
            <button class="cta" type="submit">Connect Shopify</button>
          </form>
        </div>

        <p class="small">After approval, Abando completes storefront activation and sends you to your merchant dashboard. Real checkout evidence begins only after the connected store starts generating activity.${inviteId ? " This install path is being tracked from an Abando invite." : ""}${planLabel ? " Plan selection is being carried through as setup context only." : ""}</p>
      </div>
      <footer>© <span id="y"></span> Abando™</footer>
      <script>document.getElementById("y").textContent = new Date().getFullYear()</script>
    `;
    res.status(200).type("html").send(page({ title: "Install Abando on Shopify", body }));
  });

  app.post("/install/shopify/enable", async (req, res) => {
    const shop = normalizeShop(req.body?.shop || req.query?.shop || "");
    if (!shop) {
      return res.status(400).json({ ok: false, error: "missing shop ?shop=your-store.myshopify.com" });
    }
    if (typeof getShopRecord !== "function") {
      return res.status(500).json({ ok: false, error: "Shop lookup is not configured for manual install enablement." });
    }

    try {
      const shopRecord = await getShopRecord(shop);
      const accessToken = String(shopRecord?.apiKey || "");
      if (!shopRecord || !accessToken) {
        return res.status(401).json({ ok: false, error: "Not authorized for this shop. Complete OAuth at /auth first." });
      }

      const result = await ensureScriptTagInstalled({
        shop,
        accessToken,
      });

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/install/shopify/success", (req, res) => {
    const shop = normalizeShop(req.query.shop);
    const artifactStatus = String(req.query.artifact_status || "enabled");
    const body = `
      <div class="card">
        <h1>Abando installed successfully</h1>
        <p class="lead">The Shopify storefront artifact was ${artifactStatus} for ${shop || "your shop"} during setup. Your storefront is ready and your merchant dashboard is live.</p>

        <div class="row">
          <div class="kv"><b>Shop</b><div>${shop || "Unknown"}</div></div>
          <div class="kv"><b>Artifact</b><div>ScriptTag for ${SCRIPT_TAG_BASE}</div></div>
        </div>

        <div style="margin-top:16px">
          <a class="cta" href="/dashboard?shop=${encodeURIComponent(shop || "")}&installed=1">Open your Abando dashboard</a>
        </div>

        <p class="small">Revenue attribution appears after paid Shopify orders are matched back to checkout activity.</p>
      </div>
      <footer>© <span id="y"></span> Abando™</footer>
      <script>document.getElementById("y").textContent = new Date().getFullYear()</script>
    `;
    res.status(200).type("html").send(page({ title: "Abando Installed", body }));
  });
}

export { buildScriptTagSrc, ensureScriptTagInstalled, SCRIPT_TAG_BASE };
