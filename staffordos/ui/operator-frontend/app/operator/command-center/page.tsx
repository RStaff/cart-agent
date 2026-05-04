import { ActionFirstDashboard } from "../../../components/operator/ActionFirstDashboard";
import { loadDashboardSnapshot } from "../../../lib/operator/loadDashboardSnapshot";

export default function RossCommandCenterPage() {
  const snapshot = loadDashboardSnapshot();
  return <ActionFirstDashboard snapshot={snapshot} />;
}
