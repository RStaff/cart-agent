import { execSync } from "node:child_process";

const shop = process.env.SHOP || "cart-agent-dev.myshopify.com";
const url  = `https://abando.ai/shopify/dev-install?shop=${shop}`;

const cmd =
  process.platform === "darwin" ? `open "${url}"` :
  process.platform === "win32" ? `start "" "${url}"` :
  `xdg-open "${url}"`;

console.log("🌐 Opening:", url);
try { execSync(cmd, { stdio: "ignore" }); }
catch { console.log("Could not auto-open. Copy this URL:\n", url); }
