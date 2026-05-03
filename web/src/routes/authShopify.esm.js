import crypto from "node:crypto";

const installs = new Map(); // TEMP store (replace with DB later)

export function installAuthShopify(app) {

  app.get("/auth", async (req, res) => {
    const shop = req.query.shop;

    if (!shop || !shop.endsWith(".myshopify.com")) {
      return res.status(400).send("Invalid shop");
    }

    const apiKey = process.env.SHOPIFY_API_KEY;
    const scopes = "read_checkouts,read_orders,read_script_tags,write_checkouts,write_script_tags";
    const appUrl = String(process.env.APP_URL || "https://pay.abando.ai").replace(/\/+$/, "");
    const redirectUri = `${appUrl}/auth/callback`;

    const state = crypto.randomBytes(16).toString("hex");

    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}`;

    return res.redirect(installUrl);
  });

  app.get("/auth/callback", async (req, res) => {
    const { shop, code } = req.query;

    if (!shop || !code) {
      return res.status(400).send("Missing shop or code");
    }

    try {
      const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code
        })
      });

      const data = await response.json();

      if (!data.access_token) {
        return res.status(500).send("Token exchange failed");
      }

      // STORE INSTALL (TEMP)
      installs.set(shop, {
        access_token: data.access_token,
        installed_at: new Date().toISOString()
      });

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

  // PROOF ENDPOINT
  app.get("/api/install/status", (req, res) => {
    const { shop } = req.query;

    const record = installs.get(shop);

    if (!record) {
      return res.json({
        installed: false
      });
    }

    return res.json({
      installed: true,
      token: true,
      installed_at: record.installed_at
    });
  });
}
