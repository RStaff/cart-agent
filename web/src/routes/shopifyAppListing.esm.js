import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalizePublicAppUrl } from "../../../staffordos/shared/public_base_url.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const listingPath = join(__dirname, "..", "content", "shopifyAppListing.json");

function loadListingContent() {
  const raw = fs.readFileSync(listingPath, "utf8");
  return JSON.parse(raw);
}

function brandLogo() {
  return `<img src="${canonicalizePublicAppUrl("/assets/logo.svg")}" alt="Abando" style="display:block;height:28px;width:auto;" />`;
}

function page({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="icon" href="${canonicalizePublicAppUrl("/assets/favicon.ico")}" />
  <meta property="og:image" content="${canonicalizePublicAppUrl("/assets/logo.svg")}" />
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top, rgba(34, 197, 94, 0.10), transparent 28%),
        linear-gradient(180deg, #020617 0%, #0f172a 100%);
      color: #e5eef8;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .shell {
      max-width: 980px;
      margin: 0 auto;
      padding: 42px 22px 72px;
    }
    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(148, 163, 184, 0.14);
      color: #dcfce7;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .nav-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .nav-links a {
      display: inline-flex;
      align-items: center;
      min-height: 38px;
      padding: 0 12px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.64);
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
    }
    .panel {
      margin-top: 18px;
      border-radius: 28px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.88);
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
      padding: 28px;
    }
    h1 {
      margin: 12px 0 10px;
      font-size: clamp(38px, 7vw, 58px);
      line-height: 1.02;
      letter-spacing: -0.05em;
    }
    h2 {
      margin: 0 0 10px;
      font-size: 30px;
      letter-spacing: -0.04em;
    }
    p {
      margin: 0;
      color: #cbd5e1;
      line-height: 1.65;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 18px;
      line-height: 1.7;
      max-width: 56ch;
    }
    .grid {
      display: grid;
      gap: 18px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: 18px;
    }
    .card {
      border-radius: 22px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: rgba(2, 6, 23, 0.46);
      padding: 20px;
    }
    .list {
      margin: 12px 0 0;
      padding-left: 18px;
      display: grid;
      gap: 8px;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .meta {
      margin-top: 6px;
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
    }
    .cta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 20px;
    }
    .button,
    .button-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 50px;
      border-radius: 16px;
      padding: 0 18px;
      text-decoration: none;
      font-weight: 800;
    }
    .button {
      background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
      color: #020617;
    }
    .button-secondary {
      background: rgba(2, 6, 23, 0.54);
      color: #f8fafc;
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .label {
      color: #94a3b8;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .support {
      display: grid;
      gap: 8px;
      color: #e2e8f0;
    }
    .footer-grid {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-top: 18px;
    }
    .footer-card {
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: rgba(2, 6, 23, 0.46);
      padding: 16px;
    }
    .footer-card strong {
      display: block;
      margin-bottom: 8px;
      color: #f8fafc;
    }
    .footer-card a {
      display: block;
      color: #94a3b8;
      line-height: 1.9;
      text-decoration: none;
    }
    .footer-note {
      margin-top: 18px;
      color: #64748b;
      font-size: 13px;
    }
    @media (max-width: 860px) {
      .grid { grid-template-columns: 1fr; }
      .footer-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">${body}</main>
</body>
</html>`;
}

export function installShopifyAppListingRoute(app) {
  app.get("/shopify-app", (_req, res) => {
    const listing = loadListingContent();
    const homeUrl = canonicalizePublicAppUrl("/");
    const installUrl = canonicalizePublicAppUrl("/install/shopify");
    const pricingUrl = canonicalizePublicAppUrl("/pricing");
    const proofUrl = canonicalizePublicAppUrl("/proof?flow=demo");
    const privacyUrl = canonicalizePublicAppUrl("/privacy");
    const benefitHtml = listing.key_benefits.map((item) => `<li>${item}</li>`).join("");
    const detailSteps = listing.how_it_works.map((item) => `<li>${item}</li>`).join("");
    const faqHtml = listing.faq.map((item) => `
      <div class="card">
        <div class="label">${item.question}</div>
        <p>${item.answer}</p>
      </div>
    `).join("");
    const body = `
      <nav class="nav">
        <a class="brand" href="${homeUrl}" aria-label="Abando home">${brandLogo()}</a>
        <div class="nav-links">
          <a href="${homeUrl}">Home</a>
          <a href="${proofUrl}">Proof</a>
          <a href="${pricingUrl}">Pricing</a>
        </div>
      </nav>

      <section class="panel">
        <div class="label">App Store-ready positioning</div>
        <h1>${listing.app_name}</h1>
        <p class="subtitle">${listing.subtitle}</p>
        <div class="cta-row">
          <a class="button" href="${installUrl}">Install Abando</a>
          <a class="button-secondary" href="${proofUrl}">See proof</a>
        </div>
      </section>

      <section class="panel">
        <div class="grid">
          <div class="card">
            <div class="label">App tagline</div>
            <h2>${listing.app_tagline}</h2>
            <p class="meta">${listing.short_description}</p>
          </div>
          <div class="card">
            <div class="label">Who it is for</div>
            <h2>Built for Shopify merchants</h2>
            <p>${listing.who_its_for}</p>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="grid">
          <div class="card">
            <div class="label">Short description</div>
            <p>${listing.short_description}</p>
          </div>
          <div class="card">
            <div class="label">Pricing</div>
            <p>${listing.pricing_summary}</p>
          </div>
        </div>
        <div class="cta-row">
          <a class="button" href="${pricingUrl}">View pricing</a>
          <a class="button-secondary" href="${installUrl}">Install Abando</a>
        </div>
      </section>

      <section class="panel">
        <div class="label">Long description</div>
        <h2>What Abando does</h2>
        <p>${listing.full_description}</p>
      </section>

      <section class="panel">
        <div class="grid">
          <div class="card">
            <div class="label">Key benefits</div>
            <ul class="list">${benefitHtml}</ul>
          </div>
          <div class="card">
            <div class="label">How it works</div>
            <ul class="list">${detailSteps}</ul>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="label">Submission blocks</div>
        <div class="grid">
          <div class="card">
            <div class="label">3 benefit bullets</div>
            <ul class="list">${listing.benefit_bullets.map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
          <div class="card">
            <div class="label">Support</div>
            <div class="support">
              <div>Support email: <a href="mailto:${listing.support_email}">${listing.support_email}</a></div>
              <div>Support URL: <a href="${listing.support_url}">${listing.support_url}</a></div>
              <div>Privacy URL: <a href="${privacyUrl}">${privacyUrl}</a></div>
              <div>Logo URL: <a href="${listing.logo_url}">${listing.logo_url}</a></div>
              <div>App icon URL: <a href="${listing.app_icon_url}">${listing.app_icon_url}</a></div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="label">FAQ</div>
        <div class="grid">${faqHtml}</div>
      </section>

      <section class="panel">
        <div class="label">Support and links</div>
        <div class="footer-grid">
          <div class="footer-card">
            <strong>Product</strong>
            <a href="${installUrl}">Install Abando</a>
            <a href="${proofUrl}">See proof</a>
            <a href="${pricingUrl}">Pricing</a>
          </div>
          <div class="footer-card">
            <strong>Support</strong>
            <a href="mailto:${listing.support_email}">${listing.support_email}</a>
          </div>
          <div class="footer-card">
            <strong>Privacy</strong>
            <a href="${privacyUrl}">${privacyUrl}</a>
          </div>
          <div class="footer-card">
            <strong>Listing use</strong>
            <a href="${homeUrl}">Public home</a>
            <a href="${proofUrl}">Proof page</a>
          </div>
        </div>
        <div class="footer-note">This page is the reusable listing surface for demos, outreach, and App Store submission prep. It stays grounded in the real install, proof, and pricing journey.</div>
      </section>
    `;
    res.status(200).type("html").send(page({
      title: "Abando Shopify App Listing",
      body,
    }));
  });

  app.get("/privacy", (_req, res) => {
    res.status(200).type("html").send(page({
      title: "Abando Privacy",
      body: `
        <div class="brand">Abando</div>
        <section class="panel">
          <div class="label">Privacy</div>
          <h1>Privacy for merchants evaluating Abando</h1>
          <p class="subtitle">Abando is designed to explain what it does before install, show what happens after install, and keep merchant-facing communication clear.</p>
          <div class="grid">
            <div class="card">
              <div class="label">What to expect</div>
              <p>After install, the merchant lands in the connected experience, can send a recovery to themselves, and can verify the return path before starting a paid plan.</p>
            </div>
            <div class="card">
              <div class="label">Contact</div>
              <p>Questions about privacy or support can be sent to <a href="mailto:hello@abando.ai">hello@abando.ai</a>.</p>
            </div>
          </div>
        </section>
      `,
    }));
  });
}
