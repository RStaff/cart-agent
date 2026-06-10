import { redirect } from "next/navigation";
import { OperatorHomeV1 } from "../../../components/operator/OperatorHomeV1";
import { loadPrimaryActionSnapshot } from "../../../lib/operator/loadPrimaryActionSnapshot";
import { loadPreflightReport } from "../../../lib/operator/loadPreflightReport";
import { loadCommandCenterQaReport } from "../../../lib/operator/loadCommandCenterQaReport";
import { loadUnitWorkSnapshot } from "../../../lib/operator/loadUnitWorkSnapshot";
import { loadShopifixerCommandCenter } from "../../../lib/operator/loadShopifixerCommandCenter";
import { writeShopifixerBeforeEvidence } from "../../../lib/operator/writeShopifixerBeforeEvidence";

type RossCommandCenterPageProps = {
  searchParams?: {
    shopifixer_before_saved?: string;
  };
};

export default async function RossCommandCenterPage({ searchParams }: RossCommandCenterPageProps) {
  const primaryActionSnapshot = await loadPrimaryActionSnapshot();
  const preflightReport = loadPreflightReport();
  const qaReport = loadCommandCenterQaReport();
  const unitWorkSnapshot = loadUnitWorkSnapshot();
  const shopifixerCommandCenter = loadShopifixerCommandCenter();
  const beforeEvidenceSaved = searchParams?.shopifixer_before_saved === "1";
  const beforeEvidenceDate = new Date().toISOString().slice(0, 10);

  async function captureBeforeEvidence(formData: FormData) {
    "use server";

    const store = String(formData.get("store") || shopifixerCommandCenter.merchant?.store || "unavailable");
    const date = String(formData.get("date") || beforeEvidenceDate);
    const affected_page_or_artifact = String(formData.get("affected_page_or_artifact") || "");
    const issue = String(formData.get("issue") || "");
    const why_it_matters = String(formData.get("why_it_matters") || "");
    const screenshot = String(formData.get("screenshot") || "");
    const notes = String(formData.get("notes") || "");

    writeShopifixerBeforeEvidence({
      store,
      date,
      affected_page_or_artifact,
      issue,
      why_it_matters,
      screenshot,
      notes
    });

    redirect("/operator/command-center?shopifixer_before_saved=1");
  }

  return (
    <OperatorHomeV1
      primaryActionSnapshot={primaryActionSnapshot}
      preflightReport={preflightReport}
      qaReport={qaReport}
      unitWorkSnapshot={unitWorkSnapshot}
      shopifixerCommandCenter={shopifixerCommandCenter}
      beforeEvidenceAction={captureBeforeEvidence}
      beforeEvidenceSaved={beforeEvidenceSaved}
      beforeEvidenceDate={beforeEvidenceDate}
    />
  );
}
