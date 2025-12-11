#!/usr/bin/env node
import fs from "fs";
import path from "path";

const FILE = path.join("app", "components", "ShopifyBadge.tsx");

// Logo-only Shopify badge component (no text like "Embedded in Shopify admin")
const NEXT_COMPONENT = `import Image from "next/image";

export default function ShopifyBadge() {
  return (
    <div className="inline-flex items-center justify-center rounded-md border border-slate-700/80 bg-slate-900/80 px-3 py-1">
      <span className="sr-only">Built for Shopify</span>
      <div className="relative h-5 w-20">
        <Image
          src="/shopify_monotone_white.svg"
          alt="Shopify"
          fill
          className="object-contain"
          priority={false}
        />
      </div>
    </div>
  );
}
`;

// Ensure components dir exists
fs.mkdirSync(path.dirname(FILE), { recursive: true });

// If component already exists, back it up
if (fs.existsSync(FILE)) {
  const existing = fs.readFileSync(FILE, "utf8");
  const backupPath = FILE + ".before_logo_only_" + Date.now() + ".tsx";
  fs.writeFileSync(backupPath, existing, "utf8");
  console.log("💾 Existing ShopifyBadge.tsx backed up to:", backupPath);
} else {
  console.log("ℹ️ ShopifyBadge.tsx did not exist; creating new file.");
}

// Write the new logo-only component
fs.writeFileSync(FILE, NEXT_COMPONENT, "utf8");
console.log("✅ ShopifyBadge.tsx set to logo-only variant (no 'Embedded in Shopify admin' text).");
