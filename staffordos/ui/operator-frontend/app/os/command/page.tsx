import { WorkspacePage } from "../../../components/staffordos/WorkspacePage";
import { sectionByKey } from "../../../lib/staffordos/workspaces";

export default function CommandPage() {
  return <WorkspacePage section={sectionByKey("command")} />;
}
