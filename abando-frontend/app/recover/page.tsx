type RecoverPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

function normalizeShop(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

export default async function RecoverPage({ searchParams }: RecoverPageProps) {
  const params = (await searchParams) || {};
  const shop = normalizeShop(firstValue(params.shop));
  const experienceId = firstValue(params.eid).trim();
  const storefrontUrl = shop ? `https://${shop}/` : "https://app.abando.ai/";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-14 text-slate-50">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[28px] border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/40">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Recovery</p>
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-white">You left something behind</h1>
          <p className="mb-4 text-lg leading-8 text-slate-200">
            Your recovery link is active. We routed you to a controlled Abando page because this checkout was
            created from a debug or synthetic recovery flow.
          </p>
          <p className="mb-8 max-w-2xl text-base leading-7 text-slate-400">
            Use the button below to continue to the storefront and restart the journey from a real checkout
            context.
          </p>
          <a
            href={storefrontUrl}
            className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Return to store
          </a>
          <div className="mt-8 text-sm leading-7 text-slate-500">
            <div>Shop: {shop || "Unknown"}</div>
            <div>Experience: {experienceId || "Unavailable"}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
