"use client";

import Link from "next/link";
import {
  ACCESS_LABELS,
  AUTHORITY_LABELS,
  AVAILABILITY_LABELS,
  SOURCE_LABELS,
  STAFFORDOS_CAPABILITIES,
  capabilitiesForWorkspaceSection,
  type StaffordOsCapability,
} from "../../lib/staffordos/capabilities";
import type { StaffordOsSectionKey } from "../../lib/staffordos/workspaces";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  type StaffordOsWorkspaceId,
} from "../../lib/staffordos/workspaceRegistry";
import { useStaffordOsWorkspace } from "./WorkspaceContext";

type CapabilityLinkPanelProps = {
  sectionKey?: StaffordOsSectionKey;
  workspaceId?: StaffordOsWorkspaceId;
  limit?: number;
  heading?: string;
  intro?: string;
  showMapLink?: boolean;
};

function visibleCapabilities(workspaceId: StaffordOsWorkspaceId, sectionKey?: StaffordOsSectionKey, limit?: number) {
  const capabilities = sectionKey
    ? capabilitiesForWorkspaceSection(workspaceId, sectionKey)
    : STAFFORDOS_CAPABILITIES.filter((capability) => capability.workspaceId === workspaceId);
  return typeof limit === "number" ? capabilities.slice(0, limit) : capabilities;
}

function CapabilityCard({ capability }: { capability: StaffordOsCapability }) {
  return (
    <article className="staffordCapabilityCard">
      <div className="staffordCapabilityMeta">
        <span>{AVAILABILITY_LABELS[capability.availability]}</span>
        <span>{ACCESS_LABELS[capability.access]}</span>
        <span>{SOURCE_LABELS[capability.source]}</span>
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
          <span className="staffordCapabilityUnavailable">Planned for later</span>
        )}
        {capability.technicalNote ? <span className="staffordCapabilityTechnical">{capability.technicalNote}</span> : null}
      </div>
    </article>
  );
}

export function CapabilityLinkPanel({
  sectionKey,
  workspaceId,
  limit,
  heading = "What StaffordOS can help with",
  intro = "Use this map to open the current working pages without duplicating their data or actions.",
  showMapLink = false,
}: CapabilityLinkPanelProps) {
  const { activeWorkspace } = useStaffordOsWorkspace();
  const resolvedWorkspaceId = workspaceId || activeWorkspace.id || DEFAULT_STAFFORDOS_WORKSPACE_ID;
  const capabilities = visibleCapabilities(resolvedWorkspaceId, sectionKey, limit);

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

      {capabilities.length ? (
        <div className="staffordCapabilityGrid">
          {capabilities.map((capability) => (
            <CapabilityCard key={capability.id} capability={capability} />
          ))}
        </div>
      ) : (
        <p className="staffordCapabilityEmpty">No capabilities are connected here for the selected workspace.</p>
      )}
    </section>
  );
}
