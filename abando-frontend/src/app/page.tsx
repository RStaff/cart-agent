import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Section from "@/components/Section";
import LogosRow from "@/components/LogosRow";
import InlineDashboard from "@/components/InlineDashboard";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="container py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> New: Live demo checkout
          </div>
          <div className="mt-4 max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Recover abandoned carts with <span className="text-brand-600">AI</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Cart Agent follows up across email, SMS, and chat, brings shoppers back, and grows your revenue automatically.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/trial" className="btn btn-primary" aria-label="Open demo dashboard">Open demo dashboard</Link>
              <a href="#pricing" className="btn btn-ghost" aria-label="See pricing">See pricing</a>
              <Link href="/trial" className="btn btn-ghost" aria-label="Start free trial">Start free trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof logos */}
      <section className="bg-white">
        <div className="container py-6 sm:py-8">
          <div className="text-xs font-medium text-slate-500">Trusted by founders</div>
          <LogosRow />
        </div>
      </section>

      {/* Inline demo dashboard CTA band */}
      <section className="border-y bg-gradient-to-r from-brand-50/50 to-white">
        <div className="container py-10 sm:py-12">
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-baseline">
            <h3 className="text-lg font-semibold">See Abando’s dashboard with sample data in minutes.</h3>
            <div className="flex gap-2">
              <Link href="/trial" className="btn btn-primary">Open demo dashboard</Link>
              <a href="#pricing" className="btn btn-ghost">See pricing</a>
            </div>
          </div>
          <InlineDashboard />
        </div>
      </section>

      <Section eyebrow="Why Abando" title="One-click setup, human outreach, clear ROI.">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { n: "01", t: "One-click setup", d: "Paste one snippet or connect Shopify; we do the rest." },
            { n: "02", t: "Human-like outreach", d: "Brand-safe messages that don’t feel robotic." },
            { n: "03", t: "Transparent ROI", d: "See recovered revenue and reply/conversion breakdowns." },
          ].map(f => (
            <div key={f.n} className="card">
              <div className="card-body">
                <div className="text-xs font-semibold tracking-widest text-brand-600">{f.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{f.t}</h3>
                <p className="mt-2 text-slate-600">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="how" eyebrow="How it works" title="Connect → Engage → Recover">
        <ol className="grid gap-6 sm:grid-cols-3">
          {[
            { t: "Connect", d: "Use our snippet or Shopify app." },
            { t: "Engage", d: "Agent messages warm prospects that left items behind." },
            { t: "Recover", d: "Shoppers return via a personal link; you get paid." },
          ].map((s, i) => (
            <li key={s.t} className="card">
              <div className="card-body">
                <div className="text-xs font-semibold text-brand-600">Step {i + 1}</div>
                <h3 className="mt-2 font-semibold">{s.t}</h3>
                <p className="mt-2 text-slate-600">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="pricing" eyebrow="Simple pricing" title="Start free. Upgrade when you’re ready.">
        <div className="mb-6 flex gap-2 text-sm text-slate-600">
          <span className="inline-flex items-center rounded-full border px-2 py-1">Monthly</span>
          <span className="inline-flex items-center rounded-full border px-2 py-1 bg-brand-50 text-brand-700">Yearly (2 months off)</span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold">Starter</h3>
              <p className="mt-2 text-slate-600">Kick the tires with 20 credits.</p>
              <div className="mt-6 text-3xl font-bold">$0</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>• 20 follow-up credits</li><li>• Email support</li><li>• Demo dashboard</li>
              </ul>
              <Link href="/trial" className="btn btn-ghost mt-6 w-full">Start free trial</Link>
            </div>
          </div>

          <div className="card ring-2 ring-brand-500">
            <div className="card-body">
              <div className="mb-2 inline-block rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">Most popular</div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-2 text-slate-600">Recover more with multi-channel outreach.</p>
              <div className="mt-6 text-3xl font-bold">$299<span className="text-base font-normal text-slate-600">/mo</span></div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>• 2,900 credits / mo</li><li>• Multi-channel outreach</li><li>• Dashboard & export</li><li>• Priority support</li>
              </ul>
              <Link href="/trial" className="btn btn-primary mt-6 w-full">Buy Pro</Link>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold">Scale</h3>
              <p className="mt-2 text-slate-600">Higher limits & success manager.</p>
              <div className="mt-6 text-3xl font-bold">Talk to us</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>• Custom seats & limits</li><li>• Dedicated success</li><li>• SSO & security review</li>
              </ul>
              <a href="mailto:sales@abando.ai" className="btn btn-ghost mt-6 w-full">Contact sales</a>
            </div>
          </div>
        </div>
      </Section>

      <Section eyebrow="Proof" title="What founders are saying">
        <Testimonials />
      </Section>

      <Footer />
    </>
  );
}
