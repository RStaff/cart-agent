import fs from "fs";
import path from "path";
import { execSync } from "node:child_process";

const repo = process.cwd();
const edits = [];

/** rw: read/transform/write-if-changed */
function rw(rel, mutate) {
  const p = path.join(repo, rel);
  if (!fs.existsSync(p)) return;
  const before = fs.readFileSync(p, "utf8");
  const after = mutate(before);
  if (after && after !== before) {
    fs.writeFileSync(p, after, "utf8");
    edits.push(rel);
    console.log("• patched", rel);
  }
}

/** 1) demo route: remove catch binding entirely → `catch {}` */
rw("src/app/api/demo/generate/route.ts", (s) =>
  s
    // catch (e) → catch {}
    .replace(/\bcatch\s*\(\s*[A-Za-z_$][\w$]*\s*\)\s*\{/g, "catch {")
    // catch (_e) → catch {}
    .replace(/\bcatch\s*\(\s*_[A-Za-z_$][\w$]*\s*\)\s*\{/g, "catch {")
);

/** 2) Remove unused imports on the two pages (robust across spacing/quotes) */
const removeImportByLocalName = (code, local) =>
  code.replace(
    new RegExp(
      String.raw`^\s*import\s+${local}\s*,?\s*(?:\{[^}]*\}\s*)?from\s*['"][^'"]+['"]\s*;?\s*$`,
      "m"
    ),
    ""
  );

rw("src/app/dashboard/page.tsx", (s) => removeImportByLocalName(s, "DashboardExplainer"));
rw("src/app/pricing/page.tsx", (s) => removeImportByLocalName(s, "PricingExplainer"));

/** 3) not-found.tsx: <a href="/..."> → <Link href="/..."> (internal links only) */
rw("src/app/not-found.tsx", (s) => {
  let next = s;

  // Replace ALL opening internal anchors
  next = next.replace(/<a(\s+[^>]*?)?\s+href=(["'])\/([^"']*)\2([^>]*)>/g, (m, pre = "", q, pathPart, post = "") => {
    // keep other attributes, but Drop 'href' from the attr bag since it's now on <Link/>
    const attrs = `${(pre || "") + (post || "")}`
      .replace(/\s*href=(["'])\/[^"']*\1/i, "") // remove href
      .replace(/\s+/g, " ")                      // normalize spaces
      .trim();

    return attrs ? `<Link href="/${pathPart}" ${attrs}>` : `<Link href="/${pathPart}">`;
  });

  // Replace matching closing tags
  next = next.replace(/<\/a>/g, "</Link>");

  // Ensure Link import exists
  if (!/from\s+['"]next\/link['"]/.test(next)) {
    // insert after first import if present, else at top
    if (/^import\s/m.test(next)) {
      next = next.replace(/^import[^\n]*\n/m, (line) => `${line}import Link from 'next/link';\n`);
      if (!/import Link from 'next\/link'/.test(next)) {
        next = `import Link from 'next/link';\n` + next;
      }
    } else {
      next = `import Link from 'next/link';\n` + next;
    }
  }

  return next;
});

/** 4) Best-effort Prettier */
if (edits.length) {
  try {
    execSync(
      `npx --yes prettier -w ${edits.map((f) => JSON.stringify(f)).join(" ")}`,
      { stdio: "ignore" }
    );
  } catch {}
  console.log("Patched files:", edits.length);
} else {
  console.log("No changes needed.");
}
