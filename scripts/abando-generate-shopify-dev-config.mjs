import fs from "node:fs";
import path from "node:path";

const repoRoot = "/Users/rossstafford/projects/cart-agent";
const sourcePath = path.join(repoRoot, "shopify.app.toml");
const outputDir = path.join(repoRoot, ".abando-dev");
const outputPath = path.join(outputDir, "shopify.app.dev.toml");

const stableUrl = String(process.env.ABANDO_DEV_PUBLIC_URL || "").trim().replace(/\/+$/, "");

if (!stableUrl) {
  console.error("ABANDO_DEV_PUBLIC_URL is required");
  process.exit(1);
}

const source = fs.readFileSync(sourcePath, "utf8");

function extract(pattern, fallback = "") {
  const match = source.match(pattern);
  return match ? match[1] : fallback;
}

const clientId = extract(/^client_id\s*=\s*"(.*)"$/m);
const name = extract(/^name\s*=\s*"(.*)"$/m, "cart-agent");
const handle = extract(/^handle\s*=\s*"(.*)"$/m, "cart-agent-1");
const scopes = extract(/^scopes\s*=\s*"(.*)"$/m, "write_products");
const apiVersion = extract(/^api_version\s*=\s*"(.*)"$/m, "2025-07");

const devToml = `client_id = "${clientId}"
name = "${name}"
handle = "${handle}"
application_url = "${stableUrl}"
embedded = true

[build]
automatically_update_urls_on_dev = false

[webhooks]
api_version = "${apiVersion}"

  [[webhooks.subscriptions]]
  uri = "/api/webhooks/gdpr"
  compliance_topics = [
    "customers/data_request",
    "customers/redact",
    "shop/redact"
  ]

[access_scopes]
scopes = "${scopes}"
optional_scopes = []
use_legacy_install_flow = false

[auth]
redirect_urls = [
  "${stableUrl}/auth/callback",
  "${stableUrl}/auth/shopify/callback",
  "${stableUrl}/api/auth/callback",
]

[pos]
embedded = false
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, devToml);

console.log(outputPath);
