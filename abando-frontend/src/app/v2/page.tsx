import NavbarV2 from "@/components/NavbarV2";
export default function V2(){
  return (<>
    <NavbarV2/>
    <section className="relative overflow-hidden bg-[#0B1220] text-slate-100">
      <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 shadow-sm">New • 14-day free trial</span>
        <div className="mt-4 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Recover more checkouts with your AI Shopping Copilot</h1>
          <p className="mt-4 text-lg text-slate-300">Abando<sup>™</sup> answers questions, handles objections, and guides buyers through checkout—so abandonment turns into orders.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/onboarding" className="btn btn-primary">Start Free Trial</a>
            <a href="/demo/playground" className="btn btn-ghost text-slate-100/90 hover:text-slate-100">Try the Demo</a>
          </div>
        </div>
      </div>
    </section>
    <section className="bg-[#0B1220] text-slate-300"><div className="container mx-auto max-w-6xl px-4 py-8"><div className="text-sm opacity-75">Trusted by founders</div><div className="mt-3 h-px w-full bg-white/10"/></div></section>
  </>);
}
