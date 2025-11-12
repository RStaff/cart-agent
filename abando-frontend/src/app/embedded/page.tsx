export const dynamic = "force-static";
export default function EmbeddedApp() {
  return (
    <main className="mx-auto max-w-2xl p-6 text-slate-200">
      <h1 className="text-2xl font-semibold">Abando App</h1>
      <p className="mt-2 text-sm opacity-80">Embedded app shell ready. Served at <code>/embedded</code>.</p>
    </main>
  );
}
