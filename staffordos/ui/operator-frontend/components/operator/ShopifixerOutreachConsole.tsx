"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getShopifixerFixBaseUrl } from "../../../../products/shopifixer/assisted/fix_link.js";

type QueueRow = {
  id: string;
  source_lead_id: string;
  company_name: string;
  store_url: string;
  normalized_store_url?: string;
  contact_email: string;
  niche: string;
  contact_name?: string;
  site_reachable?: boolean;
  contact_source?: string;
  contact_confidence?: string;
  has_real_contact_path?: boolean;
  valid_contact_status?: string;
  admission_decision?: "admit" | "review_needed" | "reject";
  contact_notes?: string;
  issue_hypothesis: string;
  recommended_template: string;
  selected_template: string;
  subject: string;
  body: string;
  audit_url: string;
  prefilled_audit_url: string;
  icp_score: number;
  icp_reasons: string[];
  queue_priority: "high" | "medium" | "low";
  status: "queued" | "draft_generated" | "review_needed" | "sent" | "archived";
  notes: string;
  gmail_draft_url: string;
  last_status_changed_at?: string;
  tracking?: {
    fix_page_view?: string;
    fix_cta_click?: string;
  };
};

type FormState = {
  id: string;
  company_name: string;
  store_url: string;
  normalized_store_url: string;
  contact_email: string;
  niche: string;
  contact_name: string;
  site_reachable: boolean;
  contact_source: string;
  contact_confidence: string;
  has_real_contact_path: boolean;
  valid_contact_status: string;
  admission_decision: "admit" | "review_needed" | "reject";
  contact_notes: string;
  issue_hypothesis: string;
  recommended_template: string;
  selected_template: string;
  subject: string;
  body: string;
  audit_url: string;
  prefilled_audit_url: string;
  icp_score: number;
  icp_reasons: string[];
  queue_priority: "high" | "medium" | "low";
  status: "queued" | "draft_generated" | "review_needed" | "sent" | "archived";
  notes: string;
  gmail_draft_url: string;
  tracking: {
    fix_page_view?: string;
    fix_cta_click?: string;
  };
};

type RenderMode = "empty_mode" | "review_mode" | "work_mode" | "sent_mode";
type LeadView = "backlog" | "active" | "sent";

type LeadConfidence = "high" | "medium" | "low";
type LeadQuality = "strong" | "maybe" | "weak";
type LeadStatus = "backlog" | "active" | "sent" | "archived";
type LeadSource = "manual" | "landing_page" | "csv";
type ShopifyConfidence = "high" | "medium" | "low" | "";

type QualifiedLead = {
  id: string;
  company: string;
  url: string;
  email: string;
  niche: string;
  observed_issue: string;
  why_it_matters: string;
  confidence: LeadConfidence;
  lead_quality: LeadQuality;
  contact_page: string;
  contact_hint: string;
  shopify_confidence: ShopifyConfidence;
  priority_score: string;
  status: LeadStatus;
  source: LeadSource;
  created_at: string;
  updated_at: string;
};

const EMPTY_FORM: FormState = {
  id: "",
  company_name: "",
  store_url: "",
  normalized_store_url: "",
  contact_email: "",
  niche: "",
  contact_name: "",
  site_reachable: false,
  contact_source: "",
  contact_confidence: "low",
  has_real_contact_path: false,
  valid_contact_status: "",
  admission_decision: "admit",
  contact_notes: "",
  issue_hypothesis: "",
  recommended_template: "observation",
  selected_template: "observation",
  subject: "",
  body: "",
  audit_url: getShopifixerFixBaseUrl(),
  prefilled_audit_url: getShopifixerFixBaseUrl(),
  icp_score: 0,
  icp_reasons: [] as string[],
  queue_priority: "low",
  status: "queued",
  notes: "",
  gmail_draft_url: "",
  tracking: {},
};

const EMPTY_QUALIFIED_LEAD_FORM: QualifiedLead = {
  id: "",
  company: "",
  url: "",
  email: "",
  niche: "",
  observed_issue: "",
  why_it_matters: "",
  confidence: "medium",
  lead_quality: "maybe",
  contact_page: "",
  contact_hint: "",
  shopify_confidence: "",
  priority_score: "",
  status: "backlog",
  source: "manual",
  created_at: "",
  updated_at: "",
};

const LEAD_STATUS_ORDER: LeadStatus[] = [
  "backlog",
  "active",
  "sent",
  "archived",
];

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  backlog: "Backlog",
  active: "Active",
  sent: "Sent",
  archived: "Archived",
};

const LEAD_VIEW_LABELS: Record<LeadView, string> = {
  backlog: "Backlog",
  active: "Active",
  sent: "Sent",
};

function isActiveRow(row: QueueRow | null | undefined) {
  return Boolean(
    row
      && (row.status === "draft_generated" || row.status === "queued"),
  );
}

function buildFormFromRow(row: QueueRow): FormState {
  return {
    id: row.id,
    company_name: row.company_name,
    store_url: row.store_url,
    normalized_store_url: row.normalized_store_url || "",
    contact_email: row.contact_email,
    niche: row.niche,
    contact_name: row.contact_name || "",
    site_reachable: Boolean(row.site_reachable),
    contact_source: row.contact_source || "",
    contact_confidence: row.contact_confidence || "low",
    has_real_contact_path: Boolean(row.has_real_contact_path),
    valid_contact_status: row.valid_contact_status || "",
    admission_decision: row.admission_decision || "admit",
    contact_notes: row.contact_notes || "",
    issue_hypothesis: row.issue_hypothesis || "",
    recommended_template: row.recommended_template || "observation",
    selected_template: row.selected_template || row.recommended_template || "observation",
    subject: row.subject || "",
    body: row.body || "",
    audit_url: row.audit_url || getShopifixerFixBaseUrl(),
    prefilled_audit_url: row.prefilled_audit_url || row.audit_url || getShopifixerFixBaseUrl(),
    icp_score: Number(row.icp_score || 0) || 0,
    icp_reasons: Array.isArray(row.icp_reasons) ? row.icp_reasons : [],
    queue_priority: row.queue_priority || "low",
    status: row.status || "queued",
    notes: row.notes || "",
    gmail_draft_url: row.gmail_draft_url || "",
    tracking: row.tracking || {},
  };
}

function getActiveQueueRows(rows: QueueRow[]) {
  const priorityRank = { high: 3, medium: 2, low: 1 };
  return rows
    .filter((row) => row.status === "draft_generated" || row.status === "queued")
    .sort((left, right) =>
      (priorityRank[right.queue_priority || "low"] - priorityRank[left.queue_priority || "low"])
      || ((Number(right.icp_score || 0) || 0) - (Number(left.icp_score || 0) || 0))
    );
}

function resolveSelectedRow(rows: QueueRow[], requestedRowId = "") {
  const activeRows = getActiveQueueRows(rows);
  if (requestedRowId) {
    const requestedRow = activeRows.find((row) => row.id === requestedRowId);
    if (requestedRow) {
      return requestedRow;
    }
  }

  return activeRows[0] || null;
}

function getActionOptions(row: QueueRow | null) {
  if (!row) return [];

  if (row.status === "review_needed") {
    return [
      { label: "Promote to Active", targetStatus: "queued" as const },
      { label: "Archive", targetStatus: "archived" as const },
    ];
  }

  if (row.status === "queued" || row.status === "draft_generated") {
    return [
      { label: "Move to Review Needed", targetStatus: "review_needed" as const },
      { label: "Mark Sent", targetStatus: "sent" as const },
      { label: "Archive", targetStatus: "archived" as const },
    ];
  }

  if (row.status === "sent") {
    return [
      { label: "Archive", targetStatus: "archived" as const },
    ];
  }

  return [];
}

function getRenderMode(row: QueueRow | null): RenderMode {
  if (!row) return "empty_mode";
  if (row.status === "review_needed") return "review_mode";
  if (row.status === "queued" || row.status === "draft_generated") return "work_mode";
  return "empty_mode";
}

function getQueueSectionLabel(row: QueueRow | null) {
  if (!row) return "No section";
  if (row.status === "review_needed") return "Review Needed";
  if (row.status === "queued" || row.status === "draft_generated") return "Active Queue";
  if (row.status === "sent") return "Sent Queue";
  return "Hidden Queue";
}

function shortenLeadIssue(value: string) {
  const text = String(value || "").trim();
  if (text.length <= 84) {
    return text;
  }
  return `${text.slice(0, 81)}...`;
}

function getLeadConfidenceDisplay(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["high", "medium", "low"].includes(normalized) ? normalized : "medium";
}

function getLeadQualityDisplay(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["strong", "maybe", "weak"].includes(normalized) ? normalized : "maybe";
}

function getBacklogReviewIssues(lead: QualifiedLead) {
  const issues: string[] = [];

  if (!String(lead.company || "").trim()) issues.push("Company");
  if (!String(lead.url || "").trim()) issues.push("URL");
  if (!String(lead.observed_issue || "").trim()) issues.push("Observed issue");
  if (!String(lead.why_it_matters || "").trim()) issues.push("Why it matters");

  const confidence = String(lead.confidence || "").trim().toLowerCase();
  if (!["high", "medium", "low"].includes(confidence)) issues.push("Confidence");

  const leadQuality = String(lead.lead_quality || "").trim().toLowerCase();
  if (!["strong", "maybe", "weak"].includes(leadQuality)) issues.push("Lead quality");

  return issues;
}

function getLeadPipeline(leads: QualifiedLead[]) {
  return LEAD_STATUS_ORDER.map((status) => ({
    status,
    label: LEAD_STATUS_LABELS[status],
    leads: leads.filter((lead) => lead.status === status),
  }));
}

function getLeadCreatedTime(lead: QualifiedLead) {
  return Date.parse(lead.created_at || lead.updated_at || "") || 0;
}

