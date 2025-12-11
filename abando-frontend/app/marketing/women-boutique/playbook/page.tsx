export default function BoutiquePlaybookPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <section className="w-full max-w-4xl mx-auto py-12 px-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-pink-400 mb-3">
          PLAYBOOK · WOMEN’S BOUTIQUE APPAREL
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">
          3 plays to recover boutique revenue with Abando.
        </h1>

        <p className="text-sm text-slate-300 mb-8">
          These are the starter flows we use with boutique merchants. You can
          rename, edit tone, or turn plays on/off once Abando is live in your
          store.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-pink-400 mb-1">PLAY 1 · FIT CHECK</h4>
            <h3 className="font-semibold mb-2">Abandoned “try-on” cart</h3>
            <p className="text-xs text-slate-300">
              Nudge shoppers who added multiple sizes/colors but never
              checked out.
            </p>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-pink-400 mb-1">PLAY 2 · COMPLETE THE LOOK</h4>
            <h3 className="font-semibold mb-2">Outfit completion</h3>
            <p className="text-xs text-slate-300">
              Recommend items that match what was left in the cart—top, bottom,
              accessories.
            </p>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-pink-400 mb-1">PLAY 3 · LAUNCH DROP SAVE</h4>
            <h3 className="font-semibold mb-2">Drop launch follow-up</h3>
            <p className="text-xs text-slate-300">
              For limited drops, follow up with “your size is still here”
              messaging.
            </p>
          </div>
        </div>

        <section className="mt-8 p-6 bg-slate-900/40 border border-slate-700 rounded-xl">
          <h3 className="font-semibold mb-3">How this connects inside Abando</h3>
          <p className="text-sm text-slate-300 mb-4">
            Each play becomes a configurable flow in Abando. You choose tone,
            channels (email/SMS), and when each play fires.
          </p>

          <a
            href="/demo/playground"
            className="inline-block bg-pink-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-pink-400"
          >
            View live demo
          </a>
        </section>
      </section>
    </main>
  );
}
