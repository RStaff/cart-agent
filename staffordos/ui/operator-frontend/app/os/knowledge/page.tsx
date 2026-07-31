import { WorkspacePage } from "../../../components/staffordos/WorkspacePage";
import { sectionByKey } from "../../../lib/staffordos/workspaces";

export default function KnowledgePage() {
  return <WorkspacePage section={sectionByKey("knowledge")} />;
}
