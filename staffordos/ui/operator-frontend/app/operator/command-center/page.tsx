import { RossCommandCenterSurface } from "../../../components/operator/RossCommandCenterSurface";
import { loadDashboardSnapshot } from "../../../lib/operator/loadDashboardSnapshot";
import { loadUnitWorkSnapshot } from "../../../lib/operator/loadUnitWorkSnapshot";
import { loadPrimaryActionSnapshot } from "../../../lib/operator/loadPrimaryActionSnapshot";
import { PrimaryActionPanel } from "../../../components/operator/PrimaryActionPanel";
import { UnitWorkSnapshotPanel } from "../../../components/operator/UnitWorkSnapshotPanel";

export default function RossCommandCenterPage() {
  const snapshot = loadDashboardSnapshot();
  const unitWorkSnapshot = loadUnitWorkSnapshot();
  const primaryActionSnapshot = loadPrimaryActionSnapshot();

  return (
    <>
      <PrimaryActionPanel snapshot={primaryActionSnapshot} />
      <details style={{ marginTop: 20 }}>
  <summary style={{ cursor: "pointer", color: "#94a3b8" }}>
    Legacy Command Center (collapsed)
  </summary>
  <RossCommandCenterSurface />
</details>
      
      <main className="shell">
        <div className="container">
          <UnitWorkSnapshotPanel snapshot={unitWorkSnapshot} />
        </div>
      </main>
      <main className="shell">
        <div className="container">
          
        </div>
      </main>
    </>
  );
}
