import fs from "fs";
import path from "path";
import { safeWrite } from "../lib/safe_write_v1.mjs";

const candidates = [
  "apps/website/src/app/shopifixer/page.tsx",
  "src/app/shopifixer/page.tsx",
  "web/src/app/shopifixer/page.tsx",
  "app/shopifixer/page.tsx"
];

const siteFile = candidates.find((p) => fs.existsSync(p));

if (!siteFile) {
  console.error("❌ Could not find ShopiFixer page. Checked:");
  console.error(candidates.join("\n"));
  process.exit(1);
}

const packetPath = "staffordos/packets/conversion_upgrade_packet_v2.json";
const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));

const backupPath = `${siteFile}.bak.${Date.now()}`;
fs.copyFileSync(siteFile, backupPath);

const page = `export default function ShopiFixerPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300">
              ShopiFixer by Stafford Media Consulting
            </p>

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
              ${packet.headline}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              ${packet.subhead}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:ross@staffordmedia.ai?subject=ShopiFixer%20Store%20Scan"
                className="rounded-xl bg-emerald-400 px-6 py-4 text-center font-semibold text-black transition hover:bg-emerald-300"
              >
                ${packet.primary_cta}
              </a>
              <a
                href="#example-output"
                className="rounded-xl border border-white/15 px-6 py-4 text-center font-semibold text-white transition hover:bg-white/10"
              >
                ${packet.secondary_cta}
              </a>
            </div>

            <p className="mt-5 text-sm text-zinc-400">
              ${packet.trust_line}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
            <div className="rounded-2xl bg-black p-5">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-300">Store Scan</span>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">
                  Revenue Leak Map
                </span>
              </div>

              <div className="space-y-3">
                {[
                  "Checkout friction detected",
                  "Trust gap on product page",
                  "Recovery path missing",
                  "Mobile CTA unclear"
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-zinc-300">{item}</p>
                    <div className="mt-3 h-2 rounded-full bg-zinc-800">
                      <div className="h-2 w-2/3 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            ["Find the leaks", "Identify the UX, checkout, and trust issues quietly reducing conversion."],
            ["Prioritize the first fix", "Stop guessing. See the highest-leverage improvement first."],
            ["Move toward revenue", "Turn audit findings into concrete actions you can approve and execute."]
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{body}</p>
            </div>
          ))}
        </section>

        <section id="example-output" className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Example Output
          </p>
          <h2 className="mt-3 text-3xl font-bold">${packet.example_output.title}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            ${packet.example_output.items.map((item) => `
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-zinc-200">
              ${item}
            </div>`).join("")}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-8 text-center">
          <h2 className="text-3xl font-bold">Ready to see what your store is leaking?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-300">
            Start with one clear scan. No bloated redesign. No vague report. Just the first revenue fix.
          </p>
          <a
            href="mailto:ross@staffordmedia.ai?subject=ShopiFixer%20Store%20Scan"
            className="mt-8 inline-flex rounded-xl bg-emerald-400 px-6 py-4 font-semibold text-black transition hover:bg-emerald-300"
          >
            ${packet.primary_cta}
          </a>
        </section>
      </section>
    </main>
  );
}
`;

safeWrite(siteFile, page);

console.log(JSON.stringify({
  ok: true,
  agent: "apply_shopifixer_conversion_v2",
  updated: siteFile,
  backup: backupPath,
  packet: packetPath
}, null, 2));
