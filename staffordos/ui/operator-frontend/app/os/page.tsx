import { CapabilityLinkPanel } from "../../components/staffordos/CapabilityLinkPanel";
import { WorkspacePage } from "../../components/staffordos/WorkspacePage";
import { sectionByKey } from "../../lib/staffordos/workspaces";

export default function StaffordOsHomePage() {
  return (
    <WorkspacePage section={sectionByKey("home")}>
      <CapabilityLinkPanel
        limit={3}
        heading="What StaffordOS can help with right now"
        intro="Open the current working pages from one plain-language map."
        showMapLink
      />
    </WorkspacePage>
  );
}
