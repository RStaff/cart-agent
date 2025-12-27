import Image from "next/image";

export default function ReviewEmbeddedPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* Top bar (Shopify-ish) */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div><Image src="/abando-logo.inline.png" alt="Abando logo" width={32} height={32} /></div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">Abando Dashboard</div>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/70 ring-1 ring-white/10">
                  Review demo
                </span>
              </div>
              <div className="text-xs text-white/55">
                Embedded insights designed to live inside your Shopify admin.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-white/50">
              Example data (for review)
            </span>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200 ring-1 ring-emerald-400/25">
              Safe demo view
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Hero */}
        <section className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              Turn checkout hesitation into{" "}
              <span className="text-emerald-200">actionable follow-ups</span> — inside Shopify.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
              Abando helps merchants understand <span className="text-white/85">why shoppers pause</span>,
              so you can respond with the right follow-up at the right moment—without manually digging through sessions.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
                Built for embedded Shopify admin workflows
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
                Clarity, not noise
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
                Example content only (review-safe)
              </span>
            </div>

            <div className="mt-8 grid gap-3">
              <FeatureLine
                title="Hesitation patterns"
                desc="Group sessions into clear behavioral buckets (e.g., sizing uncertainty, timing delay, price friction)."
              />
              <FeatureLine
                title="Suggested responses by hesitation type"
                desc="Surface what kind of follow-up fits the hesitation type—without rewriting your whole marketing stack."
              />
              <FeatureLine
                title="Embedded-first dashboard"
                desc="Designed to be readable in an embedded context: low clutter, high signal."
              />
            </div>

            <div className="mt-6 text-xs text-white/45">
              Note: This page intentionally displays example content only. Real insights appear after installation and real store activity.
            </div>
          </div>

          {/* Reviewer box */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <div className="text-sm font-semibold">What the reviewer should notice</div>
              <ul className="mt-3 space-y-3 text-sm text-white/70">
                <li className="flex gap-3">
                  <Dot />
                  <span>
                    The dashboard is readable in an embedded context (low clutter, clear hierarchy).
                  </span>
                </li>
                <li className="flex gap-3">
                  <Dot />
                  <span>
                    No unsubstantiated performance claims, statistics, or customer testimonials are shown.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Dot />
                  <span>
                    Language is outcome-oriented (reduce hesitation) without quoting specific results.
                  </span>
                </li>
              </ul>

              <div className="mt-5 rounded-xl bg-[#070B18] p-4 ring-1 ring-white/10">
                <div className="text-xs font-semibold text-white/75">Where this appears</div>
                <div className="mt-2 text-xs text-white/55 leading-relaxed">
                  This is a review-safe embedded demo route. In production, merchants access Abando inside Shopify admin after installation.
                </div>
                <div className="mt-3">
                  <a
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-400/15 px-4 py-2 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/25 hover:bg-emerald-400/20"
                    href="/embedded/review"
                  >
                    Refresh this embedded demo
                  </a>
                </div>
              </div>
            </div>

            {/* Mini KPI-style cards, but compliant (no numbers) */}
            <div className="mt-6 grid gap-4">
              <KpiCard
                title="Checkout sessions identified"
                desc="Surface moments where a shopper paused long enough to signal uncertainty."
              />
              <KpiCard
                title="Hesitation categories"
                desc="Organize behavior into clear reasons—so follow-ups can match intent."
              />
              <KpiCard
                title="Embedded admin insights"
                desc="Keep the workflow inside Shopify admin—no tab chaos, no manual hunting."
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureLine({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-sm text-white/65 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

function KpiCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-[#070B18] ring-1 ring-white/10 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm text-white/70 leading-relaxed">{desc}</div>
      <div className="mt-4 text-xs text-white/45">
        Example view • Real activity populates after install
      </div>
    </div>
  );
}

function Dot() {
  return <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-300/70 flex-none" />;
}
