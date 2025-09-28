// Server Component
import fs from "node:fs";
import path from "node:path";

export const metadata = {
  title: "Abando – AI Shopping Copilot (V2 snapshot)",
  robots: { index: false, follow: false }, // keep snapshots out of SEO
};

function readLatestBody() {
  const base = path.join(process.cwd(), "public", "prod-landing");
  const files = fs.readdirSync(base).filter(f => /^body-\d{8}-\d{6}\.html$/.test(f));
  if (!files.length) return "<div style='padding:2rem;color:#f33'>No snapshot body found.</div>";
  files.sort(); // chronological; last is newest
  return fs.readFileSync(path.join(base, files[files.length - 1]), "utf8");
}

export default function Page() {
  const html = readLatestBody();
  return (
    <main
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
