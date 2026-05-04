import { RossCommandCenterSurface } from "../../../components/operator/RossCommandCenterSurface";
import { ActionFirstDashboard } from "../../../components/operator/ActionFirstDashboard";
import { LeadQueue } from "../../../components/operator/LeadQueue";
import { loadDashboardSnapshot } from "../../../lib/operator/loadDashboardSnapshot";

export default function RossCommandCenterPage() {
  const snapshot = loadDashboardSnapshot();

  return (
    <>
      <RossCommandCenterSurface />
      <ActionFirstDashboard snapshot={snapshot} />
      <main className="shell">
        <div className="container">
          <LeadQueue />
        </div>
      </main>
    </>
  );
}
