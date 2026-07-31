import { WorkspacePage } from "../../../components/staffordos/WorkspacePage";
import { sectionByKey } from "../../../lib/staffordos/workspaces";

export default function WorkPage() {
  return <WorkspacePage section={sectionByKey("work")} />;
}
