import { WorkspacePage } from "../../../components/staffordos/WorkspacePage";
import { sectionByKey } from "../../../lib/staffordos/workspaces";

export default function PipelinePage() {
  return <WorkspacePage section={sectionByKey("pipeline")} />;
}
