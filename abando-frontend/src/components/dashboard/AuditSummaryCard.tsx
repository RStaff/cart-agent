type MerchantSnapshot = {
  store_domain: string;
  audit_score: number;
  estimated_revenue_leak: string;
  confidence: string;
  top_issue: string;
};

export default function AuditSummaryCard({ snapshot }: { snapshot: MerchantSnapshot }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Audit Summary</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Current audit posture</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InfoItem label="Store domain" value={snapshot.store_domain} />
        <InfoItem label="Audit score" value={String(snapshot.audit_score)} />
        <InfoItem label="Estimated revenue leak" value={snapshot.estimated_revenue_leak} />
        <InfoItem label="Confidence" value={snapshot.confidence} />
        <InfoItem label="Top issue" value={snapshot.top_issue} />
      </div>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}
