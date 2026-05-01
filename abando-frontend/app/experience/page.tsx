type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined, fallback = "") {
  return Array.isArray(value) ? value[0] || fallback : value || fallback;
}

export default async function ExperiencePage({ searchParams }: PageProps) {
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

        <p className="text-center text-sm font-bold text-slate-300">
          Recover lost revenue automatically.
        </p>

        <h1 className="mt-2 text-center text-[42px] font-black leading-[0.95] tracking-[-0.05em]">
          Connected to your store
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-center text-base font-semibold leading-7 text-slate-300">
          Send a recovery to yourself and watch the loop complete.
        </p>

        <p className="mt-2 text-center text-sm font-bold text-slate-400">
          {shop}
        </p>

        <div className="mt-6 grid grid-cols-4 gap-2">
          {[
            ["✓", "Connected"],
            ["2", "Recovery sent"],
            ["3", "Return detected"],
            ["4", "Paid plan"],
          ].map(([num, label], index) => (
            <div
              key={label}
              className={`rounded-2xl border px-3 py-4 text-center ${
                index === 0
                  ? "border-cyan-300/40 bg-cyan-300/10"
                  : "border-white/10 bg-slate-950/40"
              }`}
            >
              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-xs font-black">
                {num}
              </div>
              <p className="mt-2 text-[11px] font-black leading-4 text-slate-200">{label}</p>
            </div>
          ))}
        </div>

        <form action="/api/recovery-actions/send-live-test" method="POST" className="mt-7">
          <input type="hidden" name="shop" value={shop} />
          <input type="hidden" name="experienceId" value={eid} />
          <input type="hidden" name="channel" value="email" />

          <label className="text-sm font-black text-white">Send a recovery to yourself</label>

          <input
            name="email"
            type="email"
            placeholder="Enter your email or phone"
            className="mt-3 w-full rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
          />

          <button className="mt-4 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-200">
            Send recovery to myself
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-black text-white">Proof loop ready</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
            Abando is connected. The next step proves the recovery system can send a real message, create a return link, and attribute revenue back to this run.
          </p>
        </div>

        <p className="mt-5 text-center text-xs font-semibold text-slate-500">
          Questions? hello@abando.ai
        </p>
      </section>
    </main>
  );
}
