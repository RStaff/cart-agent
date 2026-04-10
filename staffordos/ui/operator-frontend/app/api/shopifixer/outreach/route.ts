import { NextResponse } from "next/server";
import { generateShopifixerMessage } from "../../../../../../products/shopifixer/assisted/generate_message.js";
import { appendShopifixerOutreachLog, LOG_PATH } from "../../../../../../products/shopifixer/assisted/log_outreach.js";
import {
  ACTIVE_QUEUE_STATUSES,
  buildQueueRowFromLead,
  getQueueRow,
  LEADS_STORE_PATH,
  promoteLeadToActive,
  readDerivedQueue,
  readLeads,
  refillQueueFromBacklog,
  transitionLeadQueueState,
  updateLeadOutreachFields,
} from "../../../../../../products/shopifixer/assisted/leads_store.js";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function mapCanonicalLeadStatusToQueueStatus(status: string) {
  if (status === "sent") {
    return "sent";
  }

  if (status === "archived") {
    return "archived";
  }

  return "queued";
}

function getCanonicalQueue() {
  const statusRank: Record<string, number> = {
    queued: 0,
    sent: 1,
    archived: 2,
  };

  return readLeads()
    .filter((lead) => ["backlog", "active", "sent", "archived"].includes(cleanText(lead.status)))
    .map((lead) => {
      const row = buildQueueRowFromLead(lead);
      const { _lead, ...queueRow } = row;

      return {
        ...queueRow,
        status: mapCanonicalLeadStatusToQueueStatus(cleanText(lead.status)),
        last_status_changed_at: cleanText(lead.last_status_changed_at) || cleanText(lead.updated_at),
      };
    })
    .sort((left, right) =>
      (statusRank[left.status] ?? 99) - (statusRank[right.status] ?? 99)
      || cleanText(right.last_status_changed_at).localeCompare(cleanText(left.last_status_changed_at))
      || cleanText(left.id).localeCompare(cleanText(right.id))
    );
}

function resolveCanonicalLeadForDraft(selectedRowId: string) {
  const normalizedSelectedRowId = cleanText(selectedRowId);
  if (!normalizedSelectedRowId) {
    return null;
  }

  const canonicalRow = getCanonicalQueue().find((row) =>
    cleanText(row.id) === normalizedSelectedRowId
    || cleanText(row.source_lead_id) === normalizedSelectedRowId
  );

  if (!canonicalRow?.source_lead_id) {
    return null;
  }

  const canonicalLead = readLeads().find((lead) => cleanText(lead.id) === cleanText(canonicalRow.source_lead_id)) || null;
  if (!canonicalLead) {
    return null;
  }

  return {
    lead: canonicalLead,
    row: buildQueueRowFromLead(canonicalLead),
  };
}

function normalizeInput(input: Record<string, unknown>) {
  return {
    company_name: cleanText(input.company_name),
    store_url: cleanText(input.store_url),
    contact_email: cleanText(input.contact_email),
    niche: cleanText(input.niche),
    contact_name: cleanText(input.contact_name),
    issue_hypothesis: cleanText(input.issue_hypothesis),
    recommended_template: cleanText(input.recommended_template) || "observation",
    selected_template: cleanText(input.selected_template) || cleanText(input.recommended_template) || "observation",
    subject: cleanText(input.subject),
    body: cleanText(input.body),
    audit_url: cleanText(input.audit_url),
    prefilled_audit_url: cleanText(input.prefilled_audit_url),
    icp_score: Number(input.icp_score || 0) || 0,
    icp_reasons: Array.isArray(input.icp_reasons) ? input.icp_reasons.map((reason) => cleanText(reason)).filter(Boolean) : [],
    queue_priority: cleanText(input.queue_priority) || "low",
    site_reachable: Boolean(input.site_reachable),
    contact_source: cleanText(input.contact_source),
    contact_confidence: cleanText(input.contact_confidence) || "low",
    has_real_contact_path: Boolean(input.has_real_contact_path),
    valid_contact_status: cleanText(input.valid_contact_status),
    contact_notes: cleanText(input.contact_notes),
    notes: cleanText(input.notes),
    gmail_draft_url: cleanText(input.gmail_draft_url),
    tracking: input.tracking,
  };
}

