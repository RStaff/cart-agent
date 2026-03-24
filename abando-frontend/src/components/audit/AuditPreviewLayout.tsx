import AuditPreviewCard from "./AuditPreviewCard";

type AuditPreviewData = {
  store_id: string;
  store_domain: string;
  estimated_revenue_leak: string;
  primary_issue: string;
  benchmark_label: string;
  confidence: string;
  install_cta_label: string;
  created_at: string;
};

export default function AuditPreviewLayout({
  preview,
  screenshotMode = false,
}: {
  preview: AuditPreviewData;
  screenshotMode?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_25%),linear-gradient(180deg,#020617,#020617)] px-6 py-8 text-slate-100 md:px-8">
      <div className={`mx-auto ${screenshotMode ? "max-w-[1600px]" : "max-w-6xl"}`}>
        <div className={screenshotMode ? "aspect-[16/9] w-full overflow-hidden" : ""}>
          <div className={screenshotMode ? "flex h-full items-center justify-center" : ""}>
            <div className={screenshotMode ? "w-full max-w-[1360px] scale-[0.935] origin-top" : ""}>
              <AuditPreviewCard preview={preview} screenshotMode={screenshotMode} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
