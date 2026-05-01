type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined, fallback = "") {
  return Array.isArray(value) ? value[0] || fallback : value || fallback;
}

export default async function ReturnedPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const shop = first(params.shop, "mvp-recovery-proof.myshopify.com");
  const eid = first(params.eid, "proof-audit-1");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_32%),linear-gradient(180deg,#07111f_0%,#020617_100%)] px-5 py-10 text-white">
      <section className="mx-auto max-w-[560px] rounded-[34px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur">
        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <img src="/brand/abando-logo-transparent.png" alt="Abando" className="h-6 w-6" />
          <span className="text-sm font-black tracking-wide">Abando™</span>
        </div>

        <h1 className="text-center text-[44px] font-black leading-[0.95] tracking-[-0.05em]">
          Return detected
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-center text-base font-semibold leading-7 text-slate-200">
          Abando caught the return and attributed the recovered revenue to this proof run.
        </p>

        <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Recovered revenue
          </p>
          <p className="mt-1 text-5xl font-black text-white">$52</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
            This is the amount this return put back in play through the recovery flow you just verified.
          </p>
        </div>

        <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Billing status
          </p>
          <p className="mt-2 text-sm font-black text-white">Paid plan available</p>
        </div>

        <a
          href="/pricing"
          className="mt-5 inline-flex w-full justify-center rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-200"
        >
          Start paid plan
        </a>

        <a
          href={`/experience?shop=${encodeURIComponent(shop)}&eid=${encodeURIComponent(eid)}`}
          className="mt-3 inline-flex w-full justify-center rounded-2xl border border-white/15 px-5 py-4 text-sm font-black text-white transition hover:bg-white/5"
        >
          Back to onboarding
        </a>

        <p className="mt-5 text-center text-xs font-semibold text-slate-500">
          Questions? hello@abando.ai
        </p>
      </section>
    </main>
  );
}
