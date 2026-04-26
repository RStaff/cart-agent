import fs from "fs";

const target = "abando-frontend/app/shopifixer/page.tsx";
const backup = `${target}.bak.${Date.now()}`;

fs.copyFileSync(target, backup);

const page = `const cards = [
  {
    eyebrow: "DIAGNOSE",
    title: "Find the clearest leak",
    body: "ShopiFixer identifies the strongest conversion issue first, with evidence and a practical next step."
  },
  {
    eyebrow: "FIX",
    title: "Implement the highest-impact move",
    body: "Stafford Media turns the audit into a focused fix instead of a vague redesign or endless retainer."
  },
  {
    eyebrow: "RECOVER",
    title: "Turn the fix into revenue",
    body: "Once the blocker is clear, Abando can help recover revenue from shoppers who still hesitate or leave."
  }
];

const auditFindings = [
  "Checkout friction",
  "Trust gap",
  "Mobile CTA weakness",
  "Recovery path missing"
];

export default function ShopiFixerPage() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 shadow-2xl lg:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-yellow-300">
            A Stafford Media Consulting Service
          </p>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400 text-3xl">
                  🛍️
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight">
                    Shopi<span className="text-lime-400">Fixer</span>™
                  </p>
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
                    Conversion Leak Audit
                  </p>
                </div>
              </div>

              <h1 className="max-w-4xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Find the clearest conversion leak in your store.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
                ShopiFixer is a service-led audit built to surface the strongest issue first, show the evidence behind the read, and make the next fix obvious.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#run-audit"
                  className="rounded-2xl bg-yellow-300 px-7 py-4 text-center font-bold text-black shadow-lg shadow-yellow-300/20 transition hover:bg-yellow-200"
                >
                  Run ShopiFixer Audit
                </a>
                <a
                  href="#example"
                  className="rounded-2xl border border-white/15 px-7 py-4 text-center font-bold text-white transition hover:bg-white/10"
                >
                  View Example Audit
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/30 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
                Example Read
              </p>
              <h2 className="mt-4 text-2xl font-black">Revenue Leak Map</h2>
              <div className="mt-6 space-y-4">
                {auditFindings.map((item, index) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{item}</p>
                      <span className="rounded-full bg-yellow-300/15 px-3 py-1 text-xs font-bold text-yellow-200">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-lime-400" style={{ width: \`\${85 - index * 13}%\` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
            How it works
          </p>
          <h2 className="mt-4 text-3xl font-black">
            Diagnose the issue. Fix the blocker. Recover the revenue.
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {cards.map((card) => (
              <div key={card.title} className="rounded-3xl border border-white/10 bg-black/25 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
                  {card.eyebrow}
                </p>
                <h3 className="mt-4 text-xl font-black">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="run-audit" className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-yellow-300">
              Run the audit
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none" placeholder="your-store.com" />
              <input className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none" placeholder="you@store.com" />
            </div>
            <button className="mt-5 rounded-2xl bg-yellow-300 px-7 py-4 font-bold text-black">
              Run ShopiFixer Audit
            </button>
          </div>

          <div id="example" className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              What the read should do
            </p>
            <div className="mt-6 space-y-4">
              {[
                "Frame the issue with evidence",
                "Estimate the upside of fixing it",
                "Recommend the first practical move",
                "Separate audit, implementation, and recovery"
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/25 p-5 font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
            What comes next
          </p>
          <h2 className="mt-4 text-3xl font-black">Abando</h2>
          <p className="mt-4 max-w-3xl text-zinc-300">
            Once the top issue is clear, Abando helps recover revenue automatically across shoppers who still hesitate or leave.
          </p>
          <a href="/abando" className="mt-6 inline-flex rounded-2xl border border-white/15 px-6 py-3 font-bold hover:bg-white/10">
            See Recovery System
          </a>
        </section>
      </section>
    </main>
  );
}
`;

fs.writeFileSync(target, page);

console.log(JSON.stringify({
  ok: true,
  updated: target,
  backup
}, null, 2));
