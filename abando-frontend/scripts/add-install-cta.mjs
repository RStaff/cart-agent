import fs from "node:fs";
import path from "node:path";
import { Project, QuoteKind, SyntaxKind } from "ts-morph";

const repo = process.cwd();
const componentPath = path.join(repo, "src/components/InstallCTA.tsx");
const layoutPath    = path.join(repo, "src/app/layout.tsx");

// --- 1) Ensure the component exists (overwrite with a clean, formatter-friendly file)
const componentSource = `\
"use client";
import React from "react";

type InstallCTAProps = {
  className?: string;
  layout?: "inline" | "stacked";
  compact?: boolean;
  sticky?: boolean;
};

export function InstallCTA({
  className = "",
  layout = "inline",
  compact = false,
  sticky = false,
}: InstallCTAProps) {
  const root = "rounded-md border border-neutral-200 dark:border-neutral-800 p-3";
  const wrap = layout === "inline" ? "flex items-center gap-3" : "flex flex-col gap-3";
  const stickyCls = sticky ? "sticky bottom-4 bg-white/70 dark:bg-black/40 backdrop-blur" : "";
  const classes = [root, wrap, stickyCls, className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <button
        type="button"
        className="px-3 py-2 rounded bg-black text-white hover:opacity-90"
        onClick={() => window.open("https://chromewebstore.google.com", "_blank")}
      >
        Install{!compact && <span className="hidden sm:inline">&nbsp;for Chrome</span>}
      </button>
      <button
        type="button"
        className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700"
        onClick={() => window.open("https://apps.shopify.com", "_blank")}
      >
        Install{!compact && <span className="hidden sm:inline">&nbsp;for Shopify</span>}
      </button>
    </div>
  );
}
`;

fs.mkdirSync(path.dirname(componentPath), { recursive: true });
fs.writeFileSync(componentPath, componentSource, "utf8");

// --- 2) Wire it into layout.tsx (add import via AST, insert JSX once near the end of the body)
if (!fs.existsSync(layoutPath)) {
  console.error("❌ src/app/layout.tsx not found");
  process.exit(1);
}

// Add import safely with ts-morph
const project = new Project({ tsConfigFilePath: path.join(repo, "tsconfig.json") });
const source = project.addSourceFileAtPath(layoutPath);
project.manipulationSettings.set({ quoteKind: QuoteKind.Double });

const existingImport = source.getImportDeclarations().find((id) => {
  return id.getModuleSpecifierValue().includes("@/components/InstallCTA") ||
         id.getModuleSpecifierValue().includes("src/components/InstallCTA");
});

if (!existingImport) {
  source.addImportDeclaration({
    namedImports: [{ name: "InstallCTA" }],
    moduleSpecifier: "@/components/InstallCTA",
  });
}

// Save AST changes to add import
source.saveSync();

// Insert JSX in a bounded, idempotent way.
// Strategy: if the file already contains "<InstallCTA", do nothing.
// Otherwise, try to insert just before "</body>" (if present).
// If no </body>, insert right after the first "{children}" occurrence.
// If neither exists, append at the end of the file with a comment marker.
let layout = fs.readFileSync(layoutPath, "utf8");
if (!layout.includes("<InstallCTA")) {
  const snippet = `\n      {/* Install CTA */}\n      <InstallCTA sticky />\n`;
  let updated = layout;

  // Insert before </body> if there's a body tag (common in App Router layout)
  if (updated.match(/<\/body>/)) {
    updated = updated.replace(/<\/body>/, `${snippet}    </body>`);
  } else if (updated.match(/\{children\}/)) {
    // Insert right after the first {children}
    updated = updated.replace(/\{children\}/, `{children}${snippet}`);
  } else {
    // Fallback: place near the end with a visible marker (still valid JSX in most layouts)
    updated += `\n\n{/* Install CTA (fallback insertion) */}\n<InstallCTA sticky />\n`;
  }

  fs.writeFileSync(layoutPath, updated, "utf8");
}

console.log("✓ Added/updated InstallCTA component and wired it into layout.tsx");
