import { WorkspacePage } from "../../../components/staffordos/WorkspacePage";
import { sectionByKey } from "../../../lib/staffordos/workspaces";

export default function GovernancePage() {
  return <WorkspacePage section={sectionByKey("governance")} />;
}
