import Link from "next/link";
import {
  ACCESS_LABELS,
  AUTHORITY_LABELS,
  AVAILABILITY_LABELS,
  STAFFORDOS_CAPABILITIES,
  capabilitiesForSection,
  type StaffordOsCapability,
} from "../../lib/staffordos/capabilities";
import type { StaffordOsSectionKey } from "../../lib/staffordos/workspaces";

type CapabilityLinkPanelProps = {
  sectionKey?: StaffordOsSectionKey;
  limit?: number;
  heading?: string;
  intro?: string;
  showMapLink?: boolean;
};

function visibleCapabilities(sectionKey?: StaffordOsSectionKey, limit?: number) {
  const capabilities = sectionKey ? capabilitiesForSection(sectionKey) : STAFFORDOS_CAPABILITIES;
  return typeof limit === "number" ? capabilities.slice(0, limit) : capabilities;
}

function CapabilityCard({ capability }: { capability: StaffordOsCapability }) {
  return (
    <article className="staffordCapabilityCard">
      <div className="staffordCapabilityMeta">
        <span>{AVAILABILITY_LABELS[capability.availability]}</span>
        <span>{ACCESS_LABELS[capability.access]}</span>
      </div>

      <h3>{capability.title}</h3>
      <p>{capability.description}</p>

      <dl className="staffordCapabilityFacts">
        <div>
          <dt>Question answered</dt>
          <dd>{capability.operatorQuestion}</dd>
        </div>
        <div>
          <dt>Where it takes me</dt>
          <dd>{capability.destinationLabel}</dd>
        </div>
        <div>
          <dt>Ready now?</dt>
          <dd>{capability.readiness}</dd>
        </div>
        <div>
          <dt>Backed by</dt>
          <dd>{AUTHORITY_LABELS[capability.authority]}</dd>
        </div>
      </dl>

      <div className="staffordCapabilityFooter">
        {capability.currentRoute ? (
          <Link href={capability.currentRoute} className="staffordCapabilityAction">
            Open current page
          </Link>
        ) : (
          <span className="staffordCapabilityUnavailable">Not available yet</span>
        )}
        {capability.technicalNote ? <span className="staffordCapabilityTechnical">{capability.technicalNote}</span> : null}
      </div>
    </article>
  );
}

export function CapabilityLinkPanel({
  sectionKey,
  limit,
  heading = "What StaffordOS can help with",
  intro = "Use this map to open the current working pages without duplicating their data or actions.",
  showMapLink = false,
}: CapabilityLinkPanelProps) {
  const capabilities = visibleCapabilities(sectionKey, limit);

  return (
    <section className="staffordCapabilityPanel">
      <div className="staffordCapabilityPanelHeader">
        <div>
          <span className="staffordEyebrow">Capability map</span>
          <h2>{heading}</h2>
          <p>{intro}</p>
        </div>
        {showMapLink ? (
          <Link href="/os/capabilities" className="staffordCapabilityMapLink">
            See all capabilities
          </Link>
        ) : null}
      </div>

      <div className="staffordCapabilityGrid">
        {capabilities.map((capability) => (
          <CapabilityCard key={capability.id} capability={capability} />
        ))}
      </div>
    </section>
  );
}
