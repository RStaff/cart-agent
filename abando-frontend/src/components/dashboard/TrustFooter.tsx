export default function TrustFooter({ embedded = false }: { embedded?: boolean }) {
  return (
    <section className={`rounded-2xl p-5 ${embedded ? "border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]" : "border border-white/10 bg-[#0f172a]"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Trust boundary</p>
      <h3 className={`mt-2 text-2xl font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-white"}`}>How Abando reports this</h3>
      <p className={`mt-4 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
        Abando combines tracked store behavior with benchmark context. Early signals may strengthen, soften, or change as more checkout activity is collected.
      </p>
    </section>
  );
}
