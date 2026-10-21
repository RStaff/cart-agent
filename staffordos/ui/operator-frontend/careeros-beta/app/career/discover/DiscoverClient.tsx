"use client";
import { useRef, useState } from "react";

type Preferences = { requestedTitle?: string; keywords: string; location: string; remotePreference: string; postedWithinDays: number | null; salaryMin: number | null; resultLimit: number };
type AvailableSource = { sourceId: string; provider: string; employerName: string; attributionText?: string | null; authorizedForAutomaticRetrieval?: boolean };
type Explanation = { whyFound?: string; strongEvidence?: string[]; transferableEvidence?: string[]; importantGaps?: string[]; lowerPriorityBecause?: string[]; recommendation?: string };
type SourceAuthority = { sourceId?: string | null; provider?: string | null; employerName?: string | null; interfaceType?: string | null; authorityStatus?: string | null; attributionText?: string | null; sourceLinkRequired?: boolean; applyRedirectRequired?: boolean; rateLimitPolicy?: string | null; removalPolicy?: string | null; lastReviewedAt?: string | null };
type Result = { provider?: string; sourceProvider: string; sourceName?: string | null; providerJobId?: string | null; externalOpportunityId: string | null; title: string | null; company: string | null; location: string | null; sourceUrl: string | null; applyUrl?: string | null; description: string | null; postedAt: string | null; closingAt: string | null; salaryMin: number | null; salaryMax: number | null; employmentType: string | null; retrievedAt: string; authoritySourceId?: string | null; sourceAuthority?: SourceAuthority | null; providerMetadata?: { sourceAuthority?: SourceAuthority | null } | null; recommendation?: string; roleCompatibility?: { classification: string }; discoveryExplanation?: Explanation & { requestedRole?: string; roleAlignment?: string; seniorityAligned?: boolean; specializationAligned?: boolean }; negativeSignals?: string[]; existingState?: string | null };

const AUTOMATIC_DISCOVERY_UNAVAILABLE_MESSAGE = "Automatic discovery is unavailable pending provider authorization. You can still paste a job description for analysis.";

function date(value: string | null) { return value ? new Date(value).toLocaleDateString() : null; }
function identity(result: Result) { return result.providerJobId || result.externalOpportunityId || result.sourceUrl || result.title || "result"; }
function provider(result: Result) { return result.provider || result.sourceProvider || "Authorized source"; }
function sourceAuthority(result: Result) { return result.sourceAuthority || result.providerMetadata?.sourceAuthority || null; }
function sourceLabel(result: Result) {
  const authority = sourceAuthority(result);
  const name = result.sourceName || authority?.employerName || "";
  const providerName = provider(result);
  return name && !name.toUpperCase().includes(providerName.toUpperCase()) ? `${providerName} / ${name}` : name || providerName;
}
function sourceHref(result: Result) { return result.sourceUrl || result.applyUrl || null; }
function inboxProvenance(result: Result) {
  const authority = sourceAuthority(result);
  return { provider: provider(result), authoritySourceId: result.authoritySourceId || authority?.sourceId || null, sourceAuthority: authority, applyUrl: result.applyUrl || result.sourceUrl || null, retrievedAt: result.retrievedAt };
}
function recommendationLabel(value?: string) { return ({ STRONG_CANDIDATE: "Strong candidate", CONSIDER: "Consider", LOWER_PRIORITY: "Lower priority" } as Record<string, string>)[value || ""] || "Review"; }
function evidenceList(items?: string[]) { return (items || []).filter(Boolean).slice(0, 3).join(" · "); }
function sourceIdsFor(sources: AvailableSource[]) { return [...new Set((sources || []).filter((source) => source.authorizedForAutomaticRetrieval === true).map((source) => source.sourceId).filter(Boolean))]; }
function sourceDisplayName(source: AvailableSource) { return `${source.employerName} public jobs via ${source.provider === "LEVER" ? "Lever" : source.provider}`; }
function availableSourceText(sources: AvailableSource[]) { return sources.map(sourceDisplayName).join(", "); }
function searchPayload(form: { requestedTitle: string; keywords: string; location: string; remotePreference: string; postedWithinDays: string; salaryMin: string; resultLimit: string }) {
  return { ...form, postedWithinDays: form.postedWithinDays || null, salaryMin: form.salaryMin || null, resultLimit: Number(form.resultLimit) };
}

