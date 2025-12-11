import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "components", "ShopifyBadge.tsx");

if (!fs.existsSync(FILE)) {
  console.error("❌ Could not find components/ShopifyBadge.tsx");
  process.exit(1);
}

const existing = fs.readFileSync(FILE, "utf8");
const backupPath = FILE + ".before_logo_only_" + Date.now() + ".tsx";

const newSource = `\"use client\";

import Image from "next/image";

export default function ShopifyBadge() {
  return (
    <div className="flex items-center">
      <Image
        src="/shopify_monotone_white.svg"
        alt="Shopify"
        width={80}
        height={24}
        className="object-contain"
        priority
      />
    </div>
  );
}
`;

fs.writeFileSync(backupPath, existing, "utf8");
fs.writeFileSync(FILE, newSource, "utf8");

console.log("💾 Backup saved to:", backupPath);
console.log("✅ ShopifyBadge updated to logo-only (no 'Embedded in Shopify admin' text).");
