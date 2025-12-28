export default function SupplementsPlaybookPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <section className="w-full max-w-4xl mx-auto py-12 px-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-emerald-400 mb-3">
          PLAYBOOK · SUPPLEMENTS & WELLNESS
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">
          3 plays to recover supplement revenue, safely.
        </h1>

        <p className="text-sm text-slate-300 mb-8">
          These plays are designed to recover more orders while staying aligned
          to your approved claims. Messaging is always editable and can be
          locked to your compliance rules.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-emerald-400 mb-1">PLAY 1 · FIRST ORDER SAVE</h4>
            <h3 className="font-semibold mb-2">Abandoned first purchase</h3>
            <p className="text-xs text-slate-300">
              Nudge shoppers who added a product but bounced before their first
              order.
            </p>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-emerald-400 mb-1">PLAY 2 · SUBSCRIPTION NUDGE</h4>
            <h3 className="font-semibold mb-2">From one-time to subscription</h3>
            <p className="text-xs text-slate-300">
              Encourage one-time buyers to start a subscription with clear,
              non-medical benefits language.
            </p>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-emerald-400 mb-1">PLAY 3 · BUNDLE COMPLETION</h4>
            <h3 className="font-semibold mb-2">Routine completion</h3>
            <p className="text-xs text-slate-300">
              Suggest complementary products to complete a daily routine without
              over-promising results.
            </p>
          </div>
        </div>

        <section className="mt-8 p-6 bg-slate-900/40 border border-slate-700 rounded-xl">
          <h3 className="font-semibold mb-3">How this connects inside Abando</h3>
          <p className="text-sm text-slate-300 mb-4">
            Each play corresponds to a configurable flow in Abando. You can
            limit wording, channels, and targeting to match your compliance
            playbook.
          </p>

          <a
            href="/marketing/demo/playground"
            className="inline-block bg-emerald-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-emerald-300"
          >
            View live demo
          </a>
        </section>
      </section>
    </main>
  );
}