const PRESETS = { "": "", PROGRAM: "program manager project management", AI_TECHNOLOGY: "AI technology automation", MARTECH: "marketing technology digital", CONSULTING: "consulting client delivery", TRAINING: "education training enablement" };

export default function DiscoverClient({ initialPreferences, availableSources = [] }: { initialPreferences: Preferences; availableSources?: AvailableSource[] }) {
  const [form, setForm] = useState({ requestedTitle: initialPreferences.requestedTitle || "", keywords: initialPreferences.keywords || "", location: initialPreferences.location || "", remotePreference: initialPreferences.remotePreference || "any", postedWithinDays: initialPreferences.postedWithinDays?.toString() || "", salaryMin: initialPreferences.salaryMin?.toString() || "", resultLimit: String(initialPreferences.resultLimit || 10) });
  const [results, setResults] = useState<Result[]>([]);
  const [message, setMessage] = useState("");
  const [partialFailure, setPartialFailure] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preset, setPreset] = useState("");
  const searchGeneration = useRef(0);
  const activeSources = availableSources.filter((source) => source.authorizedForAutomaticRetrieval === true);
  const activeSourceIds = sourceIdsFor(activeSources);
  const automaticDiscoveryAvailable = activeSourceIds.length > 0;
  const sourceSummary = availableSourceText(activeSources);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setPartialFailure(false);
    if (!automaticDiscoveryAvailable) {
      setResults([]);
      setMessage(AUTOMATIC_DISCOVERY_UNAVAILABLE_MESSAGE);
      return;
    }
    setSavingPreferences(true);
    const generation = ++searchGeneration.current;
    const payload = searchPayload(form);
    let persisted = false;
    try {
      const saved = await fetch("/api/career/discover", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const savedBody = await saved.json();
      if (!saved.ok) {
        if (generation === searchGeneration.current) setMessage(savedBody.error || "Search preferences could not be saved. Search was not started.");
        return;
      }
      persisted = true;
      const response = await fetch("/api/career/discover", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, provider: "SOURCE_REGISTRY", sourceIds: activeSourceIds }) });
      const body = await response.json();
      if (generation !== searchGeneration.current) return;
      if (!response.ok) {
        setMessage(body.error === "USAJOBS_WRITTEN_APPROVAL_REQUIRED" ? AUTOMATIC_DISCOVERY_UNAVAILABLE_MESSAGE : body.error || "Automatic discovery is unavailable right now.");
        return;
      }
      setPartialFailure(body.partialFailure === true);
      const statuses = body.existingStatuses || {};
      const resultSource = body.provider === "GREENHOUSE" || body.provider === "LEVER" || body.provider === "SOURCE_REGISTRY" ? "authorized employer sources" : "authorized providers";
      setResults((body.results || []).map((result: Result) => ({ ...result, existingState: result.existingState || statuses[result.externalOpportunityId || result.sourceUrl || ""] || null })));
      setMessage((body.results?.length || 0) + " ranked opportunities found via " + resultSource + ".");
    } catch {
      if (generation === searchGeneration.current) setMessage(persisted ? "Search could not be completed. Your search preferences were saved." : "Search preferences could not be saved. Search was not started.");
    } finally {
      if (generation === searchGeneration.current) setSavingPreferences(false);
    }
  }

  async function savePreferences() {
    setSavingPreferences(true);
    setMessage("");
    const response = await fetch("/api/career/discover", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(searchPayload(form)) });
    const body = await response.json();
    setSavingPreferences(false);
    setMessage(response.ok ? "Search preferences saved for future authorized discovery." : body.error || "Search preferences could not be saved.");
  }

  async function report(result: Result, reason: string) {
    const response = await fetch("/api/career/discover", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestedTitle: form.requestedTitle, observedTitle: result.title, reason, provider: provider(result), externalOpportunityId: result.externalOpportunityId }) });
    setMessage(response.ok ? "Thanks. This relevance feedback is saved separately from your opportunity decision." : "Relevance feedback could not be saved.");
  }

  async function save(result: Result) {
    const key = identity(result);
    setSaving(key);
    try {
      const response = await fetch("/api/career/opportunity-inbox", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceType: "API_IMPORT", sourceName: sourceLabel(result), sourceUrl: sourceHref(result), externalOpportunityId: result.providerJobId || result.externalOpportunityId, discoveredAt: result.retrievedAt, title: result.title, company: result.company, location: result.location, description: result.description, provenance: inboxProvenance(result) }) });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.error || "Could not add this opportunity.");
        return;
      }
      if (body.duplicate !== "NEW" || body.item?.status !== "READY_TO_ANALYZE") {
        setMessage(body.duplicate === "DUPLICATE" ? "This opportunity is already in your inbox." : "Opportunity added to your inbox. Review it before analysis.");
        return;
      }
      const analysis = await fetch(`/api/career/opportunity-inbox/${body.item.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "analyze" }) });
      const analysisBody = await analysis.json();
      if (!analysis.ok) {
        setMessage(analysisBody.error || "Opportunity added to your inbox, but analysis could not be completed.");
        return;
      }
      if (analysisBody.opportunity?.id) window.location.href = "/career/jobs/" + analysisBody.opportunity.id;
      else setMessage("Opportunity added to your inbox, but analysis could not be completed.");
    } catch {
      setMessage("Could not add or analyze this opportunity. It may still be available in your inbox.");
    } finally {
      setSaving(null);
    }
  }

  return <>
    <section className="careerProfilePanel">
      <h2>Discovery settings</h2>
      <p className="careerMuted">{automaticDiscoveryAvailable ? `Automatic job discovery is available from ${sourceSummary}. CareerOS does not send your career profile or application materials to job providers.` : "Automatic job discovery is unavailable pending provider authorization. You can save criteria for later and paste a job description for analysis now."}</p>
      {automaticDiscoveryAvailable && <p className="careerDraftState" role="status">Governed source: {sourceSummary}</p>}
      <div className="careerForm">
        <label>Target job title<input value={form.requestedTitle} onChange={(e) => setForm({ ...form, requestedTitle: e.target.value })} placeholder="For example, Senior AI Product Manager" /></label>
        <label>Additional keywords<input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} /></label>
        <label>Search theme
          <select value={preset} onChange={(e) => {
            const value = e.target.value;
            setPreset(value);
            setForm({ ...form, keywords: PRESETS[value as keyof typeof PRESETS] });
          }}>
            <option value="">Custom search</option>
            <option value="PROGRAM">Program / Project Management</option>
            <option value="AI_TECHNOLOGY">AI / Technology / Automation</option>
            <option value="MARTECH">Marketing Technology / Digital</option>
            <option value="CONSULTING">Consulting / Client Delivery</option>
            <option value="TRAINING">Education / Training</option>
          </select>
        </label>
        <label>Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
        <label>Remote
          <select value={form.remotePreference} onChange={(e) => setForm({ ...form, remotePreference: e.target.value })}>
            <option value="any">Any</option>
            <option value="remote">Remote only</option>
            <option value="nonRemote">Exclude remote</option>
          </select>
        </label>
        <label>Posted within days<input type="number" min="0" max="60" value={form.postedWithinDays} onChange={(e) => setForm({ ...form, postedWithinDays: e.target.value })} /></label>
        <label>Minimum salary<input type="number" min="0" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} /></label>
        <div className="careerNav">
          <button type="button" className="careerLinkButton" onClick={savePreferences} disabled={savingPreferences}>{savingPreferences ? "Saving..." : "Save search preferences"}</button>
          <button type="button" className="careerPrimaryButton" onClick={(event) => search(event as unknown as React.FormEvent)} disabled={savingPreferences || !automaticDiscoveryAvailable}>{automaticDiscoveryAvailable ? "Search now" : "Search unavailable"}</button>
          <a className="careerLinkButton" href="/career/jobs">Paste a job for analysis</a>
        </div>
        {form.requestedTitle && <p className="careerDraftState" role="status">Target role: {form.requestedTitle}</p>}
        {message && <p className="careerDraftState" role="status">{message}</p>}
        {partialFailure && <p className="careerDraftState" role="status">Some authorized job sources were temporarily unavailable. Results from the available sources are shown.</p>}
      </div>
    </section>
    {results.length === 0 && form.requestedTitle && message && !message.includes("found via") && message !== AUTOMATIC_DISCOVERY_UNAVAILABLE_MESSAGE && <section className="careerProfilePanel"><h2>No compatible results yet</h2><p className="careerMuted">CareerOS will not fill this search with unrelated roles. Try broadening the target role or adjusting your preferences.</p></section>}
    {results.length > 0 && <section className="careerProfilePanel">
      <h2>Ranked results</h2>
      <p className="careerMuted">These are ranked discovery previews, not CareerOS match assessments.</p>
      {results.map((result) => {
        const key = identity(result);
        const explanation = result.discoveryExplanation || {};
        const href = sourceHref(result);
        return <article className="careerCandidate" key={key}>
          <h3>{result.title || "Untitled opportunity"}</h3>
          <p>{[result.company, result.location].filter(Boolean).join(" · ") || "Details not provided"}</p>
          <p className="careerSaved">{recommendationLabel(result.recommendation)} · {String(explanation.roleAlignment || "Role alignment unavailable").replaceAll("_", " ")}</p>
          <p className="careerMuted">Requested role: {explanation.requestedRole || form.requestedTitle || "Not specified"}</p>
          <p className="careerMuted">Source: {sourceLabel(result)}{result.employmentType ? " · " + result.employmentType : ""}{result.salaryMin ? " · $" + result.salaryMin.toLocaleString() + "+" : ""}</p>
          <p className="careerMuted">{date(result.postedAt) ? "Posted " + date(result.postedAt) : "Posting date not provided"}{date(result.closingAt) ? " · Closes " + date(result.closingAt) : ""}</p>
          <p><strong>Why this surfaced</strong><br />{explanation.whyFound || "CareerOS found this through your current discovery criteria."}</p>
          {evidenceList(explanation.strongEvidence) && <p><strong>Strong evidence</strong><br />{evidenceList(explanation.strongEvidence)}</p>}
          {evidenceList(explanation.transferableEvidence) && <p><strong>Transferable evidence</strong><br />{evidenceList(explanation.transferableEvidence)}</p>}
          {evidenceList(explanation.importantGaps) && <p><strong>Important gaps</strong><br />{evidenceList(explanation.importantGaps)}</p>}
          {result.negativeSignals?.length ? <p className="careerMuted">Lower priority because {result.negativeSignals.slice(0, 2).join(" and ").toLowerCase()}.</p> : null}
          {href && <p><a href={href} target="_blank" rel="noreferrer">View source posting</a></p>}
          <div className="careerInterviewActions">
            <button className="careerSmallButton" disabled={Boolean(result.existingState) || saving === key} onClick={() => save(result)}>{saving === key ? "Adding..." : result.existingState || "Add to Opportunity Inbox"}</button>
            <select aria-label={`Report relevance for ${result.title || "opportunity"}`} defaultValue="" onChange={(event) => {
              if (event.target.value) {
                report(result, event.target.value);
                event.target.value = "";
              }
            }}>
              <option value="">Report relevance</option>
              <option value="WRONG_TITLE">Wrong title</option>
              <option value="WRONG_ROLE_FAMILY">Wrong role family</option>
              <option value="WRONG_SENIORITY">Wrong seniority</option>
              <option value="WRONG_SPECIALIZATION">Wrong specialization</option>
              <option value="WRONG_LOCATION">Wrong location</option>
              <option value="OTHER_NOT_RELEVANT">Other not relevant</option>
            </select>
          </div>
        </article>;
      })}
    </section>}
  </>;
}
