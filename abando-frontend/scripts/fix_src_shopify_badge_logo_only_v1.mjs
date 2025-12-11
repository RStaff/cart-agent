#!/usr/bin/env node
import fs from "fs";
import path from "path";

const FILE = "src/components/ShopifyBadge.tsx";

// Make sure the folder exists
fs.mkdirSync(path.dirname(FILE), { recursive: true });

// Backup existing file if present
if (fs.existsSync(FILE)) {
  const existing = fs.readFileSync(FILE, "utf8");
  const backupPath = FILE + ".before_logo_only_" + Date.now() + ".tsx";
  fs.writeFileSync(backupPath, existing, "utf8");
  console.log("💾 Backup saved to:", backupPath);
} else {
  console.log("ℹ️ src/components/ShopifyBadge.tsx did not exist; creating it fresh.");
}

// New logo-only Shopify badge (no visible 'Embedded in Shopify admin' text)
const NEW_SOURCE = `import Image from "next/image";

export default function ShopifyBadge() {
  return (
    <div className="flex items-center rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1">
      <span className="sr-only">Built for Shopify</span>
      <div className="relative h-5 w-20">
        <Image
          src="/shopify_monotone_white.svg"
          alt="Shopify"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
`;

fs.writeFileSync(FILE, NEW_SOURCE, "utf8");
console.log("✅ src/components/ShopifyBadge.tsx updated to logo-only (no 'Embedded in Shopify admin' text).");
