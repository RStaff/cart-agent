import crypto from "node:crypto";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const SHOPIFY_SCOPES =
  process.env.SHOPIFY_SCOPES ||
  "read_checkouts,read_orders,read_script_tags,write_checkouts,write_script_tags";

function normalizeAppUrl() {
  return String(process.env.APP_URL || "https://pay.abando.ai").replace(/\/+$/, "");
}

async function ensureInstallTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS shopify_installs (
      shop TEXT PRIMARY KEY,
      access_token TEXT NOT NULL,
      scope TEXT,
      installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function saveInstall({ shop, accessToken, scope }) {
  await ensureInstallTable();

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO shopify_installs (shop, access_token, scope, installed_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT (shop)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      scope = EXCLUDED.scope,
      updated_at = NOW();
    `,
    shop,
    accessToken,
    scope || null
  );
}

async function getInstall(shop) {
  await ensureInstallTable();

  const rows = await prisma.$queryRawUnsafe(
    `
    SELECT shop, scope, installed_at, updated_at
    FROM shopify_installs
    WHERE shop = $1
    LIMIT 1;
    `,
    shop
  );

  return rows?.[0] || null;
}

export function installAuthShopify(app) {
  app.get("/auth", async (req, res) => {
    const shop = req.query.shop;

    if (!shop || !String(shop).endsWith(".myshopify.com")) {
      return res.status(400).send("Invalid shop");
    }

    const apiKey = process.env.SHOPIFY_API_KEY;
    const redirectUri = `${normalizeAppUrl()}/auth/callback`;
    const state = crypto.randomBytes(16).toString("hex");

    const installUrl =
      `https://${shop}/admin/oauth/authorize?` +
      new URLSearchParams({
        client_id: apiKey,
        scope: SHOPIFY_SCOPES,
        redirect_uri: redirectUri,
        state
      }).toString();

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

      await saveInstall({
        shop,
        accessToken: data.access_token,
        scope: data.scope || SHOPIFY_SCOPES
      });

      console.log("✅ INSTALL STORED IN DATABASE:", shop);

      return res.send(`
        <h1>✅ Abando Installed</h1>
        <p>Shop: ${shop}</p>
        <p>Status: Token received + stored in database</p>
      `);
    } catch (err) {
      console.error("❌ TOKEN EXCHANGE ERROR:", err);
      return res.status(500).send("OAuth failed");
    }
  });

  app.get("/api/install/status", async (req, res) => {
    const shop = req.query.shop;

    if (!shop) {
      return res.status(400).json({ installed: false, error: "missing_shop" });
    }

    try {
      const record = await getInstall(shop);

      if (!record) {
        return res.json({
          installed: false,
          shop,
          storage: "database",
          known: false
        });
      }

      return res.json({
        installed: true,
        token: true,
        shop: record.shop,
        installed_at: record.installed_at,
        updated_at: record.updated_at,
        scope: record.scope,
        storage: "database"
      });
    } catch (err) {
      console.error("❌ INSTALL STATUS ERROR:", err);
      return res.status(500).json({
        installed: false,
        shop,
        storage: "database",
        error: "install_status_query_failed"
      });
    }
  });
}
