type LatestSignal = {
  title: string;
  timestamp: string;
  summary: string;
};

export default function LatestSignalCard({ signal }: { signal: LatestSignal }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/20">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Latest Signal</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{signal.title}</h2>
        <p className="mt-2 text-sm text-slate-500">{signal.timestamp}</p>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-300">{signal.summary}</p>
    </section>
  );
}