function getBacklogLeads(leads: QualifiedLead[]) {
  return [...leads]
    .filter((lead) => lead.status === "backlog")
    .sort((left, right) =>
      getLeadCreatedTime(left) - getLeadCreatedTime(right)
      || left.id.localeCompare(right.id)
    );
}

function getActiveLead(leads: QualifiedLead[]) {
  return leads.find((lead) => lead.status === "active") || null;
}

function getActiveLeads(leads: QualifiedLead[]) {
  return [...leads]
    .filter((lead) => lead.status === "active")
    .sort((left, right) =>
      getLeadCreatedTime(left) - getLeadCreatedTime(right)
      || left.id.localeCompare(right.id)
    );
}

function getSentLeads(leads: QualifiedLead[]) {
  return [...leads]
    .filter((lead) => lead.status === "sent")
    .sort((left, right) =>
      getLeadCreatedTime(left) - getLeadCreatedTime(right)
      || left.id.localeCompare(right.id)
    );
}

function getNextBacklogLead(leads: QualifiedLead[]) {
  return getBacklogLeads(leads)[0] || null;
}

function formMatchesRow(form: FormState, row: QueueRow) {
  return form.id === row.id
    && form.company_name === row.company_name
    && form.store_url === row.store_url
    && form.contact_email === row.contact_email
    && form.niche === row.niche
    && form.contact_name === (row.contact_name || "")
    && form.issue_hypothesis === (row.issue_hypothesis || "")
    && form.subject === (row.subject || "")
    && form.body === (row.body || "")
    && form.gmail_draft_url === (row.gmail_draft_url || "")
    && form.status === (row.status || "queued");
}

function qualifiedLeadMatches(current: QualifiedLead, next: QualifiedLead) {
  return current.id === next.id
    && current.company === next.company
    && current.url === next.url
    && current.email === next.email
    && current.niche === next.niche
    && current.observed_issue === next.observed_issue
    && current.why_it_matters === next.why_it_matters
    && current.confidence === next.confidence
    && current.lead_quality === next.lead_quality
    && current.contact_page === next.contact_page
    && current.contact_hint === next.contact_hint
    && current.shopify_confidence === next.shopify_confidence
    && current.priority_score === next.priority_score
    && current.status === next.status
    && current.source === next.source
    && current.created_at === next.created_at
    && current.updated_at === next.updated_at;
}

function resolveLeadView(
  requestedView: LeadView,
  backlogLeads: QualifiedLead[],
  activeLeads: QualifiedLead[],
  sentLeads: QualifiedLead[],
) {
  if (requestedView === "backlog" && backlogLeads.length === 0) {
    if (activeLeads.length > 0) return "active";
    if (sentLeads.length > 0) return "sent";
  }

  if (requestedView === "active" && activeLeads.length === 0) {
    if (backlogLeads.length > 0) return "backlog";
    if (sentLeads.length > 0) return "sent";
  }

  if (requestedView === "sent" && sentLeads.length === 0) {
    if (activeLeads.length > 0) return "active";
    if (backlogLeads.length > 0) return "backlog";
  }

  return requestedView;
}

