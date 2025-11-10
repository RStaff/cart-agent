export const dynamic = 'error'; // keep static

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-slate-100">
      <h1 className="text-3xl font-bold mb-4">Onboarding</h1>
      <p className="mb-6 text-slate-300">Get started in 3 minutes.</p>

      <ol className="space-y-4 list-decimal pl-6">
        <li>Click <a className="underline" href="/trial">Start Free Trial</a> to begin a 14-day trial.</li>
        <li>Install the store snippet (or Shopify app) shown after checkout.</li>
        <li>Pick a playbook (returns, shipping, urgency) and go live.</li>
      </ol>

      <div className="mt-8 flex gap-3">
        <a href="/trial" className="wolf-btn-primary" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',height:40,padding:'0 16px',borderRadius:10,fontWeight:600,textDecoration:'none'}}>Start Free Trial</a>
        <a href="/demo/playground" className="wolf-btn-ghost" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',height:40,padding:'0 16px',borderRadius:10,fontWeight:600,textDecoration:'none',border:'1px solid rgba(198,205,255,.35)'}}>Open demo</a>
      </div>
    </main>
  );
}
