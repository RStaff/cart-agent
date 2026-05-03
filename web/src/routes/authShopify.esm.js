import crypto from "node:crypto";

export function installAuthShopify(app) {
  app.get("/auth", async (req, res) => {
    const shop = req.query.shop;

    if (!shop || !shop.endsWith(".myshopify.com")) {
      return res.status(400).send("Invalid shop");
    }

    const apiKey = process.env.SHOPIFY_API_KEY;
    const scopes = process.env.SHOPIFY_SCOPES;
    const redirectUri = `${process.env.APP_URL}/auth/callback`;

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

    // NOTE: token exchange comes next step
    return res.send(`
      <h1>OAuth callback received</h1>
      <p>Shop: ${shop}</p>
      <p>Code received. Next: exchange token.</p>
    `);
  });
}
