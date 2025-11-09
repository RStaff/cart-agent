export default function Page() {
  const basic = process.env.NEXT_PUBLIC_PRICE_BASIC || "29";
  const pro   = process.env.NEXT_PUBLIC_PRICE_PRO   || "79";
  const missing = !process.env.NEXT_PUBLIC_PRICE_BASIC || !process.env.NEXT_PUBLIC_PRICE_PRO || !process.env.STRIPE_SECRET_KEY;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 text-slate-100">
      <h1 className="text-3xl font-bold mb-6">Pricing</h1>
      {missing && (
        <div className="mb-6 rounded-md bg-yellow-900/30 border border-yellow-700 px-4 py-3 text-sm">
          Billing is in demo mode until Stripe env vars are set.
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-slate-900/40 p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-2">Basic</h2>
          <p className="text-3xl font-bold">${basic}/mo</p>
        </div>
        <div className="rounded-xl bg-slate-900/40 p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-2">Pro</h2>
          <p className="text-3xl font-bold">${pro}/mo</p>
        </div>
      </div>
    </main>
  );
}
