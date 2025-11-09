export default async function Onboarding(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {


    const searchParams = await props.searchParams as Record<string, string | string[] | undefined>;
  const _one = <T,>(v: T | T[] | undefined): T | undefined => Array.isArray(v) ? v[0] : v;
const plan = String(_one(searchParams?.plan) ?? "basic").toLowerCase();
  const trialRaw = String(_one(searchParams?.trial) ?? "").toLowerCase();
  const isTrial = trialRaw === "1" || trialRaw === "true" || trialRaw === "yes";
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-100">
      {isTrial && (
        <div className="rounded-md bg-slate-800/40 border border-slate-700 px-4 py-3 text-sm mb-6">
          You’re in <strong>demo mode</strong>. Add Stripe keys in Settings to go live.
        </div>
      )}
      <h1 className="text-2xl font-semibold">Onboarding</h1>
      <div className="mt-4 rounded-md border border-slate-700 p-4">
        <div className="text-sm opacity-80">Plan:</div>
        <div className="mt-1 font-semibold capitalize">{plan}</div>
      </div>
      <div className="mt-6 flex gap-3">
        <a href="/dashboard" className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">Dashboard →</a>
        <a href="/demo/playground" className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600">Demo playground →</a>
        <a href="/pricing" className="rounded-md bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700">See plans</a>
      </div>
    </main>
  );
}