function getActiveQueue(rows: ReturnType<typeof readDerivedQueue>) {
  const draftGenerated = rows.filter((row) => row.status === "draft_generated");
  const queued = rows.filter((row) => row.status === "queued");
  return [...draftGenerated, ...queued];
}

function isVisibleStatus(status: string) {
  return ["queued", "draft_generated", "review_needed", "sent"].includes(status);
}

function getVisibleQueue(rows: ReturnType<typeof readDerivedQueue>) {
  return rows.filter((row) => isVisibleStatus(row.status));
}

function getNextActiveRowId(previousQueue: ReturnType<typeof readDerivedQueue>, refreshedQueue: ReturnType<typeof readDerivedQueue>, currentRowId: string) {
  const previousActiveQueue = getActiveQueue(previousQueue);
  const refreshedActiveQueue = getActiveQueue(refreshedQueue);
  const previousIndex = previousActiveQueue.findIndex((row) => row.id === currentRowId);

  if (previousIndex === -1 || refreshedActiveQueue.length === 0) {
    return refreshedActiveQueue[0]?.id || "";
  }

  const findFromIndex = (status: "draft_generated" | "queued") =>
    refreshedActiveQueue.slice(previousIndex).find((row) => row.status === status)?.id || "";
  const findFirst = (status: "draft_generated" | "queued") =>
    refreshedActiveQueue.find((row) => row.status === status)?.id || "";

  return (
    findFromIndex("draft_generated")
    || findFirst("draft_generated")
    || findFromIndex("queued")
    || findFirst("queued")
    || ""
  );
}

