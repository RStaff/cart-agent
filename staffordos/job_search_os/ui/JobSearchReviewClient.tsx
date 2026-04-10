// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";

type QueueRecord = {
  job_id: string;
  company: string;
  title: string;
  total_score: number;
  recommendation: string;
  queue_priority: string;
  priority_score: number;
  next_best_action: string;
  priority_reasoning: string;
  strongest_angles: string[];
  risk_flags: string[];
  draft_state: string;
  approval_state: string;
  follow_up_status: string;
  next_follow_up_at: string;
};

type ApplicationRecord = {
  job_id: string;
  company: string;
  title: string;
  recommendation: string;
  approval_state: string;
  draft_state: string;
  tailored_resume_markdown: string;
  selected_resume_blocks: string[];
  strongest_angles: string[];
  risk_flags: string[];
  score_reasoning: string;
  notes: string;
};

type QueueResponse = {
  ok: boolean;
  groups?: Record<string, QueueRecord[]>;
};

type ApplicationsResponse = {
  ok: boolean;
  applications?: ApplicationRecord[];
};

type AnalyticsSummary = {
  pipeline_metrics: {
    total_jobs: number;
    pursue_count: number;
    stretch_pursue_count: number;
    skip_count: number;
    draft_count: number;
    approved_count: number;
    ready_count: number;
    submitted_count: number;
    follow_up_due_count: number;
    follow_up_sent_count: number;
    rejected_count: number;
    critical_count: number;
    high_count: number;
  };
  current_work_summary: {
    drafts_needing_review: number;
    approved_not_ready: number;
    ready_not_submitted: number;
    follow_ups_due_today: number;
    top_high_score_unreviewed_jobs: Array<{
      job_id: string;
      company: string;
      title: string;
      total_score: number;
      recommendation: string;
    }>;
  };
  top_role_families: Array<{ key: string; count: number }>;
  top_strongest_angles: Array<{ key: string; count: number }>;
  top_actions_due?: Array<{ action: string; count: number }>;
};

type AnalyticsSummaryResponse = {
  ok: boolean;
  summary?: AnalyticsSummary;
};

function sortQueue(items: QueueRecord[], sortBy: string) {
  const sorted = [...items];

  if (sortBy === "recommendation") {
    return sorted.sort((a, b) => a.recommendation.localeCompare(b.recommendation) || b.total_score - a.total_score);
  }

  if (sortBy === "approval_state") {
    return sorted.sort((a, b) => a.approval_state.localeCompare(b.approval_state) || b.total_score - a.total_score);
  }

  if (sortBy === "draft_state") {
    return sorted.sort((a, b) => a.draft_state.localeCompare(b.draft_state) || b.total_score - a.total_score);
  }

  if (sortBy === "priority_score") {
    return sorted.sort((a, b) => b.priority_score - a.priority_score || b.total_score - a.total_score);
  }

  return sorted.sort((a, b) => b.total_score - a.total_score);
}

function priorityColors(priority: string) {
  if (priority === "critical") {
    return { background: "#fef3f2", border: "#fda29b", color: "#b42318" };
  }

  if (priority === "high") {
    return { background: "#fffaeb", border: "#fec84b", color: "#b54708" };
  }

  if (priority === "medium") {
    return { background: "#f5f8ff", border: "#b2ccff", color: "#175cd3" };
  }

  return { background: "#f8f9fc", border: "#d0d5dd", color: "#344054" };
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  return response.json();
}

