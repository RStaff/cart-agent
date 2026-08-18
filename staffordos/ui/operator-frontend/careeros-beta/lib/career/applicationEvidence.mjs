function evidenceForRelationship(relationship, capabilities, factsById, sourcesById) {
  const capability = relationship.capabilityKey ? capabilities.get(relationship.capabilityKey) : null;
  const provenance = capability?.provenance || {};
  const factIds = Array.isArray(provenance.factIds) ? provenance.factIds : [];
  const facts = factIds.map((factId) => factsById.get(factId)).filter(Boolean).map((fact) => ({
    statement: fact.statement,
    sourceType: sourcesById.get(fact.sourceId)?.sourceType || null,
    sourceExcerpt: fact.sourceExcerpt || null,
    scopeStatement: fact.scopeStatement || null,
  }));
  return { requirement: relationship.text, importance: relationship.importance, relationship: relationship.state, explanation: relationship.explanation, capability: capability?.label || relationship.capabilityLabel || null, evidence: facts };
}

export function buildApplicationEvidencePacket({ opportunity, requirements = [], match, capabilities = [], facts = [], sources = [] }) {
  if (!match) return { status: "APPLICATION_EVIDENCE_UNAVAILABLE", message: "Analyze this job before preparing application evidence.", opportunity: { title: opportunity.title, company: opportunity.company, location: opportunity.location, sourceUrl: opportunity.sourceUrl, decisionState: opportunity.decisionState } };
  const packet = { status: match.stale ? "APPLICATION_EVIDENCE_STALE" : "CURRENT", message: match.stale ? "Your career profile has changed since this job was analyzed. Re-analyze the job before preparing application materials." : null, opportunity: { title: opportunity.title, company: opportunity.company, location: opportunity.location, sourceUrl: opportunity.sourceUrl, decisionState: opportunity.decisionState }, analysis: { evaluationVersion: match.evaluationVersion || null, createdAt: match.createdAt || null }, sections: { direct: [], transferable: [], partial: [], unknown: [], specialist: [], scope: [] } };
  const requirementById = new Map(requirements.map((item) => [item.id, item]));
  const capabilityMap = new Map(capabilities.map((item) => [item.capabilityKey, item]));
  const factsById = new Map(facts.map((item) => [item.id, item]));
  const sourcesById = new Map(sources.map((item) => [item.id, item]));
  for (const relationship of Array.isArray(match.relationships) ? match.relationships : []) {
    const requirement = requirementById.get(relationship.id) || relationship;
    const item = evidenceForRelationship({ ...requirement, ...relationship }, capabilityMap, factsById, sourcesById);
    const key = relationship.state === "DIRECT" ? "direct" : relationship.state === "TRANSFERABLE" ? "transferable" : relationship.state === "PARTIAL" ? "partial" : relationship.state === "SPECIALIST_BLOCKED" ? "specialist" : relationship.state === "SCOPE_BLOCKED" ? "scope" : "unknown";
    packet.sections[key].push(item);
  }
  packet.summary = Object.fromEntries(Object.entries(packet.sections).map(([key, items]) => [key, items.length]));
  return packet;
}

export function hasCurrentApplicationEvidence(packet) { return packet?.status === "CURRENT"; }
