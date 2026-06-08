import { OperatorHomeV1 } from "../../../components/operator/OperatorHomeV1";
import { loadPrimaryActionSnapshot } from "../../../lib/operator/loadPrimaryActionSnapshot";
import { loadPreflightReport } from "../../../lib/operator/loadPreflightReport";
import { loadCommandCenterQaReport } from "../../../lib/operator/loadCommandCenterQaReport";
import { loadUnitWorkSnapshot } from "../../../lib/operator/loadUnitWorkSnapshot";

export default async function RossCommandCenterPage() {
  const primaryActionSnapshot = await loadPrimaryActionSnapshot();
  const preflightReport = loadPreflightReport();
  const qaReport = loadCommandCenterQaReport();
  const unitWorkSnapshot = loadUnitWorkSnapshot();

  return (
    <OperatorHomeV1
      primaryActionSnapshot={primaryActionSnapshot}
      preflightReport={preflightReport}
      qaReport={qaReport}
      unitWorkSnapshot={unitWorkSnapshot}
    />
  );
}
