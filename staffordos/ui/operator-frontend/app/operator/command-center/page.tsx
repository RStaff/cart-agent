import { RossCommandCenterSurface } from "../../../components/operator/RossCommandCenterSurface";
import { ActionFirstDashboard } from "../../../components/operator/ActionFirstDashboard";
import { LeadQueue } from "../../../components/operator/LeadQueue";
import { loadDashboardSnapshot } from "../../../lib/operator/loadDashboardSnapshot";
import { loadUnitWorkSnapshot } from "../../../lib/operator/loadUnitWorkSnapshot";
import { UnitWorkSnapshotPanel } from "../../../components/operator/UnitWorkSnapshotPanel";

export default function RossCommandCenterPage() {
  const snapshot = loadDashboardSnapshot();
  const unitWorkSnapshot = loadUnitWorkSnapshot();

  return (
    <>
      <RossCommandCenterSurface />
      <ActionFirstDashboard snapshot={snapshot} />
      <main className="shell">
        <div className="container">
          <UnitWorkSnapshotPanel snapshot={unitWorkSnapshot} />
        </div>
      </main>
      <main className="shell">
        <div className="container">
          <LeadQueue />
        </div>
      </main>
    </>
  );
}