export function ShopifixerOutreachConsole() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedRowId, setSelectedRowId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [leadBacklog, setLeadBacklog] = useState<QualifiedLead[]>([]);
  const [qualifiedLeadForm, setQualifiedLeadForm] = useState(EMPTY_QUALIFIED_LEAD_FORM);
  const [backlogIntakeForm, setBacklogIntakeForm] = useState(EMPTY_QUALIFIED_LEAD_FORM);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedLeadView, setSelectedLeadView] = useState<LeadView>("backlog");
  const [leadBacklogMessage, setLeadBacklogMessage] = useState("");
  const [leadBacklogError, setLeadBacklogError] = useState("");
  const [isLoadingLeadBacklog, setIsLoadingLeadBacklog] = useState(true);
  const [hasLoadedLeadBacklog, setHasLoadedLeadBacklog] = useState(false);
  const [isSavingQualifiedLead, setIsSavingQualifiedLead] = useState(false);
  const [isUpdatingQualifiedLead, setIsUpdatingQualifiedLead] = useState(false);
  const [isStagingQualifiedLead, setIsStagingQualifiedLead] = useState(false);
  const [isRefillingQueue, setIsRefillingQueue] = useState(false);
  const [refillCount, setRefillCount] = useState("5");
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [backlogReviewIssues, setBacklogReviewIssues] = useState<string[]>([]);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const backlogCompanyInputRef = useRef<HTMLInputElement | null>(null);
  const selectedWorkspaceRef = useRef<HTMLElement | null>(null);
  const lastSyncedQualifiedLeadRef = useRef<QualifiedLead | null>(null);
  const [lockedWorkspaceHeight, setLockedWorkspaceHeight] = useState(0);
  const selectedRow = resolveSelectedRow(queue, selectedRowId);
  const ssrSafeSelectedRow = isMounted ? selectedRow : null;
  const ssrSafeSelectedRowId = ssrSafeSelectedRow?.id || "";
  const ssrSafeActionOptions = getActionOptions(ssrSafeSelectedRow);
  const renderMode = getRenderMode(ssrSafeSelectedRow);
  const visibleLeadBacklog = leadBacklog.filter((lead) => lead.status !== "archived");
  const backlogLeads = getBacklogLeads(visibleLeadBacklog);
  const activeLeads = getActiveLeads(visibleLeadBacklog);
  const sentLeads = getSentLeads(visibleLeadBacklog);
  const activeLead = activeLeads[0] || null;
  const selectedRowSourceLeadId = selectedRow?.source_lead_id || "";
  const viewLeads = selectedLeadView === "active"
    ? activeLeads
    : selectedLeadView === "sent"
      ? sentLeads
      : backlogLeads;
  const selectedCanonicalLead = viewLeads.find((lead) => lead.id === selectedLeadId) || null;
  const selectedBacklogLead = backlogLeads.find((lead) => lead.id === selectedLeadId) || null;
  const selectedSentLead = sentLeads.find((lead) => lead.id === selectedLeadId) || null;
  const selectedWorkspaceLead = ssrSafeSelectedRow
    ? null
    : selectedCanonicalLead;
  const relatedBacklogLead = ssrSafeSelectedRow
    ? visibleLeadBacklog.find((lead) => lead.id === ssrSafeSelectedRow.source_lead_id) || null
    : selectedCanonicalLead;
  const selectedWorkspaceStyle = lockedWorkspaceHeight > 0 ? { minHeight: `${lockedWorkspaceHeight}px` } : undefined;

  function preserveWorkspaceHeight() {
    const nextHeight = selectedWorkspaceRef.current?.getBoundingClientRect().height || 0;
    if (nextHeight > 0) {
      setLockedWorkspaceHeight((current) => Math.max(current, Math.ceil(nextHeight)));
    }
  }

  function syncQualifiedLeadForm(nextLead: QualifiedLead | null) {
    if (!nextLead) {
      lastSyncedQualifiedLeadRef.current = null;
      setQualifiedLeadForm((current) => (current.id ? EMPTY_QUALIFIED_LEAD_FORM : current));
      return;
    }

    if (qualifiedLeadMatches(lastSyncedQualifiedLeadRef.current || EMPTY_QUALIFIED_LEAD_FORM, nextLead)) {
      return;
    }

    lastSyncedQualifiedLeadRef.current = nextLead;
    setQualifiedLeadForm((current) => (qualifiedLeadMatches(current, nextLead) ? current : nextLead));
  }

  useEffect(() => {
    void loadQueue();
    void loadLeadBacklog();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const activeRows = getActiveQueueRows(queue);
    const requestedRow = selectedRowId
      ? activeRows.find((row) => row.id === selectedRowId) || null
      : null;

    if (!selectedRowId) {
      const firstRow = activeRows[0] || null;

      if (firstRow) {
        setSelectedRowId(firstRow.id);
        return;
      }

      setForm((current) => (current.id ? EMPTY_FORM : current));
      return;
    }

    if (!requestedRow) {
      setSelectedRowId("");
      setForm((current) => (current.id ? EMPTY_FORM : current));
      return;
    }

    setForm((current) => (
      formMatchesRow(current, requestedRow) ? current : buildFormFromRow(requestedRow)
    ));
  }, [queue, selectedRowId]);

  useEffect(() => {
    if (isLoadingLeadBacklog || isStagingQualifiedLead) {
      return;
    }

    if (selectedLeadView === "active") {
      const nextLead = activeLeads.find((lead) => lead.id === selectedLeadId) || activeLeads[0] || null;

      if (!nextLead) {
        setSelectedLeadId((current) => (current ? "" : current));
        setSelectedRowId((current) => (current ? "" : current));
        setForm((current) => (current.id ? EMPTY_FORM : current));
        return;
      }

      if (selectedLeadId !== nextLead.id) {
        setSelectedLeadId(nextLead.id);
      }

      syncQualifiedLeadForm(nextLead);

      if (!isLoadingQueue && selectedRowSourceLeadId !== nextLead.id) {
        void loadQueue(nextLead.id);
      }
      return;
    }

    const fallbackLeads = selectedLeadView === "sent" ? sentLeads : backlogLeads;
    const nextLead = fallbackLeads.find((lead) => lead.id === selectedLeadId) || fallbackLeads[0] || null;

    if (selectedRowId) {
      setSelectedRowId("");
      setForm((current) => (current.id ? EMPTY_FORM : current));
    }

    if (!nextLead) {
      setSelectedLeadId((current) => (current ? "" : current));
      syncQualifiedLeadForm(null);
      return;
    }

    if (selectedLeadId !== nextLead.id) {
      setSelectedLeadId(nextLead.id);
    }

    syncQualifiedLeadForm(nextLead);
  }, [
    activeLeads,
    backlogLeads,
    isLoadingLeadBacklog,
    isLoadingQueue,
    isStagingQualifiedLead,
    selectedLeadId,
    selectedLeadView,
    selectedRowId,
    selectedRowSourceLeadId,
    sentLeads,
  ]);

  async function loadQueue(preferredSelectedRowId = "") {
    setIsLoadingQueue(true);
    setError("");
    try {
      const response = await fetch("/api/shopifixer/outreach", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not load outreach queue.");
      }
      const rows = Array.isArray(payload.queue) ? payload.queue as QueueRow[] : [];
      applyQueueState(rows, preferredSelectedRowId || selectedRowId);
      return rows;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load outreach queue.");
      return [];
    } finally {
      setIsLoadingQueue(false);
    }
  }

  function clearSelection(message = "") {
    setSelectedRowId("");
    setSelectedLeadId("");
    setForm(EMPTY_FORM);
    setStatusMessage(message);
    setError("");
  }

  function applyQueueState(rows: QueueRow[], nextSelectedRowId = "") {
    setQueue(rows);
    const resolvedRow = resolveSelectedRow(rows, nextSelectedRowId);
    if (resolvedRow) {
      setSelectedRowId(resolvedRow.id);
      setSelectedLeadId(resolvedRow.source_lead_id || resolvedRow.id);
      setError("");
      return;
    }

    setSelectedRowId("");
    setForm(EMPTY_FORM);
  }

  async function transitionSelectedRow(targetStatus: QueueRow["status"]) {
    if (!selectedRowId) {
      setError("Select a queue row before changing status.");
      return;
    }

    if (targetStatus === "sent") {
      preserveWorkspaceHeight();
    }

    setIsTransitioning(true);
    setError("");
    setStatusMessage("");

    try {
      const response = await fetch("/api/shopifixer/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "transition",
          selected_row_id: selectedRowId,
          status: targetStatus,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Transition failed.");
      }

      if (Array.isArray(payload.queue)) {
        applyQueueState(payload.queue as QueueRow[], String(payload.next_selected_row_id || ""));
      }

      const leads = Array.isArray(payload.leads)
        ? payload.leads as QualifiedLead[]
        : await loadLeadBacklog(String(payload.next_selected_row_id || ""));

      if (targetStatus === "sent") {
        const nextActiveLead = getActiveLeads(leads.filter((lead) => lead.status !== "archived"))[0] || null;
        setSelectedLeadView("active");
        if (nextActiveLead) {
          applyLeadBacklogState(leads, nextActiveLead.id);
          setSelectedLeadId(nextActiveLead.id);
          setQualifiedLeadForm(nextActiveLead);
          setStatusMessage(`Marked ${form.company_name || "lead"} sent. Loaded ${nextActiveLead.company}.`);
        } else {
          applyLeadBacklogState(leads, "");
          clearSelection("No leads to work");
          setStatusMessage("Marked lead sent. No leads remain.");
        }
        return;
      }

      applyLeadBacklogState(leads, String(payload.next_selected_row_id || selectedLeadId || ""));
      setStatusMessage(`Status changed to ${targetStatus}.`);
    } catch (transitionError) {
      setError(transitionError instanceof Error ? transitionError.message : "Transition failed.");
    } finally {
      setIsTransitioning(false);
    }
  }

  async function generateDraft() {
    if (!selectedRowId) {
      setError("Select a queue row before generating.");
      return;
    }
    setIsGenerating(true);
    setError("");
    setStatusMessage("");

    try {
      const response = await fetch("/api/shopifixer/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate",
          selected_row_id: selectedRowId,
          input: form,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.errors?.join(", ") || payload?.error || "Draft generation failed.");
      }

      if (payload.queue_row) {
        const updatedRow = payload.queue_row as QueueRow;
        setQueue((current) =>
          current.map((row) => row.id === updatedRow.id ? updatedRow : row)
        );
      }
      setStatusMessage("Draft generated. Operator review is still required before send.");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Draft generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function logDraft(status: "draft_generated" | "sent") {
    if (!selectedRowId) {
      setError("Select a queue row before logging status.");
      return;
    }

    if (status === "sent") {
      preserveWorkspaceHeight();
    }

    setIsLogging(true);
    setError("");
    setStatusMessage("");

    try {
      const response = await fetch("/api/shopifixer/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "log",
          selected_row_id: selectedRowId,
          status,
          draft: form,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Logging failed.");
      }

      if (Array.isArray(payload.queue)) {
        const nextSelectedId = status === "sent"
          ? String(payload.next_active_row_id || "")
          : selectedRowId;
        applyQueueState(payload.queue as QueueRow[], nextSelectedId);
      } else if (payload.queue_row) {
        setQueue((current) =>
          current.map((row) => row.id === payload.queue_row.id ? payload.queue_row as QueueRow : row)
        );
        setSelectedRowId(String(payload.queue_row.id || ""));
        setSelectedLeadId(String((payload.queue_row as QueueRow).source_lead_id || payload.queue_row.id || ""));
      }
      const leads = Array.isArray(payload.leads)
        ? payload.leads as QualifiedLead[]
        : await loadLeadBacklog(String(payload.next_active_row_id || ""));
      if (status === "sent") {
        const nextActiveLead = getActiveLeads(leads.filter((lead) => lead.status !== "archived"))[0] || null;
        setSelectedLeadView("active");
        if (nextActiveLead) {
          applyLeadBacklogState(leads, nextActiveLead.id);
          setSelectedLeadId(nextActiveLead.id);
          setQualifiedLeadForm(nextActiveLead);
          setStatusMessage(`Status logged as sent. Loaded ${nextActiveLead.company}.`);
        } else {
          applyLeadBacklogState(leads, "");
          clearSelection("No leads to work");
          setStatusMessage("Status logged as sent. No leads remain.");
        }
      } else {
        applyLeadBacklogState(leads, selectedLeadId);
        setStatusMessage(`Status logged as ${status}.`);
      }
    } catch (loggingError) {
      setError(loggingError instanceof Error ? loggingError.message : "Logging failed.");
    } finally {
      setIsLogging(false);
    }
  }

  async function openGmailDraft() {
    if (!selectedRowId) {
      setError("Select a queue row before opening Gmail.");
      return;
    }

    setIsLogging(true);
    setError("");
    setStatusMessage("");

    try {
      const response = await fetch("/api/shopifixer/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save_review",
          selected_row_id: selectedRowId,
          input: form,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not save reviewed draft.");
      }

      if (payload.queue_row) {
        const savedRow = {
          ...(payload.queue_row as QueueRow),
          gmail_draft_url: payload.gmail_draft_url as string,
        };
        setQueue((current) =>
          current.map((row) => row.id === savedRow.id ? savedRow : row)
        );
      }
      if (payload.gmail_draft_url) {
        setForm((current) => ({
          ...current,
          gmail_draft_url: String(payload.gmail_draft_url),
        }));
        window.open(payload.gmail_draft_url as string, "_blank", "noopener,noreferrer");
      }

      setStatusMessage("Reviewed draft saved to queue and Gmail compose opened.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save reviewed draft.");
    } finally {
      setIsLogging(false);
    }
  }

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateQualifiedLeadField(field: keyof QualifiedLead, value: string) {
    if (backlogReviewIssues.length > 0) {
      setBacklogReviewIssues([]);
    }
    setQualifiedLeadForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateBacklogIntakeField(field: keyof QualifiedLead, value: string) {
    setBacklogIntakeForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applyLeadBacklogState(leads: QualifiedLead[], preferredLeadId = "") {
    setLeadBacklog(leads);
    const visibleLeads = leads.filter((lead) => lead.status !== "archived");
    const backlog = getBacklogLeads(visibleLeads);
    const active = getActiveLeads(visibleLeads);
    const sent = getSentLeads(visibleLeads);
    const nextView = resolveLeadView(selectedLeadView, backlog, active, sent);
    const requestedLead = preferredLeadId
      ? visibleLeads.find((lead) => lead.id === preferredLeadId) || null
      : null;
    const nextLead = requestedLead
      || (nextView === "active" ? active[0] : null)
      || (nextView === "sent" ? sent[0] : null)
      || backlog[0]
      || active[0]
      || sent[0]
      || null;

    if (nextView !== selectedLeadView) {
      setSelectedLeadView(nextView);
    }

    if (nextLead) {
      setSelectedLeadId(nextLead.id);
      syncQualifiedLeadForm(nextLead);
      return;
    }

    setSelectedLeadId("");
    syncQualifiedLeadForm(null);
  }

  async function loadLeadBacklog(preferredLeadId = "") {
    setIsLoadingLeadBacklog(true);
    setLeadBacklogError("");

    try {
      const response = await fetch("/api/leads", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not load qualified backlog.");
      }

      const leads = Array.isArray(payload.leads) ? payload.leads as QualifiedLead[] : [];
      applyLeadBacklogState(leads, preferredLeadId || selectedLeadId);
      setHasLoadedLeadBacklog(true);
      return leads;
    } catch (loadError) {
      setLeadBacklogError(loadError instanceof Error ? loadError.message : "Could not load qualified backlog.");
      setHasLoadedLeadBacklog(true);
      return [];
    } finally {
      setIsLoadingLeadBacklog(false);
    }
  }

  async function loadLeadIntoWorkspace(lead: QualifiedLead) {
    setLeadBacklogMessage("");
    setLeadBacklogError("");
    setSelectedLeadId(lead.id);
    syncQualifiedLeadForm(lead);
    setSelectedLeadView(lead.status === "sent" ? "sent" : lead.status === "active" ? "active" : "backlog");

    if (lead.status === "active") {
      await loadQueue(lead.id);
      return;
    }

    if (lead.status !== "backlog") {
      return;
    }
  }

  function selectBacklogLead(lead: QualifiedLead) {
    setBacklogReviewIssues([]);
    setSelectedLeadId(lead.id);
    syncQualifiedLeadForm(lead);
    setSelectedLeadView("backlog");
  }

  function selectActiveLead(lead: QualifiedLead) {
    setSelectedLeadId(lead.id);
    setSelectedLeadView("active");
    void loadLeadIntoWorkspace(lead);
  }

  function selectSentLead(lead: QualifiedLead) {
    setSelectedLeadId(lead.id);
    syncQualifiedLeadForm(lead);
    setSelectedLeadView("sent");
  }

  async function addQualifiedLead() {
    setIsSavingQualifiedLead(true);
    setLeadBacklogError("");
    setLeadBacklogMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...backlogIntakeForm,
          source: "manual",
          status: "backlog",
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.errors?.join(", ") || payload?.error || "Could not add qualified lead.");
      }

      const leads = Array.isArray(payload.leads) ? payload.leads as QualifiedLead[] : [];
      const insertedLeadId = String(payload.lead?.id || "");
      applyLeadBacklogState(leads, insertedLeadId);
      setBacklogIntakeForm(EMPTY_QUALIFIED_LEAD_FORM);
      setSelectedLeadView("backlog");
      setLeadBacklogMessage("Qualified lead saved to backlog.");
    } catch (saveError) {
      setLeadBacklogError(saveError instanceof Error ? saveError.message : "Could not add qualified lead.");
    } finally {
      setIsSavingQualifiedLead(false);
    }
  }

  async function saveQualifiedLead() {
    if (!selectedBacklogLead?.id) {
      setLeadBacklogError("Select a qualified lead before saving.");
      return;
    }

    setIsUpdatingQualifiedLead(true);
    setBacklogReviewIssues([]);
    setLeadBacklogError("");
    setLeadBacklogMessage("");

    try {
      const response = await fetch(`/api/leads/${selectedBacklogLead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(qualifiedLeadForm),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.errors?.join(", ") || payload?.error || "Could not update qualified lead.");
      }

      const leads = Array.isArray(payload.leads) ? payload.leads as QualifiedLead[] : [];
      applyLeadBacklogState(leads, String(payload.lead?.id || selectedBacklogLead.id));
      setLeadBacklogMessage("Qualified lead updated.");
    } catch (updateError) {
      setLeadBacklogError(updateError instanceof Error ? updateError.message : "Could not update qualified lead.");
    } finally {
      setIsUpdatingQualifiedLead(false);
    }
  }

  async function updateQualifiedLeadStatus(status: LeadStatus) {
    if (!selectedBacklogLead?.id) {
      setLeadBacklogError("Select a qualified lead before changing status.");
      return;
    }

    setIsUpdatingQualifiedLead(true);
    setLeadBacklogError("");
    setLeadBacklogMessage("");

    try {
      const response = await fetch(`/api/leads/${selectedBacklogLead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...qualifiedLeadForm,
          status,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.errors?.join(", ") || payload?.error || "Could not update lead status.");
      }

      const leads = Array.isArray(payload.leads) ? payload.leads as QualifiedLead[] : [];
      applyLeadBacklogState(leads, String(payload.lead?.id || selectedBacklogLead.id));
      setLeadBacklogMessage(`Lead moved to ${LEAD_STATUS_LABELS[status]}.`);
    } catch (statusError) {
      setLeadBacklogError(statusError instanceof Error ? statusError.message : "Could not update lead status.");
    } finally {
      setIsUpdatingQualifiedLead(false);
    }
  }

  async function archiveQualifiedLead() {
    if (!selectedBacklogLead?.id) {
      setLeadBacklogError("Select a qualified lead before archiving.");
      return;
    }

    setIsUpdatingQualifiedLead(true);
    setLeadBacklogError("");
    setLeadBacklogMessage("");

    try {
      const response = await fetch(`/api/leads/${selectedBacklogLead.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.errors?.join(", ") || payload?.error || "Could not archive lead.");
      }

      const leads = Array.isArray(payload.leads) ? payload.leads as QualifiedLead[] : [];
      applyLeadBacklogState(leads, "");
      setLeadBacklogMessage("Lead archived.");
    } catch (archiveError) {
      setLeadBacklogError(archiveError instanceof Error ? archiveError.message : "Could not archive lead.");
    } finally {
      setIsUpdatingQualifiedLead(false);
    }
  }

  async function stageQualifiedLeadForOutreach() {
    if (!selectedBacklogLead) {
      setLeadBacklogError("Select a qualified lead before moving it into outreach.");
      return;
    }

    const reviewIssues = getBacklogReviewIssues(qualifiedLeadForm);
    if (reviewIssues.length > 0) {
      setBacklogReviewIssues(reviewIssues);
      setLeadBacklogError("");
      setLeadBacklogMessage("");
      return;
    }

    setIsStagingQualifiedLead(true);
    setBacklogReviewIssues([]);
    setLeadBacklogError("");
    setLeadBacklogMessage("");
    setError("");
    setStatusMessage("");

    try {
      const response = await fetch("/api/shopifixer/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "promote_lead",
          lead_id: selectedBacklogLead.id,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.errors?.join(", ") || payload?.error || "Could not move lead into outreach.");
      }

      if (Array.isArray(payload.queue)) {
        applyQueueState(payload.queue as QueueRow[], String(payload.next_active_row_id || payload.queue_row?.id || selectedRowId || ""));
      } else {
        await loadQueue(String(payload.queue_row?.id || selectedRowId || ""));
      }
      if (Array.isArray(payload.leads)) {
        applyLeadBacklogState(payload.leads as QualifiedLead[], selectedBacklogLead.id);
      } else {
        await loadLeadBacklog(selectedBacklogLead.id);
      }
      setSelectedLeadView("active");
      setStatusMessage(payload.no_op ? "Lead is already active in the outreach queue." : "Qualified lead moved into the outreach queue.");
      setLeadBacklogMessage(payload.no_op ? "Already active in outreach." : "Moved into outreach queue.");
    } catch (stageError) {
      const message = stageError instanceof Error ? stageError.message : "Could not move lead into outreach.";
      setLeadBacklogError(message);
      setError(message);
    } finally {
      setIsStagingQualifiedLead(false);
    }
  }

  async function refillActiveLeads() {
    setIsRefillingQueue(true);
    setLeadBacklogError("");
    setLeadBacklogMessage("");
    setError("");

    try {
      const response = await fetch("/api/shopifixer/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "refill_queue",
          count: Math.max(1, Number(refillCount) || 5),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not refill active leads.");
      }

      if (Array.isArray(payload.queue)) {
        applyQueueState(payload.queue as QueueRow[], String(payload.next_active_row_id || ""));
      } else {
        await loadQueue(String(payload.next_active_row_id || ""));
      }

      if (Array.isArray(payload.leads)) {
        applyLeadBacklogState(payload.leads as QualifiedLead[], String(payload.next_active_row_id || ""));
      } else {
        await loadLeadBacklog(String(payload.next_active_row_id || ""));
      }

      setSelectedLeadView("active");
      if (payload.promoted_count) {
        setLeadBacklogMessage(`${payload.promoted_count} lead${payload.promoted_count === 1 ? "" : "s"} moved to Active`);
      } else {
        setLeadBacklogMessage(String(payload.message || "No eligible qualified leads"));
      }
    } catch (refillError) {
      const message = refillError instanceof Error ? refillError.message : "Could not refill active leads.";
      setLeadBacklogError(message);
      setError(message);
    } finally {
      setIsRefillingQueue(false);
    }
  }

  function triggerCsvImport() {
    csvInputRef.current?.click();
  }

  function focusBacklogIntake() {
    setSelectedLeadView("backlog");
    backlogCompanyInputRef.current?.focus();
  }

  function parseCsvText(csvText: string) {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const cells = line.split(",").map((cell) => cell.trim());
      return headers.reduce<Record<string, string>>((row, header, index) => {
        row[header] = cells[index] || "";
        return row;
      }, {});
    });
  }

  async function importCsvFile(file: File) {
    setIsImportingCsv(true);
    setLeadBacklogError("");
    setLeadBacklogMessage("");

    try {
      const csvText = await file.text();
      const rows = parseCsvText(csvText);
      const response = await fetch("/api/leads/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "CSV import failed.");
      }

      if (Array.isArray(payload.leads)) {
        applyLeadBacklogState(payload.leads as QualifiedLead[], selectedLeadId);
      } else {
        await loadLeadBacklog(selectedLeadId);
      }

      setSelectedLeadView("backlog");
      setLeadBacklogMessage(
        `CSV imported ${payload.imported_count || 0} lead${payload.imported_count === 1 ? "" : "s"}`
        + `${payload.rejected_count ? `, rejected ${payload.rejected_count}` : ""}.`
      );
      if (payload.rejected_count) {
        setLeadBacklogError((payload.rejection_reasons || []).join(" | "));
      }
    } catch (csvError) {
      setLeadBacklogError(csvError instanceof Error ? csvError.message : "CSV import failed.");
    } finally {
      setIsImportingCsv(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }
    }
  }

  function renderSelectedRowPanels(mode: RenderMode, row: QueueRow | null) {
    const workspaceLead = selectedWorkspaceLead;
    const sendabilityChecks = [
      { key: "url", value: form.store_url },
      { key: "observed_issue", value: relatedBacklogLead?.observed_issue || "" },
      { key: "why_it_matters", value: relatedBacklogLead?.why_it_matters || "" },
    ];
    const missingSendableFields = sendabilityChecks
      .filter((entry) => !String(entry.value || "").trim())
      .map((entry) => entry.key);
    const isSendable = missingSendableFields.length === 0;
    const missingEmail = !String(form.contact_email || "").trim();
    const panelTitle = "Selected Row";
    const nextActions = !isMounted
      ? "Select a row"
      : row
        ? ssrSafeActionOptions.map((option) => option.label).join(" · ") || "No actions available"
        : workspaceLead
          ? (isStagingQualifiedLead ? "Loading lead into workspace" : "Review why this matters")
        : "Select a row";
    const currentStatus = !isMounted
      ? "Select a row"
      : row?.status || "Select a row";
    const currentSection = !isMounted
      ? "Select a row"
        : row
          ? "Selected Lead"
        : workspaceLead
          ? "Qualified Backlog"
        : "No leads to work";
    const dominantAction = !isMounted
      ? "Select a row"
      : mode === "review_mode"
        ? "Promote to Active"
        : mode === "work_mode"
        ? (form.subject || form.body ? "Open Gmail Draft and Mark Sent" : "Generate outreach draft")
        : workspaceLead
              ? (isStagingQualifiedLead ? "Loading lead into workspace" : "Review why this matters")
            : "Select a row";
    const panelModeClass = mode === "review_mode"
      ? "selectedWorkspaceReview"
      : mode === "work_mode"
        ? "selectedWorkspaceWork"
        : "selectedWorkspaceEmpty";
    const stateToneClass = mode === "review_mode"
      ? "stateBarReview"
      : mode === "work_mode"
        ? "stateBarWork"
        : "stateBarEmpty";
    const statusToneClass = mode === "review_mode"
      ? "workspaceStatReview"
      : mode === "work_mode"
        ? "workspaceStatWork"
        : "workspaceStatEmpty";
    const actionLabel = mode === "review_mode"
      ? "Review Actions"
      : mode === "work_mode"
        ? "Work Actions"
        : "";
    const showTrueEmptyState = isMounted && !isLoadingLeadBacklog && backlogLeads.length === 0 && !activeLead;

    return (
      <article ref={selectedWorkspaceRef} style={selectedWorkspaceStyle} className={`panel selectedWorkspace operatorWorkspace ${panelModeClass}`}>
        <div className="panelInner selectedWorkspaceInner">
          <div className="selectedWorkspaceHeader">
            <p className="eyebrow">{panelTitle}</p>
            <h2 className="selectedWorkspaceTitle">{panelTitle}</h2>
            <div className="selectedWorkspaceMeta">
              <span className="workspaceChip">
                Row {ssrSafeSelectedRowId || "none"}
              </span>
              <span className={`workspaceChip workspaceChipStatus ${statusToneClass}`}>
                {currentStatus}
              </span>
              <span className="workspaceChip">
                {currentSection}
              </span>
            </div>
          </div>

          <div className={`workspaceStateBar ${stateToneClass}`}>
            <div className="workspaceStateBlock">
              <span className="workspaceStateLabel">Status</span>
              <strong className="workspaceStateValue">{currentStatus}</strong>
            </div>
            <div className="workspaceStateBlock">
              <span className="workspaceStateLabel">Section</span>
              <strong className="workspaceStateValue">{currentSection}</strong>
            </div>
            <div className="workspaceStateBlock workspaceStateBlockPrimary">
              <span className="workspaceStateLabel">Next Action</span>
              <strong className="workspaceStateValue">{dominantAction}</strong>
            </div>
          </div>

          {mode === "empty_mode" ? (
            <div className="workspaceSection">
                <div className="workspaceSectionHeader">
                  <p className="workspaceSectionEyebrow">Workspace</p>
                  <h3 className="workspaceSectionTitle">
                    {workspaceLead ? workspaceLead.company || "Selected lead" : "No leads to work"}
                  </h3>
                </div>
                {workspaceLead ? (
                  <>
                    <div className="workspaceMetricsGrid">
                      <div className="workspaceMetricCard">
                        <span className="workspaceMetricLabel">Observed issue</span>
                        <strong className="workspaceMetricValue">{workspaceLead.observed_issue || "none"}</strong>
                      </div>
                      <div className="workspaceMetricCard">
                        <span className="workspaceMetricLabel">Why it matters</span>
                        <strong className="workspaceMetricValue">{workspaceLead.why_it_matters || "none"}</strong>
                      </div>
                    </div>
                    <p className="emptyStateText">
                      {isStagingQualifiedLead
                        ? "Loading this lead into the execution workspace..."
                        : "Selected from the qualified backlog. Loading execution context now."}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="emptyStateText">
                      {showTrueEmptyState
                        ? "No leads to work"
                        : "Choose the next backlog lead on the left to start working it."}
                    </p>
                  </>
                )}
              {error ? (
                <p className="hint" style={{ marginTop: 12, color: "#fecaca" }}>
                  {error}
                </p>
              ) : null}
            </div>
          ) : null}

          {mode === "review_mode" ? (
            <>
              <div className="workspaceSection">
                <div className="workspaceSectionHeader">
                  <p className="workspaceSectionEyebrow">Evaluation</p>
                  <h3 className="workspaceSectionTitle">Contact Review</h3>
                </div>
                <div className="workspaceMetricsGrid">
                  <div className="workspaceMetricCard">
                    <span className="workspaceMetricLabel">Allowed next actions</span>
                    <strong className="workspaceMetricValue">{nextActions}</strong>
                  </div>
                  <div className="workspaceMetricCard">
                    <span className="workspaceMetricLabel">Contact source</span>
                    <strong className="workspaceMetricValue">{form.contact_source || "none"}</strong>
                  </div>
                  <div className="workspaceMetricCard">
                    <span className="workspaceMetricLabel">Contact confidence</span>
                    <strong className="workspaceMetricValue">{form.contact_confidence}</strong>
                  </div>
                  <div className="workspaceMetricCard">
                    <span className="workspaceMetricLabel">Valid contact status</span>
                    <strong className="workspaceMetricValue">{form.valid_contact_status || "none"}</strong>
                  </div>
                </div>
                <div className="kv workspaceDataList">
                  <div><strong>Company:</strong> {form.company_name || "none"}</div>
                  <div><strong>Store URL:</strong> {form.store_url || "none"}</div>
                  <div><strong>Contact email:</strong> {form.contact_email || "none"}</div>
                  <div><strong>Contact name:</strong> {form.contact_name || "none"}</div>
                  <div><strong>Niche:</strong> {form.niche || "none"}</div>
                  <div><strong>Notes:</strong> {form.contact_notes || form.notes || "none"}</div>
                </div>
              </div>
              <div className="workspaceActionGroup">
                <div className="workspaceSectionHeader">
                  <p className="workspaceSectionEyebrow">Next Step</p>
                  <h3 className="workspaceSectionTitle">{actionLabel}</h3>
                </div>
                <div className="row">
                  {ssrSafeActionOptions.map((option) => (
                    <button
                      key={option.targetStatus}
                      className={`button ${option.targetStatus === "queued" ? "buttonPrimary" : ""}`}
                      type="button"
                      onClick={() => void transitionSelectedRow(option.targetStatus)}
                      disabled={isTransitioning || isLogging}
                    >
                      {isTransitioning ? "Updating..." : option.label}
                    </button>
                  ))}
                </div>
              </div>
              {error ? (
                <p className="hint" style={{ marginTop: 12, color: "#fecaca" }}>
                  {error}
                </p>
              ) : null}
            </>
          ) : null}

          {mode === "work_mode" ? (
            <>
              {relatedBacklogLead ? (
                <div className="workspaceSection workspaceSectionBridge">
                  <div className="workspaceSectionHeader">
                    <p className="workspaceSectionEyebrow">Why This Lead Matters</p>
                    <h3 className="workspaceSectionTitle">Qualified backlog context</h3>
                  </div>
                  <div className="workspaceMetricsGrid">
                    <div className="workspaceMetricCard">
                      <span className="workspaceMetricLabel">Observed issue</span>
                      <strong className="workspaceMetricValue">{relatedBacklogLead.observed_issue}</strong>
                    </div>
                    <div className="workspaceMetricCard">
                      <span className="workspaceMetricLabel">Why it matters</span>
                      <strong className="workspaceMetricValue">{relatedBacklogLead.why_it_matters}</strong>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="workspaceSection">
                <div className="workspaceSectionHeader">
                  <p className="workspaceSectionEyebrow">Active Workspace</p>
                  <h3 className="workspaceSectionTitle">Prepare and Send</h3>
                </div>
                <div className="workspaceMetricsGrid">
                  <div className="workspaceMetricCard">
                    <span className="workspaceMetricLabel">Allowed next actions</span>
                    <strong className="workspaceMetricValue">{nextActions}</strong>
                  </div>
                  <div className="workspaceMetricCard">
                    <span className="workspaceMetricLabel">Admission</span>
                    <strong className="workspaceMetricValue">{form.admission_decision}</strong>
                  </div>
                  <div className="workspaceMetricCard">
                    <span className="workspaceMetricLabel">Priority</span>
                    <strong className="workspaceMetricValue">{form.queue_priority}</strong>
                  </div>
                  <div className="workspaceMetricCard">
                    <span className="workspaceMetricLabel">Review rule</span>
                    <strong className="workspaceMetricValue">Review before send</strong>
                  </div>
                </div>
                <div className="kv workspaceDataList">
                  <div><strong>Contact source:</strong> {form.contact_source || "none"}</div>
                  <div><strong>Contact confidence:</strong> {form.contact_confidence}</div>
                  <div><strong>Valid contact status:</strong> {form.valid_contact_status || "none"}</div>
                  <div><strong>Contact notes:</strong> {form.contact_notes || "none"}</div>
                  <div><strong>ICP score:</strong> {form.icp_score}</div>
                  <div><strong>ICP reasons:</strong> {form.icp_reasons.length ? form.icp_reasons.join(", ") : "none"}</div>
                  <div><strong>Viewed:</strong> {form.tracking.fix_page_view ? form.tracking.fix_page_view : "No"}</div>
                  <div><strong>Clicked:</strong> {form.tracking.fix_cta_click ? form.tracking.fix_cta_click : "No"}</div>
                </div>
              </div>
              <div className="workspaceActionGroup">
                <div className="workspaceSectionHeader">
                  <p className="workspaceSectionEyebrow">Next Step</p>
                  <h3 className="workspaceSectionTitle">{actionLabel}</h3>
                </div>
                {!isSendable ? (
                  <p className="hint" style={{ marginBottom: 12, color: "#fca5a5" }}>
                    Missing required fields to generate outreach
                  </p>
                ) : null}
                {isSendable && missingEmail ? (
                  <p className="hint" style={{ marginBottom: 12, color: "#fcd34d" }}>
                    No email provided — you will need to find contact manually
                  </p>
                ) : null}
                <div className="row">
                  <button className="button buttonPrimary" type="button" onClick={() => void generateDraft()} disabled={isGenerating || isLogging || isTransitioning || !ssrSafeSelectedRowId || !isActiveRow(ssrSafeSelectedRow) || !isSendable}>
                    {isGenerating ? "Generating..." : "Generate outreach draft"}
                  </button>
                  <button
                    className={`button ${ssrSafeSelectedRowId ? "buttonPrimary" : ""}`}
                    type="button"
                    disabled={!ssrSafeSelectedRowId || isLogging || isTransitioning || !isActiveRow(ssrSafeSelectedRow)}
                    onClick={() => void openGmailDraft()}
                  >
                    Open Gmail Draft
                  </button>
                  <button className="button" type="button" onClick={() => void logDraft("draft_generated")} disabled={!ssrSafeSelectedRowId || isLogging || isTransitioning || !isActiveRow(ssrSafeSelectedRow)}>
                    {isLogging ? "Logging..." : "Log Draft Generated"}
                  </button>
                </div>
              </div>
              <div className="workspaceSection">
                <div className="workspaceSectionHeader">
                  <p className="workspaceSectionEyebrow">Input</p>
                  <h3 className="workspaceSectionTitle">Draft Inputs</h3>
                </div>
                <div className="workspaceFormGrid">
                  <label className="label">
                    Company name
                    <input className="input" value={form.company_name} onChange={(event) => updateField("company_name", event.target.value)} placeholder="Veloura Style" />
                  </label>
                  <label className="label">
                    Store URL
                    <input className="input" value={form.store_url} onChange={(event) => updateField("store_url", event.target.value)} placeholder="https://examplestore.com" />
                  </label>
                  <label className="label">
                    Contact email
                    <input className="input" value={form.contact_email} onChange={(event) => updateField("contact_email", event.target.value)} placeholder="owner@store.com" />
                  </label>
                  <label className="label">
                    Niche
                    <input className="input" value={form.niche} onChange={(event) => updateField("niche", event.target.value)} placeholder="fashion, skincare, home decor" />
                  </label>
                  <label className="label">
                    Contact name (optional)
                    <input className="input" value={form.contact_name} onChange={(event) => updateField("contact_name", event.target.value)} placeholder="Taylor" />
                  </label>
                  <label className="label">
                    Template
                    <select className="input" value={form.selected_template} onChange={(event) => updateField("selected_template", event.target.value)}>
                      <option value="observation">observation</option>
                      <option value="short_direct">short_direct</option>
                      <option value="authority">authority</option>
                    </select>
                  </label>
                  <label className="label">
                    Audit URL
                    <input className="input" value={form.audit_url} onChange={(event) => updateField("audit_url", event.target.value)} placeholder={getShopifixerFixBaseUrl()} />
                  </label>
                  <label className="label">
                    Prefilled audit URL
                    <input className="input" value={form.prefilled_audit_url} onChange={(event) => updateField("prefilled_audit_url", event.target.value)} placeholder={getShopifixerFixBaseUrl()} />
                  </label>
                </div>
                <label className="label">
                  Notes
                  <textarea className="textarea compactTextarea" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
                </label>
                <p className="hint" style={{ marginTop: 12 }}>
                  No email is sent automatically. Ross remains the sender.
                </p>
              </div>
              <div className="workspaceSection workspaceSectionDraft">
                <div className="workspaceSectionHeader">
                  <p className="workspaceSectionEyebrow">Output</p>
                  <h3 className="workspaceSectionTitle">Draft Output</h3>
                </div>
                <div className="grid gridTwo">
                  <div>
                    <label className="label">
                      Issue hypothesis
                      <textarea className="textarea compactTextarea" value={form.issue_hypothesis} onChange={(event) => updateField("issue_hypothesis", event.target.value)} />
                    </label>
                  </div>
                  <div>
                    <label className="label">
                      Subject
                      <textarea className="textarea compactTextarea" value={form.subject} onChange={(event) => updateField("subject", event.target.value)} />
                    </label>
                  </div>
                </div>
                <label className="label">
                  Email body
                  <textarea className="textarea promptTextarea" value={form.body} onChange={(event) => updateField("body", event.target.value)} />
                </label>
                <label className="label">
                  Gmail draft URL
                  <div
                    className="textarea compactTextarea"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      minHeight: 72,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#e2e8f0" }}>
                        {form.gmail_draft_url ? "Gmail Draft Ready" : "No Gmail draft generated yet"}
                      </div>
                      <div
                        className="hint"
                        style={{
                          marginTop: 6,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {form.gmail_draft_url ? "mail.google.com compose link prepared for the reviewed draft" : "Generate and save a draft to prepare the Gmail compose link."}
                      </div>
                    </div>
                    {form.gmail_draft_url ? (
                      <a
                        href={form.gmail_draft_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button"
                        style={{ flexShrink: 0 }}
                      >
                        Open Gmail Draft
                      </a>
                    ) : null}
                  </div>
                </label>
                <div className="row" style={{ marginTop: 12 }}>
                  {ssrSafeActionOptions.map((option) => (
                    <button
                      key={option.targetStatus}
                      className={`button ${option.targetStatus === "sent" ? "buttonPrimary" : ""}`}
                      type="button"
                      onClick={() => void transitionSelectedRow(option.targetStatus)}
                      disabled={isTransitioning || isLogging || (option.targetStatus === "sent" && !isSendable)}
                    >
                      {isTransitioning ? "Updating..." : option.label}
                    </button>
                  ))}
                </div>
              </div>
              {error ? (
                <p className="hint" style={{ marginTop: 12, color: "#fecaca" }}>
                  {error}
                </p>
              ) : null}
              {error ? (
                <p className="hint" style={{ marginTop: 12, color: "#fecaca" }}>
                  {error}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </article>
    );
  }

  function renderBacklogWorkspace() {
    const lead = selectedBacklogLead;
    const form = qualifiedLeadForm;
    const currentReviewIssues = lead ? getBacklogReviewIssues(form) : [];
    const currentReviewIssueSet = new Set(currentReviewIssues);

    function renderRequiredLabel(label: string, issueKey: string) {
      const isMissing = currentReviewIssueSet.has(issueKey);
      return (
        <span style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>{label}</span>
          <span
            className="hint"
            style={{ color: isMissing ? "#fecaca" : "#bbf7d0", whiteSpace: "nowrap" }}
          >
            {isMissing ? "Missing" : "Complete"}
          </span>
        </span>
      );
    }

    return (
      <article ref={selectedWorkspaceRef} style={selectedWorkspaceStyle} className="panel selectedWorkspace operatorWorkspace selectedWorkspaceEmpty">
        <div className="panelInner selectedWorkspaceInner">
          <div className="selectedWorkspaceHeader">
            <p className="eyebrow">Selected Row</p>
            <h2 className="selectedWorkspaceTitle">Backlog Lead</h2>
            <div className="selectedWorkspaceMeta">
              <span className="workspaceChip">Row {lead?.id || "none"}</span>
              <span className="workspaceChip workspaceChipStatus workspaceStatEmpty">backlog</span>
              <span className="workspaceChip">Backlog</span>
            </div>
          </div>

          <div className="workspaceStateBar stateBarEmpty">
            <div className="workspaceStateBlock">
              <span className="workspaceStateLabel">Status</span>
              <strong className="workspaceStateValue">backlog</strong>
            </div>
            <div className="workspaceStateBlock">
              <span className="workspaceStateLabel">Section</span>
              <strong className="workspaceStateValue">Backlog</strong>
            </div>
            <div className="workspaceStateBlock workspaceStateBlockPrimary">
              <span className="workspaceStateLabel">Next Action</span>
              <strong className="workspaceStateValue">{lead ? "Move to Active" : "Add or select a backlog lead"}</strong>
            </div>
          </div>

          {lead ? (
            <>
              <div className="workspaceSection">
                <div className="workspaceSectionHeader">
                  <p className="workspaceSectionEyebrow">Review</p>
                  <h3 className="workspaceSectionTitle">{form.company}</h3>
                </div>
                {currentReviewIssues.length > 0 ? (
                  <div className="workspaceSection">
                    <div className="workspaceSectionHeader">
                      <p className="workspaceSectionEyebrow">Checklist</p>
                      <h3 className="workspaceSectionTitle">Review checklist</h3>
                    </div>
                    <div className="kv workspaceDataList">
                      <div><strong>Company:</strong> {currentReviewIssueSet.has("Company") ? "missing" : "complete"}</div>
                      <div><strong>URL:</strong> {currentReviewIssueSet.has("URL") ? "missing" : "complete"}</div>
                      <div><strong>Observed issue:</strong> {currentReviewIssueSet.has("Observed issue") ? "missing" : "complete"}</div>
                      <div><strong>Why it matters:</strong> {currentReviewIssueSet.has("Why it matters") ? "missing" : "complete"}</div>
                      <div><strong>Confidence:</strong> {currentReviewIssueSet.has("Confidence") ? "missing" : "complete"}</div>
                      <div><strong>Lead quality:</strong> {currentReviewIssueSet.has("Lead quality") ? "missing" : "complete"}</div>
                    </div>
                  </div>
                ) : null}
                <div className="workspaceMetricsGrid">
                  <div className="workspaceMetricCard">
                    <span className="workspaceMetricLabel">Observed issue</span>
                    <strong className="workspaceMetricValue">{form.observed_issue}</strong>
                  </div>
                  <div className="workspaceMetricCard">
                    <span className="workspaceMetricLabel">Why it matters</span>
                    <strong className="workspaceMetricValue">{form.why_it_matters}</strong>
                  </div>
                </div>
                <div className="workspaceFormGrid">
                  <label className="label">
                    {renderRequiredLabel("Company", "Company")}
                    <input className="input" value={form.company} onChange={(event) => updateQualifiedLeadField("company", event.target.value)} />
                  </label>
                  <label className="label">
                    {renderRequiredLabel("URL", "URL")}
                    <input className="input" value={form.url} onChange={(event) => updateQualifiedLeadField("url", event.target.value)} />
                  </label>
                  <label className="label">
                    Email
                    <input className="input" value={form.email} onChange={(event) => updateQualifiedLeadField("email", event.target.value)} />
                  </label>
                  <label className="label">
                    Niche
                    <input className="input" value={form.niche} onChange={(event) => updateQualifiedLeadField("niche", event.target.value)} />
                  </label>
                  <label className="label">
                    {renderRequiredLabel("Confidence", "Confidence")}
                    <select className="input" value={form.confidence} onChange={(event) => updateQualifiedLeadField("confidence", event.target.value)}>
                      <option value="high">high</option>
                      <option value="medium">medium</option>
                      <option value="low">low</option>
                    </select>
                  </label>
                  <label className="label">
                    {renderRequiredLabel("Lead quality", "Lead quality")}
                    <select className="input" value={form.lead_quality} onChange={(event) => updateQualifiedLeadField("lead_quality", event.target.value)}>
                      <option value="strong">strong</option>
                      <option value="maybe">maybe</option>
                      <option value="weak">weak</option>
                    </select>
                  </label>
                  <label className="label">
                    Shopify confidence
                    <select className="input" value={form.shopify_confidence} onChange={(event) => updateQualifiedLeadField("shopify_confidence", event.target.value)}>
                      <option value="">unset</option>
                      <option value="high">high</option>
                      <option value="medium">medium</option>
                      <option value="low">low</option>
                    </select>
                  </label>
                  <label className="label">
                    Priority score
                    <input className="input" value={form.priority_score} onChange={(event) => updateQualifiedLeadField("priority_score", event.target.value)} />
                  </label>
                  <label className="label">
                    Contact page
                    <input className="input" value={form.contact_page} onChange={(event) => updateQualifiedLeadField("contact_page", event.target.value)} />
                  </label>
                  <label className="label">
                    Contact hint
                    <input className="input" value={form.contact_hint} onChange={(event) => updateQualifiedLeadField("contact_hint", event.target.value)} />
                  </label>
                </div>
                <label className="label">
                  {renderRequiredLabel("Observed issue", "Observed issue")}
                  <textarea className="textarea compactTextarea" value={form.observed_issue} onChange={(event) => updateQualifiedLeadField("observed_issue", event.target.value)} />
                </label>
                <label className="label">
                  {renderRequiredLabel("Why it matters", "Why it matters")}
                  <textarea className="textarea compactTextarea" value={form.why_it_matters} onChange={(event) => updateQualifiedLeadField("why_it_matters", event.target.value)} />
                </label>
                <div className="kv workspaceDataList">
                  <div><strong>Source:</strong> {form.source}</div>
                  <div><strong>Updated:</strong> {form.updated_at || "none"}</div>
                </div>
              </div>
              <div className="workspaceActionGroup">
                <div className="workspaceSectionHeader">
                  <p className="workspaceSectionEyebrow">Next Step</p>
                  <h3 className="workspaceSectionTitle">Backlog Actions</h3>
                </div>
                {backlogReviewIssues.length > 0 ? (
                  <div className="workspaceSection">
                    <div className="workspaceSectionHeader">
                      <p className="workspaceSectionEyebrow">Validation</p>
                      <h3 className="workspaceSectionTitle">Review required before Active</h3>
                    </div>
                    <p className="emptyStateText">This lead cannot move to Active until these fields are completed:</p>
                    <ul className="workspaceDataList">
                      {backlogReviewIssues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="row">
                  <button
                    className="button"
                    type="button"
                    onClick={() => void saveQualifiedLead()}
                    disabled={isUpdatingQualifiedLead}
                  >
                    {isUpdatingQualifiedLead ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    className="button buttonPrimary"
                    type="button"
                    onClick={() => void stageQualifiedLeadForOutreach()}
                    disabled={isStagingQualifiedLead}
                  >
                    {isStagingQualifiedLead ? "Moving..." : "Move to Active"}
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => void archiveQualifiedLead()}
                    disabled={isUpdatingQualifiedLead}
                  >
                    {isUpdatingQualifiedLead ? "Updating..." : "Archive"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="workspaceSection">
              <div className="workspaceSectionHeader">
                <p className="workspaceSectionEyebrow">Backlog</p>
                <h3 className="workspaceSectionTitle">No backlog lead selected</h3>
              </div>
              <p className="emptyStateText">Choose a backlog lead on the left, then move it into Active when you are ready to work it.</p>
            </div>
          )}
        </div>
      </article>
    );
  }

  function renderSentWorkspace() {
    const lead = selectedSentLead;

    return (
      <article className="panel selectedWorkspace operatorWorkspace selectedWorkspaceSent">
        <div className="panelInner selectedWorkspaceInner">
          <div className="selectedWorkspaceHeader">
            <p className="eyebrow">Selected Row</p>
            <h2 className="selectedWorkspaceTitle">Sent History</h2>
            <div className="selectedWorkspaceMeta">
              <span className="workspaceChip">Row {lead?.id || "none"}</span>
              <span className="workspaceChip workspaceChipStatus workspaceStatSent">sent</span>
              <span className="workspaceChip">Sent</span>
            </div>
          </div>

          <div className="workspaceStateBar stateBarSent">
            <div className="workspaceStateBlock">
              <span className="workspaceStateLabel">Status</span>
              <strong className="workspaceStateValue">sent</strong>
            </div>
            <div className="workspaceStateBlock">
              <span className="workspaceStateLabel">Section</span>
              <strong className="workspaceStateValue">Sent</strong>
            </div>
            <div className="workspaceStateBlock workspaceStateBlockPrimary">
              <span className="workspaceStateLabel">Next Action</span>
              <strong className="workspaceStateValue">{lead ? "Review history only" : "Select a sent lead"}</strong>
            </div>
          </div>

          {lead ? (
            <div className="workspaceSection">
              <div className="workspaceSectionHeader">
                <p className="workspaceSectionEyebrow">Sent Lead</p>
                <h3 className="workspaceSectionTitle">{lead.company}</h3>
              </div>
              <div className="workspaceMetricsGrid">
                <div className="workspaceMetricCard">
                  <span className="workspaceMetricLabel">Observed issue</span>
                  <strong className="workspaceMetricValue">{lead.observed_issue}</strong>
                </div>
                <div className="workspaceMetricCard">
                  <span className="workspaceMetricLabel">Why it matters</span>
                  <strong className="workspaceMetricValue">{lead.why_it_matters}</strong>
                </div>
              </div>
              <div className="kv workspaceDataList">
                <div><strong>Store URL:</strong> {lead.url || "none"}</div>
                <div><strong>Email:</strong> {lead.email || "none"}</div>
                <div><strong>Niche:</strong> {lead.niche || "none"}</div>
                <div><strong>Confidence:</strong> {lead.confidence}</div>
                <div><strong>Lead quality:</strong> {lead.lead_quality}</div>
                <div><strong>Updated:</strong> {lead.updated_at || "none"}</div>
              </div>
            </div>
          ) : (
            <div className="workspaceSection">
              <div className="workspaceSectionHeader">
                <p className="workspaceSectionEyebrow">Sent</p>
                <h3 className="workspaceSectionTitle">No sent lead selected</h3>
              </div>
              <p className="emptyStateText">Select a sent lead on the left to review it without affecting active work.</p>
            </div>
          )}
        </div>
      </article>
    );
  }

  const activeWorkspaceEmpty = selectedLeadView === "active" && activeLeads.length === 0;
  const currentLeadList = selectedLeadView === "active"
    ? activeLeads
    : selectedLeadView === "sent"
      ? sentLeads
      : backlogLeads;

  return (
    <main className="shell shopifixerShell">
      <div className="container shopifixerContainer">
        <header className="panel shopifixerHeader">
          <div className="panelInner shopifixerHeaderInner">
            <div className="shopifixerBrand">
              <img src="/shopifixer-logo.svg" alt="Shopifixer" className="shopifixerLogo" />
              <div>
                <p className="eyebrow">Shopifixer</p>
                <h1 className="title shopifixerTitle">Outreach Console</h1>
              </div>
            </div>
            <p className="shopifixerHeaderCopy">
              Queue on the left. Active execution on the right. Pick the next row and move it forward.
            </p>
            <div className="row navRow">
              <Link href="/operator/products" className="chip navChipActive">
                Products
              </Link>
              <span className="chip">Shopifixer</span>
              <span className="chip">Outreach Console</span>
            </div>
          </div>
        </header>

        <section className="operatorGrid">
          <aside className="panel queueRail">
            <div className="panelInner queueRailInner">
              <div className="queueRailHeader">
                <div>
                  <p className="eyebrow">Canonical Leads</p>
                  <h2 className="queueRailTitle">Lead Rail</h2>
                </div>
                <p className="queueRailHint">
                  One store. Three views. Intake to backlog, refill to active, then send into history.
                </p>
              </div>

              <div className="leadViewPills">
                {(["backlog", "active", "sent"] as LeadView[]).map((view) => (
                  <button
                    key={view}
                    type="button"
                    className={`leadViewPill ${selectedLeadView === view ? "leadViewPillActive" : ""}`}
                    onClick={() => setSelectedLeadView(view)}
                  >
                    {LEAD_VIEW_LABELS[view]}
                    <span className="leadViewPillCount">
                      {view === "backlog" ? backlogLeads.length : view === "active" ? activeLeads.length : sentLeads.length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="queueRailControls">
                <label className="label queueRailRefillLabel">
                  Refill count
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="10"
                    value={refillCount}
                    onChange={(event) => setRefillCount(event.target.value)}
                  />
                </label>
                <button
                  className="button buttonPrimary"
                  type="button"
                  onClick={() => void refillActiveLeads()}
                  disabled={isRefillingQueue || backlogLeads.length === 0}
                >
                  {isRefillingQueue ? "Refilling..." : "Refill Active"}
                </button>
              </div>

              {(backlogLeads.length === 0 && activeLeads.length === 0) ? (
                <div className="queueStatusBanner">
                  No backlog leads available. Import CSV or add a qualified lead to continue.
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="button" type="button" onClick={focusBacklogIntake}>
                      Add Qualified Lead
                    </button>
                    <button className="button" type="button" onClick={triggerCsvImport}>
                      Import CSV
                    </button>
                  </div>
                </div>
              ) : null}

              {statusMessage ? (
                <div className="queueStatusBanner">
                  <strong>Latest:</strong> {statusMessage}
                </div>
              ) : null}

              {leadBacklogMessage ? (
                <div className="queueStatusBanner">
                  <strong>Leads:</strong> {leadBacklogMessage}
                </div>
              ) : null}

              {leadBacklogError ? (
                <div className="queueStatusBanner queueStatusBannerError">
                  <strong>Error:</strong> {leadBacklogError}
                </div>
              ) : null}

              {isLoadingLeadBacklog && !hasLoadedLeadBacklog ? (
                <p className="emptyStateText queueLoadingText">Loading canonical leads...</p>
              ) : currentLeadList.length ? (
                <div className="leadPipelineCards">
                  {currentLeadList.map((lead) => (
                    (() => {
                      const confidenceDisplay = getLeadConfidenceDisplay(lead.confidence);
                      const leadQualityDisplay = getLeadQualityDisplay(lead.lead_quality);
                      const reviewIssues = lead.status === "backlog" ? getBacklogReviewIssues(lead) : [];
                      const isReadyForActive = reviewIssues.length === 0;

                      return (
                        <button
                          key={lead.id}
                          type="button"
                          className={`leadPipelineCard ${lead.id === selectedLeadId ? "leadPipelineCardSelected" : ""}`}
                          onClick={() => {
                            if (selectedLeadView === "active") {
                              selectActiveLead(lead);
                              return;
                            }
                            if (selectedLeadView === "sent") {
                              selectSentLead(lead);
                              return;
                            }
                            selectBacklogLead(lead);
                          }}
                        >
                          <div className="leadPipelineCardTop">
                            <strong>{lead.company}</strong>
                            <span className={`leadBadge leadBadge${confidenceDisplay[0].toUpperCase()}${confidenceDisplay.slice(1)}`}>
                              {confidenceDisplay}
                            </span>
                          </div>
                          <p className="leadPipelineCardUrl">{lead.url}</p>
                          <div className="leadPipelineCardMeta">
                            <span className={`leadBadge leadQualityBadge${leadQualityDisplay[0].toUpperCase()}${leadQualityDisplay.slice(1)}`}>
                              {leadQualityDisplay}
                            </span>
                            <span className="leadPipelineStatus">{LEAD_STATUS_LABELS[lead.status]}</span>
                            {lead.status === "backlog" ? (
                              <span className={`leadBadge ${isReadyForActive ? "leadQualityBadgeStrong" : "leadQualityBadgeWeak"}`}>
                                {isReadyForActive ? "Ready" : "Review required"}
                              </span>
                            ) : null}
                          </div>
                          <p className="leadPipelineIssue">{shortenLeadIssue(lead.observed_issue)}</p>
                          {lead.status === "backlog" && !isReadyForActive ? (
                            <p className="leadPipelineIssue">Missing: {reviewIssues[0]}</p>
                          ) : null}
                        </button>
                      );
                    })()
                  ))}
                </div>
              ) : (
                <p className="emptyStateText">
                  {selectedLeadView === "active"
                    ? "No active leads. Refill from backlog."
                    : selectedLeadView === "sent"
                      ? "No sent leads yet."
                      : "No backlog leads yet."}
                </p>
              )}

              <div className="queueRailIntake">
                <div className="workspaceSectionHeader">
                  <p className="workspaceSectionEyebrow">Canonical Intake</p>
                  <h3 className="workspaceSectionTitle">Add to Backlog</h3>
                </div>
                <div className="workspaceFormGrid">
                  <label className="label">
                    Company
                    <input ref={backlogCompanyInputRef} className="input" value={backlogIntakeForm.company} onChange={(event) => updateBacklogIntakeField("company", event.target.value)} placeholder="Northstar Atelier" />
                  </label>
                  <label className="label">
                    URL
                    <input className="input" value={backlogIntakeForm.url} onChange={(event) => updateBacklogIntakeField("url", event.target.value)} placeholder="https://northstaratelier.com" />
                  </label>
                  <label className="label">
                    Email
                    <input className="input" value={backlogIntakeForm.email} onChange={(event) => updateBacklogIntakeField("email", event.target.value)} placeholder="founder@northstaratelier.com" />
                  </label>
                  <label className="label">
                    Niche
                    <input className="input" value={backlogIntakeForm.niche} onChange={(event) => updateBacklogIntakeField("niche", event.target.value)} placeholder="fashion" />
                  </label>
                  <label className="label">
                    Confidence
                    <select className="input" value={backlogIntakeForm.confidence} onChange={(event) => updateBacklogIntakeField("confidence", event.target.value)}>
                      <option value="high">high</option>
                      <option value="medium">medium</option>
                      <option value="low">low</option>
                    </select>
                  </label>
                  <label className="label">
                    Lead quality
                    <select className="input" value={backlogIntakeForm.lead_quality} onChange={(event) => updateBacklogIntakeField("lead_quality", event.target.value)}>
                      <option value="strong">strong</option>
                      <option value="maybe">maybe</option>
                      <option value="weak">weak</option>
                    </select>
                  </label>
                </div>
                <label className="label">
                  Observed issue
                  <textarea className="textarea compactTextarea" value={backlogIntakeForm.observed_issue} onChange={(event) => updateBacklogIntakeField("observed_issue", event.target.value)} />
                </label>
                <label className="label">
                  Why it matters
                  <textarea className="textarea compactTextarea" value={backlogIntakeForm.why_it_matters} onChange={(event) => updateBacklogIntakeField("why_it_matters", event.target.value)} />
                </label>
                <div className="row">
                  <button className="button buttonPrimary" type="button" onClick={() => void addQualifiedLead()} disabled={isSavingQualifiedLead}>
                    {isSavingQualifiedLead ? "Saving..." : "Add Qualified Lead"}
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setBacklogIntakeForm(EMPTY_QUALIFIED_LEAD_FORM);
                    }}
                  >
                    Clear Form
                  </button>
                  <button className="button" type="button" onClick={triggerCsvImport} disabled={isImportingCsv}>
                    {isImportingCsv ? "Importing..." : "Import CSV"}
                  </button>
                </div>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hiddenFileInput"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void importCsvFile(file);
                    }
                  }}
                />
              </div>
            </div>
          </aside>

          {selectedLeadView === "active"
            ? activeWorkspaceEmpty
              ? (
                <article ref={selectedWorkspaceRef} style={selectedWorkspaceStyle} className="panel selectedWorkspace operatorWorkspace selectedWorkspaceEmpty">
                  <div className="panelInner selectedWorkspaceInner">
                    <div className="selectedWorkspaceHeader">
                      <p className="eyebrow">Selected Row</p>
                      <h2 className="selectedWorkspaceTitle">Active Workspace</h2>
                      <div className="selectedWorkspaceMeta">
                        <span className="workspaceChip">Row none</span>
                        <span className="workspaceChip workspaceChipStatus workspaceStatEmpty">no active lead</span>
                        <span className="workspaceChip">Active</span>
                      </div>
                    </div>
                    <div className="workspaceStateBar stateBarEmpty">
                      <div className="workspaceStateBlock">
                        <span className="workspaceStateLabel">Status</span>
                        <strong className="workspaceStateValue">empty</strong>
                      </div>
                      <div className="workspaceStateBlock">
                        <span className="workspaceStateLabel">Section</span>
                        <strong className="workspaceStateValue">Active</strong>
                      </div>
                      <div className="workspaceStateBlock workspaceStateBlockPrimary">
                        <span className="workspaceStateLabel">Next Action</span>
                        <strong className="workspaceStateValue">{backlogLeads.length ? "Refill Active" : "No leads to work"}</strong>
                      </div>
                    </div>
                    <div className="workspaceSection">
                      <div className="workspaceSectionHeader">
                        <p className="workspaceSectionEyebrow">Active</p>
                        <h3 className="workspaceSectionTitle">{backlogLeads.length ? "No active leads" : "No leads to work"}</h3>
                      </div>
                      <p className="emptyStateText">
                        {backlogLeads.length ? "Refill from backlog to move the next leads into active work." : "No leads to work"}
                      </p>
                      {backlogLeads.length ? (
                        <div className="row" style={{ marginTop: 12 }}>
                          <button className="button buttonPrimary" type="button" onClick={() => void refillActiveLeads()} disabled={isRefillingQueue}>
                            {isRefillingQueue ? "Refilling..." : "Refill Active"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
              : renderSelectedRowPanels(renderMode, ssrSafeSelectedRow)
            : selectedLeadView === "sent"
              ? renderSentWorkspace()
              : (backlogLeads.length === 0 && activeLeads.length === 0)
                ? renderSelectedRowPanels("empty_mode", null)
              : renderBacklogWorkspace()}
        </section>
      </div>
    </main>
  );
}
