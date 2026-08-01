import { CapabilityLinkPanel } from "../../../components/staffordos/CapabilityLinkPanel";
import { STAFFORDOS_SECTIONS } from "../../../lib/staffordos/workspaces";
import { capabilitiesForSection } from "../../../lib/staffordos/capabilities";

export default function StaffordOsCapabilitiesPage() {
  return (
    <div className="staffordCapabilityPage">
      <section className="staffordWorkspaceHeader">
        <div>
          <span className="staffordEyebrow">What StaffordOS can do today</span>
          <h1>Capability Map</h1>
          <p>
            Start here when you want to know which current StaffordOS page can help with a decision, customer,
            money, work, evidence, or operating check.
          </p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>Page behavior</span>
          <strong>Read-only links to current pages</strong>
        </div>
      </section>

      <section className="staffordCapabilityNote">
        <strong>No work is moved from this page.</strong>
        <p>
          This map points to existing working pages. It does not copy their data, start actions, contact customers,
          change payments, or change ShopiFixer behavior.
        </p>
      </section>

      {STAFFORDOS_SECTIONS.map((section) => {
        const sectionCapabilities = capabilitiesForSection(section.key);
        if (!sectionCapabilities.length) return null;

        return (
          <CapabilityLinkPanel
            key={section.key}
            sectionKey={section.key}
            heading={section.label}
            intro={section.operatingQuestion}
          />
        );
      })}
    </div>
  );
}