function getNextSelectedRowId(previousQueue: ReturnType<typeof readDerivedQueue>, refreshedQueue: ReturnType<typeof readDerivedQueue>, currentRowId: string) {
  const refreshedVisibleQueue = getVisibleQueue(refreshedQueue);
  const stillVisible = refreshedVisibleQueue.find((row) => row.id === currentRowId);
  if (stillVisible) {
    return stillVisible.id;
  }

  return getNextActiveRowId(previousQueue, refreshedQueue, currentRowId);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    console: {
      product: "shopifixer",
      surface: "StaffordOS -> Products -> Shopifixer -> Outreach Console",
      logPath: LOG_PATH,
      queuePath: LEADS_STORE_PATH,
      allowedStatuses: [...ACTIVE_QUEUE_STATUSES, "sent", "archived"],
      operatorRequired: true,
      state_owner: "qualified_leads_store",
    },
    queue: getCanonicalQueue(),
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      action?: string;
      selected_row_id?: string;
      lead_id?: string;
      input?: Record<string, unknown>;
      status?: string;
      draft?: Record<string, unknown>;
      count?: number;
      event?: string;
      store?: string;
    };

    const action = cleanText(payload.action).toLowerCase();
    const input = normalizeInput(payload.input || {});
    const selectedRowId = cleanText(payload.selected_row_id || payload.lead_id);

    if (action === "get_queue") {
      return NextResponse.json({
        ok: true,
        queue: getCanonicalQueue(),
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "promote_lead") {
      const leadId = cleanText(payload.lead_id || selectedRowId);
      if (!leadId) {
        return NextResponse.json({ ok: false, error: "lead_id_missing" }, { status: 400 });
      }

      const result = promoteLeadToActive(leadId);
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error, leads: result.leads, queue: result.queue }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        no_op: Boolean(result.no_op),
        lead: result.lead,
        queue_row: result.queue_row,
        queue: result.queue,
        leads: result.leads,
        next_active_row_id: result.queue_row?.id || "",
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "refill_queue") {
      const result = refillQueueFromBacklog(Number(payload.count || payload.input?.count || 10) || 10);
      return NextResponse.json({
        ok: true,
        promoted_count: result.promoted_count,
        promoted_leads: result.promoted_leads,
        message: result.message,
        queue: result.queue,
        leads: result.leads,
        next_active_row_id: result.next_active_row_id,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "generate") {
      if (!selectedRowId) {
        return NextResponse.json({ ok: false, error: "selected_row_id_missing" }, { status: 400 });
      }

      const canonicalSource = resolveCanonicalLeadForDraft(selectedRowId);
      if (!canonicalSource) {
        return NextResponse.json({ ok: false, error: "canonical_lead_not_found_for_draft_generation" }, { status: 400 });
      }

      const source = {
        ...canonicalSource.row,
        issue_hypothesis: cleanText(canonicalSource.lead.observed_issue) || cleanText(canonicalSource.lead.issue_hypothesis),
        why_it_matters: cleanText(canonicalSource.lead.why_it_matters),
        notes: cleanText(canonicalSource.lead.why_it_matters) || cleanText(canonicalSource.lead.notes),
        subject: "",
        body: "",
        gmail_draft_url: "",
      };
      if (!source.store_url) {
        return NextResponse.json({ ok: false, errors: ["store_url_missing"] }, { status: 400 });
      }

      const draft = generateShopifixerMessage(source);
      const saveResult = updateLeadOutreachFields(canonicalSource.lead.id, {
        ...source,
        ...draft,
      });
      if (!saveResult.ok) {
        return NextResponse.json({ ok: false, error: saveResult.error || "save_failed" }, { status: 400 });
      }

      const transition = transitionLeadQueueState(canonicalSource.lead.id, "draft_generated");
      if (!transition.ok) {
        return NextResponse.json({ ok: false, error: transition.reason || "transition_failed" }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        draft,
        queue_row: transition.queue_row,
        queue: transition.queue,
        validator: {
          ok: true,
          errors: [],
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "save_review") {
      if (!selectedRowId) {
        return NextResponse.json({ ok: false, error: "selected_row_id_missing" }, { status: 400 });
      }

      const saveResult = updateLeadOutreachFields(selectedRowId, {
        ...input,
        prefilled_audit_url: input.prefilled_audit_url || input.audit_url,
      });
      if (!saveResult.ok || !saveResult.lead) {
        return NextResponse.json({ ok: false, error: saveResult.error || "save_failed" }, { status: 400 });
      }

      const draft = generateShopifixerMessage(buildQueueRowFromLead(saveResult.lead));
      const persistedDraft = updateLeadOutreachFields(selectedRowId, {
        ...input,
        ...draft,
      });
      if (!persistedDraft.ok) {
        return NextResponse.json({ ok: false, error: persistedDraft.error || "save_failed" }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        queue_row: persistedDraft.queue_row,
        gmail_draft_url: draft.gmail_draft_url,
        queue: persistedDraft.queue,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "log") {
      const draft = payload.draft && typeof payload.draft === "object" ? payload.draft : {};
      const normalizedDraft = normalizeInput(draft as Record<string, unknown>);
      const source = selectedRowId ? getQueueRow(selectedRowId) : null;
      if (!source) {
        return NextResponse.json({ ok: false, error: "selected_row_id_missing" }, { status: 400 });
      }

      const gmailDraftUrl = generateShopifixerMessage({
        ...source,
        ...normalizedDraft,
      }).gmail_draft_url;

      const requestedStatus = cleanText(payload.status).toLowerCase();
      const queueBeforeUpdate = readDerivedQueue();

      const savedDraft = updateLeadOutreachFields(selectedRowId, {
        ...source,
        ...normalizedDraft,
        gmail_draft_url: cleanText((draft as Record<string, unknown>).gmail_draft_url) || gmailDraftUrl,
      });
      if (!savedDraft.ok || !savedDraft.lead) {
        return NextResponse.json({ ok: false, error: savedDraft.error || "save_failed" }, { status: 400 });
      }

      let updatedRow = savedDraft.queue_row;
      if (requestedStatus === "draft_generated") {
        const transition = transitionLeadQueueState(selectedRowId, "draft_generated");
        if (!transition.ok) {
          return NextResponse.json({ ok: false, error: transition.reason || "transition_failed" }, { status: 400 });
        }
        updatedRow = transition.queue_row;
      }

      if (requestedStatus === "sent") {
        const transition = transitionLeadQueueState(selectedRowId, "sent");
        if (!transition.ok) {
          return NextResponse.json({ ok: false, error: transition.reason || "transition_failed" }, { status: 400 });
        }
        updatedRow = transition.queue_row;
      }

      let refreshedQueue = readDerivedQueue();
      let refreshedLeads = readLeads();
      let nextActiveRowId = requestedStatus === "sent" && selectedRowId
        ? getNextActiveRowId(queueBeforeUpdate, refreshedQueue, selectedRowId)
        : "";

      if (requestedStatus === "sent" && !nextActiveRowId) {
        const refill = refillQueueFromBacklog(1);
        refreshedQueue = refill.queue;
        refreshedLeads = refill.leads;
        nextActiveRowId = refill.next_active_row_id || "";
      }

      appendShopifixerOutreachLog({
        ...source,
        ...normalizedDraft,
        issue_hypothesis: cleanText((draft as Record<string, unknown>).issue_hypothesis) || source.issue_hypothesis,
        subject: cleanText((draft as Record<string, unknown>).subject) || source.subject,
        body: cleanText((draft as Record<string, unknown>).body) || source.body,
        gmail_draft_url: cleanText((draft as Record<string, unknown>).gmail_draft_url) || gmailDraftUrl,
        status: requestedStatus,
      });

      return NextResponse.json({
        ok: true,
        queue_row: updatedRow,
        queue: refreshedQueue,
        next_active_row_id: nextActiveRowId,
        leads: refreshedLeads,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "transition") {
      if (!selectedRowId) {
        return NextResponse.json({ ok: false, error: "selected_row_id_missing" }, { status: 400 });
      }

      const targetStatus = cleanText(payload.status).toLowerCase();
      const queueBeforeUpdate = readDerivedQueue();
      const transition = transitionLeadQueueState(selectedRowId, targetStatus);
      if (!transition.ok) {
        const transitionError = "reason" in transition && transition.reason
          ? transition.reason
          : "error" in transition && transition.error
            ? transition.error
            : "invalid_transition";
        return NextResponse.json({
          ok: false,
          error: transitionError,
          queue: transition.queue,
          queue_row: transition.queue_row,
        }, { status: 400 });
      }

      if ((targetStatus === "sent") && transition.queue_row) {
        appendShopifixerOutreachLog({
          ...transition.queue_row,
          status: "sent",
        });
      }

      let queue = transition.queue;
      let leads = readLeads();
      let nextActiveRowId = getNextActiveRowId(queueBeforeUpdate, queue, selectedRowId);

      if (targetStatus === "sent" && !nextActiveRowId) {
        const refill = refillQueueFromBacklog(1);
        queue = refill.queue;
        leads = refill.leads;
        nextActiveRowId = refill.next_active_row_id || "";
      }

      const nextSelectedRowId = targetStatus === "sent"
        ? nextActiveRowId
        : getNextSelectedRowId(queueBeforeUpdate, queue, selectedRowId);
      return NextResponse.json({
        ok: true,
        queue_row: transition.queue_row,
        queue,
        next_selected_row_id: nextSelectedRowId,
        next_active_row_id: nextActiveRowId,
        no_op: transition.no_op,
        leads,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: false, error: "unsupported_action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "shopifixer_outreach_failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
