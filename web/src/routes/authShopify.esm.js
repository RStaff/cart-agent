import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const INSTALL_STORE_PATH = "/tmp/abando_shopify_installs.json";

function normalizeShop(shop) {
  return String(shop || "").trim().toLowerCase();
}

function readInstalls() {
  try {
    if (!fs.existsSync(INSTALL_STORE_PATH)) return {};
    return JSON.parse(fs.readFileSync(INSTALL_STORE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeInstalls(data) {
  fs.writeFileSync(INSTALL_STORE_PATH, JSON.stringify(data, null, 2));
}

export function installAuthShopify(app) {
  app.get("/auth", async (req, res) => {
    const shop = normalizeShop(req.query.shop);

    if (!shop || !shop.endsWith(".myshopify.com")) {
      return res.status(400).send("Invalid shop");
    }

    const apiKey = process.env.SHOPIFY_API_KEY;
    const scopes =
      process.env.SHOPIFY_SCOPES ||
      "read_checkouts,read_orders,read_script_tags,write_checkouts,write_script_tags";

    const appUrl = String(process.env.APP_URL || "https://pay.abando.ai").replace(/\/+$/, "");
    const redirectUri = `${appUrl}/auth/callback`;
    const state = crypto.randomBytes(16).toString("hex");

    const installUrl =
      `https://${shop}/admin/oauth/authorize?` +
      `client_id=${encodeURIComponent(apiKey)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;

    return res.redirect(installUrl);
  });

  app.get("/auth/callback", async (req, res) => {
    const shop = normalizeShop(req.query.shop);
    const code = req.query.code;

    if (!shop || !code) {
      return res.status(400).send("Missing shop or code");
    }

    try {
      const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code
        })
      });

      const data = await response.json();

      if (!data.access_token) {
        console.error("❌ TOKEN EXCHANGE FAILED:", data);
        return res.status(500).send("Token exchange failed");
      }

      const installs = readInstalls();

      installs[shop] = {
        installed: true,
        token: true,
        scope: data.scope || null,
        installed_at: new Date().toISOString()
      };

      writeInstalls(installs);

      console.log("✅ INSTALL STORED:", shop);

      return res.send(`
        <h1>✅ Abando Installed</h1>
        <p>Shop: ${shop}</p>
        <p>Status: Token received + stored</p>
      `);
    } catch (err) {
      console.error("❌ TOKEN EXCHANGE ERROR:", err);
      return res.status(500).send("OAuth failed");
    }
  });

  app.get("/api/install/status", (req, res) => {
    const shop = normalizeShop(req.query.shop);
    const installs = readInstalls();
    const record = installs[shop];

    if (!record) {
      return res.json({
        installed: false,
        shop,
        store_path: INSTALL_STORE_PATH,
        known_shops: Object.keys(installs)
      });
    }

    return res.json({
      installed: true,
      token: true,
      shop,
      installed_at: record.installed_at,
      scope: record.scope
    });
  });
}
