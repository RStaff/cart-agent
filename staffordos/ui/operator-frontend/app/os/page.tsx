import { WorkspacePage } from "../../components/staffordos/WorkspacePage";
import { sectionByKey } from "../../lib/staffordos/workspaces";

export default function StaffordOsHomePage() {
  return <WorkspacePage section={sectionByKey("home")} />;
}