export function JobSearchReviewClient() {
  const [queue, setQueue] = useState<QueueRecord[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [filterRecommendation, setFilterRecommendation] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");
  const [filterDraft, setFilterDraft] = useState("all");
  const [sortBy, setSortBy] = useState("total_score");
  const [notesDraft, setNotesDraft] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const [queueResponse, applicationsResponse, analyticsResponse] = await Promise.all([
      readJson<QueueResponse>("/api/job-search/queue"),
      readJson<ApplicationsResponse>("/api/job-search/applications"),
      readJson<AnalyticsSummaryResponse>("/api/job-search/analytics/summary"),
    ]);

    const flattenedQueue = Object.values(queueResponse.groups || {})
      .flat()
      .filter((item, index, list) =>
        list.findIndex((candidate) => candidate.job_id === item.job_id) === index
      );

    setQueue(flattenedQueue);
    setApplications(applicationsResponse.applications || []);
    setAnalyticsSummary(analyticsResponse.summary || null);

    if (!selectedJobId && flattenedQueue[0]?.job_id) {
      setSelectedJobId(flattenedQueue[0].job_id);
    }
  }

  useEffect(() => {
    loadData().catch(() => setError("Failed to load Job Search OS review data."));
  }, []);

  const selectedApplication = applications.find((application) => application.job_id === selectedJobId);
  const selectedQueueRecord = queue.find((item) => item.job_id === selectedJobId);
  const doNextItems = useMemo(() => sortQueue(queue, "priority_score").slice(0, 5), [queue]);

  useEffect(() => {
    setNotesDraft(selectedApplication?.notes || "");
  }, [selectedApplication?.job_id, selectedApplication?.notes]);

  const visibleQueue = useMemo(() => {
    return sortQueue(
      queue.filter((item) => {
        if (filterRecommendation !== "all" && item.recommendation !== filterRecommendation) return false;
        if (filterApproval !== "all" && item.approval_state !== filterApproval) return false;
        if (filterDraft !== "all" && item.draft_state !== filterDraft) return false;
        return true;
      }),
      sortBy,
    );
  }, [filterApproval, filterDraft, filterRecommendation, queue, sortBy]);

  async function runQueueAction(action: "approve" | "skip" | "mark_draft_ready") {
    if (!selectedJobId) return;
    setBusyAction(action);
    setError("");

    try {
      await readJson("/api/job-search/queue", {
        method: "POST",
        body: JSON.stringify({ action, job_id: selectedJobId }),
      });
      await loadData();
    } catch {
      setError("Queue action failed.");
    } finally {
      setBusyAction("");
    }
  }

  async function createDraft() {
    if (!selectedJobId) return;
    setBusyAction("create_draft");
    setError("");

    try {
      await readJson("/api/job-search/applications", {
        method: "POST",
        body: JSON.stringify({ job_id: selectedJobId }),
      });
      await loadData();
    } catch {
      setError("Draft creation failed. Check seeded jobs, candidate profile, resume blocks, and canonical resume in review_state.json.");
    } finally {
      setBusyAction("");
    }
  }

  async function saveNotes() {
    if (!selectedJobId) return;
    setBusyAction("save_notes");
    setError("");

    try {
      await readJson(`/api/job-search/applications/${encodeURIComponent(selectedJobId)}/notes`, {
        method: "POST",
        body: JSON.stringify({ notes: notesDraft }),
      });
      await loadData();
    } catch {
      setError("Notes update failed.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Job Search OS</h1>
        <p style={{ marginTop: 8, color: "#5b6472" }}>
          Review scored jobs, inspect draft state, and approve or skip with no submission side effects.
        </p>
        {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}
      </div>

      {analyticsSummary ? (
        <section style={{ border: "1px solid #d0d5dd", borderRadius: 12, padding: 16, background: "#fff", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><strong>Total Jobs</strong><div>{analyticsSummary.pipeline_metrics.total_jobs}</div></div>
            <div><strong>Pursue</strong><div>{analyticsSummary.pipeline_metrics.pursue_count}</div></div>
            <div><strong>Drafts</strong><div>{analyticsSummary.pipeline_metrics.draft_count}</div></div>
            <div><strong>Follow-Ups Due</strong><div>{analyticsSummary.pipeline_metrics.follow_up_due_count}</div></div>
            <div><strong>Critical</strong><div>{analyticsSummary.pipeline_metrics.critical_count}</div></div>
            <div><strong>High</strong><div>{analyticsSummary.pipeline_metrics.high_count}</div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 16 }}>
            <div>
              <strong>What To Do Now</strong>
              <div>Drafts needing review: {analyticsSummary.current_work_summary.drafts_needing_review}</div>
              <div>Approved not ready: {analyticsSummary.current_work_summary.approved_not_ready}</div>
              <div>Ready not submitted: {analyticsSummary.current_work_summary.ready_not_submitted}</div>
              <div>Follow-ups due today: {analyticsSummary.current_work_summary.follow_ups_due_today}</div>
              {analyticsSummary.current_work_summary.top_high_score_unreviewed_jobs.length ? (
                <div style={{ marginTop: 8 }}>
                  <div><strong>Top High-Score Unreviewed</strong></div>
                  {analyticsSummary.current_work_summary.top_high_score_unreviewed_jobs.map((job) => (
                    <div key={job.job_id}>
                      {job.company} | {job.title} | {job.total_score}
                    </div>
                  ))}
                </div>
              ) : null}
              {analyticsSummary.top_actions_due?.length ? (
                <div style={{ marginTop: 8 }}>
                  <div><strong>Top Actions Due</strong></div>
                  {analyticsSummary.top_actions_due.map((item) => (
                    <div key={item.action}>{item.action}: {item.count}</div>
                  ))}
                </div>
              ) : null}
            </div>
            <div>
              <strong>Top Role Families</strong>
              {analyticsSummary.top_role_families.length ? analyticsSummary.top_role_families.map((item) => (
                <div key={item.key}>{item.key}: {item.count}</div>
              )) : <div>None</div>}
            </div>
            <div>
              <strong>Top Angles</strong>
              {analyticsSummary.top_strongest_angles.length ? analyticsSummary.top_strongest_angles.map((item) => (
                <div key={item.key}>{item.key}: {item.count}</div>
              )) : <div>None</div>}
            </div>
          </div>
        </section>
      ) : null}

      {doNextItems.length ? (
        <section style={{ border: "1px solid #d0d5dd", borderRadius: 12, padding: 16, background: "#fff", marginBottom: 20 }}>
          <strong>Do Next</strong>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {doNextItems.map((item) => {
              const colors = priorityColors(item.queue_priority);
              return (
                <button
                  key={`do-next-${item.job_id}`}
                  type="button"
                  onClick={() => setSelectedJobId(item.job_id)}
                  style={{
                    textAlign: "left",
                    border: "1px solid #d0d5dd",
                    background: "#fcfcfd",
                    borderRadius: 10,
                    padding: 12,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.company} | {item.title}</div>
                      <div style={{ fontSize: 13, color: "#475467", marginTop: 4 }}>
                        {item.next_best_action} | {item.priority_reasoning}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        border: `1px solid ${colors.border}`,
                        background: colors.background,
                        color: colors.color,
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {item.queue_priority}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ border: "1px solid #d0d5dd", borderRadius: 12, padding: 16, background: "#fff" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <select value={filterRecommendation} onChange={(event) => setFilterRecommendation(event.target.value)}>
              <option value="all">All recommendations</option>
              <option value="pursue">Pursue</option>
              <option value="stretch_pursue">Stretch pursue</option>
              <option value="skip">Skip</option>
            </select>
            <select value={filterApproval} onChange={(event) => setFilterApproval(event.target.value)}>
              <option value="all">All approval states</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="skipped">Skipped</option>
            </select>
            <select value={filterDraft} onChange={(event) => setFilterDraft(event.target.value)}>
              <option value="all">All draft states</option>
              <option value="not_started">Not started</option>
              <option value="drafted">Drafted</option>
              <option value="ready">Ready</option>
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="total_score">Sort by score</option>
              <option value="recommendation">Sort by recommendation</option>
              <option value="approval_state">Sort by approval</option>
              <option value="draft_state">Sort by draft state</option>
              <option value="priority_score">Sort by priority</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {visibleQueue.map((item) => {
              const colors = priorityColors(item.queue_priority);
              return (
                <button
                  key={item.job_id}
                  type="button"
                  onClick={() => setSelectedJobId(item.job_id)}
                  style={{
                    textAlign: "left",
                    border: item.job_id === selectedJobId ? "2px solid #0f766e" : "1px solid #d0d5dd",
                    background: "#fcfcfd",
                    borderRadius: 10,
                    padding: 14,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.company}</div>
                      <div>{item.title}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700 }}>{item.total_score}</div>
                      <div
                        style={{
                          marginTop: 6,
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: 999,
                          border: `1px solid ${colors.border}`,
                          background: colors.background,
                          color: colors.color,
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.queue_priority}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "#475467" }}>
                    <div>Recommendation: {item.recommendation}</div>
                    <div>Draft: {item.draft_state} | Approval: {item.approval_state}</div>
                    <div>Next: {item.next_best_action}</div>
                    <div>Why now: {item.priority_reasoning}</div>
                    {item.follow_up_status && item.follow_up_status !== "none" ? (
                      <div>
                        Follow-up: {item.follow_up_status}
                        {item.next_follow_up_at ? ` | Due ${item.next_follow_up_at.slice(0, 10)}` : ""}
                      </div>
                    ) : null}
                    <div>Angles: {item.strongest_angles.join(", ") || "None"}</div>
                    <div>Risks: {item.risk_flags.join(", ") || "None"}</div>
                  </div>
                </button>
              );
            })}
            {!visibleQueue.length ? (
              <div style={{ color: "#667085" }}>
                No queue items available. Load scored jobs and tailoring seed context into `staffordos/job_search_os/data/review_state.json`.
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ border: "1px solid #d0d5dd", borderRadius: 12, padding: 16, background: "#fff" }}>
          {selectedQueueRecord ? (
            <>
              {(() => {
                const colors = priorityColors(selectedQueueRecord.queue_priority);
                return (
                  <div
                    style={{
                      marginBottom: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: `1px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.color,
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedQueueRecord.queue_priority} priority
                  </div>
                );
              })()}
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>{selectedQueueRecord.company}</h2>
                <p style={{ margin: "6px 0 0", color: "#475467" }}>{selectedQueueRecord.title}</p>
                <p style={{ margin: "6px 0 0", color: "#475467" }}>
                  Score {selectedQueueRecord.total_score} | {selectedQueueRecord.recommendation} | priority score {selectedQueueRecord.priority_score}
                </p>
                <p style={{ margin: "6px 0 0", color: "#475467" }}>
                  Next best action: {selectedQueueRecord.next_best_action}
                </p>
                <p style={{ margin: "6px 0 0", color: "#475467" }}>
                  {selectedQueueRecord.priority_reasoning}
                </p>
                {selectedQueueRecord.follow_up_status && selectedQueueRecord.follow_up_status !== "none" ? (
                  <p style={{ margin: "6px 0 0", color: "#475467" }}>
                    Follow-up status: {selectedQueueRecord.follow_up_status}
                    {selectedQueueRecord.next_follow_up_at ? ` | due ${selectedQueueRecord.next_follow_up_at.slice(0, 10)}` : ""}
                  </p>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <button type="button" onClick={createDraft} disabled={busyAction !== ""}>
                  Create Draft
                </button>
                <button type="button" onClick={() => runQueueAction("approve")} disabled={busyAction !== ""}>
                  Approve
                </button>
                <button type="button" onClick={() => runQueueAction("skip")} disabled={busyAction !== ""}>
                  Skip
                </button>
                <button type="button" onClick={() => runQueueAction("mark_draft_ready")} disabled={busyAction !== ""}>
                  Mark Draft Ready
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <strong>Strongest Angles</strong>
                <div>{selectedQueueRecord.strongest_angles.join(", ") || "None"}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <strong>Risk Flags</strong>
                <div>{selectedQueueRecord.risk_flags.join(", ") || "None"}</div>
              </div>

              {selectedApplication ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Score Reasoning</strong>
                    <p style={{ whiteSpace: "pre-wrap" }}>{selectedApplication.score_reasoning}</p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <strong>Selected Resume Blocks</strong>
                    <div>{selectedApplication.selected_resume_blocks.join(", ") || "None"}</div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <strong>Tailored Resume</strong>
                    <pre style={{ whiteSpace: "pre-wrap", background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                      {selectedApplication.tailored_resume_markdown}
                    </pre>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <strong>Notes</strong>
                    <textarea
                      value={notesDraft}
                      onChange={(event) => setNotesDraft(event.target.value)}
                      rows={6}
                      style={{ width: "100%", marginTop: 8 }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <button type="button" onClick={saveNotes} disabled={busyAction !== ""}>
                        Save Notes
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color: "#667085" }}>
                  No draft application yet. Create a draft to inspect tailored resume output and notes.
                </p>
              )}
            </>
          ) : (
            <p style={{ color: "#667085" }}>Select a queue item to review details.</p>
          )}
        </div>
      </section>
    </main>
  );
}
