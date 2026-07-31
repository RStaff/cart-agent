import { WorkspacePage } from "../../../components/staffordos/WorkspacePage";
import { sectionByKey } from "../../../lib/staffordos/workspaces";

export default function SystemPage() {
  return <WorkspacePage section={sectionByKey("system")} />;
}
