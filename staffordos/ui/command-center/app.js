const summaryStrip = document.getElementById("summaryStrip");
const leadList = document.getElementById("leadList");
const detailPanel = document.getElementById("detailPanel");
const searchInput = document.getElementById("searchInput");
const actionBanner = document.getElementById("actionBanner");

let records = [];
let filtered = [];
let selectedId = null;
let currentMessage = "";
let currentReplyText = "";
let currentReplyDetection = null;
let currentReplySuggestion = null;

function setBanner(message = "", tone = "success") {
  actionBanner.innerHTML = message ? `<div class="banner ${tone}">${escapeHtml(message)}</div>` : "";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function humanize(value = "") {
  return String(value || "")
    .replaceAll("_", " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatTimestamp(value) {
  const text = String(value || "").trim();
  if (!text) return "—";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString();
}

function stageCounts(items) {
  return {
    total: items.length,
    new: items.filter((item) => item.leadStage === "new").length,
    contacted: items.filter((item) => item.leadStage === "contacted").length,
    replied: items.filter((item) => item.leadStage === "replied").length,
    linkSent: items.filter((item) => item.leadStage === "payment_link_sent").length,
    paid: items.filter((item) => item.leadStage === "paid").length,
  };
}

function renderSummary(items) {
  const counts = stageCounts(items);
  const cards = [
    ["Total", counts.total],
    ["New", counts.new],
    ["Contacted", counts.contacted],
    ["Replied", counts.replied],
    ["Link Sent", counts.linkSent],
    ["Paid", counts.paid],
  ];

  summaryStrip.innerHTML = cards
    .map(
      ([label, value]) => `
        <div class="summary-card">
          <span class="muted">${escapeHtml(label)}</span>
          <strong>${value}</strong>
        </div>
      `,
    )
    .join("");
}

function paymentBadge(item) {
  if (item.truth?.payment?.status === "paid") {
    return `<span class="badge paid">paid</span>`;
  }
  if (item.truth?.payment?.status === "link_sent") {
    return `<span class="badge payment">link sent</span>`;
  }
  return "";
}

function replyBadge(item) {
  return item.truth?.reply?.exists ? `<span class="badge reply">reply</span>` : "";
}

function renderLeadList(items) {
  leadList.innerHTML = items
    .map(
      (item) => `
        <div class="lead-row ${item.id === selectedId ? "active" : ""}" data-id="${escapeHtml(item.id)}">
          <div class="lead-topline">
            <strong>${escapeHtml(item.name)}</strong>
            <div class="lead-badges">
              ${replyBadge(item)}
              ${paymentBadge(item)}
            </div>
          </div>
          <div class="meta-line">
            <span class="pill">${escapeHtml(item.leadStage)}</span>
            <span class="muted">${escapeHtml(item.source || "unknown")}</span>
          </div>
          <div class="lead-problem">${escapeHtml(item.problemSummary || "No problem summary")}</div>
          <div class="muted small-line">${escapeHtml(item.nextBestActionLabel || "Review")}</div>
        </div>
      `,
    )
    .join("");

  for (const row of leadList.querySelectorAll(".lead-row")) {
    row.addEventListener("click", () => {
      selectedId = row.dataset.id;
      currentReplyDetection = null;
      currentReplySuggestion = null;
      currentReplyText = "";
      render();
    });
  }
}

async function parsePayload(response) {
  const payload = await response.json();
  return { response, payload };
}

async function loadData() {
  const { response, payload } = await parsePayload(await fetch("/api/command-center-data"));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "Failed to load command center data");
  }
  records = Array.isArray(payload.records) ? payload.records : [];
  applyFilter();
}

function applyFilter() {
  const query = searchInput.value.trim().toLowerCase();
  filtered = records.filter((item) => {
    if (!query) return true;
    return [item.name, item.problemSummary, item.issueTitle, item.leadStage]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  if (!filtered.some((item) => item.id === selectedId)) {
    selectedId = filtered[0]?.id || null;
    currentReplyDetection = null;
    currentReplySuggestion = null;
  }
  render();
}

function getSelectedLead() {
  return records.find((item) => item.id === selectedId) || filtered[0] || null;
}

function refreshRecords(nextRecords) {
  if (Array.isArray(nextRecords)) {
    records = nextRecords;
  }
  applyFilter();
}

async function runAction(action) {
  const lead = getSelectedLead();
  if (!lead) return;
  const { response, payload } = await parsePayload(
    await fetch("/api/run-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, leadId: lead.id }),
    }),
  );
  if (!response.ok || payload?.ok === false) {
    setBanner(payload?.error || "Action failed.", "error");
    return null;
  }
  refreshRecords(payload.records);
  if (action === "generate_payment") {
    setBanner("Payment link generated. Record it as sent only after you actually send it.");
  }
  return payload;
}

async function generateMessage() {
  const lead = getSelectedLead();
  if (!lead) return;
  const { response, payload } = await parsePayload(
    await fetch("/api/generate-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    }),
  );
  if (!response.ok || payload?.ok === false) {
    setBanner(payload?.error || "Could not generate outreach.", "error");
    return;
  }
  currentMessage = payload.message || "";
  const textarea = document.getElementById("messageBox");
  if (textarea) {
    textarea.value = currentMessage;
  }
  setBanner("Outreach message generated.");
}

async function copyMessage() {
  const textarea = document.getElementById("messageBox");
  const message = textarea?.value?.trim() || currentMessage || "";
  if (!message) return;
  await navigator.clipboard.writeText(message);
  setBanner("Message copied.");
}

function openIssue() {
  const lead = getSelectedLead();
  if (!lead?.sendTarget) return;
  window.open(lead.sendTarget, "_blank", "noopener,noreferrer");
}

function openPaymentLink() {
  const lead = getSelectedLead();
  const url = lead?.availablePaymentUrl || "";
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

async function copyPaymentLink() {
  const lead = getSelectedLead();
  const url = lead?.availablePaymentUrl || "";
  if (!url) return;
  await navigator.clipboard.writeText(url);
  setBanner("Payment link copied.");
}

async function copyPaymentSuggestion() {
  const textarea = document.getElementById("paymentSuggestionBox");
  const text = textarea?.value?.trim() || "";
  if (!text) return;
  await navigator.clipboard.writeText(text);
  setBanner("Payment suggestion copied.");
}

async function generateFreshPaymentSuggestionLink() {
  const payload = await runAction("generate_payment");
  if (!payload?.ok) return;
  setBanner("Fresh payment link generated and inserted into the draft. It is not marked sent.");
}

async function generatePaymentLink(leadId) {
  const payload = await runAction("generate_payment");
  if (!payload?.ok) return;

  const url = payload?.result?.paymentUrl || "";
  const recordsLead = records.find((item) => item.id === leadId);
  if (recordsLead && url) {
    recordsLead.paymentUrl = url;
    recordsLead.availablePaymentUrl = url;
    recordsLead.paymentSuggestionDraft = `This looks like a clean fit for the Shopify dev fix path.

If you want me to take it on, here’s the payment link:
${url}

Once that’s through, I’ll move straight into the fix path.`;
  }

  render();
}

window.generatePaymentLink = generatePaymentLink;

async function truthMutation(path, body, successMessage) {
  const { response, payload } = await parsePayload(
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

  if (!response.ok || payload?.ok === false) {
    setBanner(payload?.reason || payload?.error || "Truth update failed.", "error");
    return false;
  }

  refreshRecords(payload.records);
  setBanner(successMessage);
  return true;
}

async function resetReplyTruth() {
  const lead = getSelectedLead();
  if (!lead) return;
  await truthMutation("/api/truth/reset-reply", { leadId: lead.id }, "Reply truth cleared.");
}

async function resetPaymentTruth() {
  const lead = getSelectedLead();
  if (!lead) return;
  await truthMutation("/api/truth/reset-payment", { leadId: lead.id }, "Payment truth cleared.");
}

async function resetCommentTruth() {
  const lead = getSelectedLead();
  if (!lead) return;
  await truthMutation("/api/truth/reset-comment", { leadId: lead.id }, "First comment truth cleared.");
}

async function resetAllTruthForLead() {
  const lead = getSelectedLead();
  if (!lead) return;
  await truthMutation("/api/truth/reset-all-for-lead", { leadId: lead.id }, "Lead truth reset to blank.");
}

async function markCommentSent() {
  const lead = getSelectedLead();
  if (!lead) return;
  const textarea = document.getElementById("messageBox");
  const message = textarea?.value?.trim() || currentMessage || lead.message || "";
  await truthMutation(
    "/api/truth/mark-comment-sent",
    { leadId: lead.id, message },
    "First comment recorded in local truth.",
  );
}

async function recordReplyTruth() {
  const lead = getSelectedLead();
  const textarea = document.getElementById("replyInput");
  const text = textarea?.value?.trim() || "";
  if (!lead || !text) {
    setBanner("Paste the actual reply text before recording it.", "error");
    return;
  }
  currentReplyText = text;
  await truthMutation(
    "/api/truth/record-reply",
    { leadId: lead.id, text },
    "Reply recorded in local truth.",
  );
}

async function sendPaymentLinkTruth() {
  const lead = getSelectedLead();
  if (!lead) return;
  await truthMutation(
    "/api/truth/send-payment-link",
    { leadId: lead.id },
    "Payment link recorded as sent in local truth.",
  );
}

async function detectReply() {
  const lead = getSelectedLead();
  const textarea = document.getElementById("replyInput");
  const text = textarea?.value?.trim() || "";
  if (!lead || !text) return;
  currentReplyText = text;
  const { response, payload } = await parsePayload(
    await fetch("/api/detect-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, text }),
    }),
  );
  if (!response.ok || payload?.ok === false) {
    setBanner(payload?.error || "Reply detection failed.", "error");
    return;
  }
  currentReplyDetection = payload;
  currentReplySuggestion = null;
  render();
  setBanner("Reply classified. This does not change local truth until you record it.");
}

async function suggestReply() {
  const lead = getSelectedLead();
  const textarea = document.getElementById("replyInput");
  const text = textarea?.value?.trim() || "";
  if (!lead || !text) return;
  currentReplyText = text;
  const { response, payload } = await parsePayload(
    await fetch("/api/suggest-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, text }),
    }),
  );
  if (!response.ok || payload?.ok === false) {
    setBanner(payload?.error || "Reply suggestion failed.", "error");
    return;
  }
  currentReplyDetection = payload.detection || null;
  currentReplySuggestion = payload.suggestion || null;
  render();
  setBanner("Suggested response ready.");
}

async function copySuggestedResponse() {
  const textarea = document.getElementById("suggestedResponseBox");
  const text = textarea?.value?.trim() || currentReplySuggestion?.suggestedResponse || "";
  if (!text) return;
  await navigator.clipboard.writeText(text);
  setBanner("Suggested response copied.");
}

async function saveReplyNote() {
  const lead = getSelectedLead();
  const textarea = document.getElementById("replyInput");
  if (!lead || !textarea) return;
  const { response, payload } = await parsePayload(
    await fetch("/api/save-reply-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: lead.id,
        text: textarea.value.trim(),
        replyType: currentReplyDetection?.replyType || "",
        suggestedResponse: currentReplySuggestion?.suggestedResponse || "",
      }),
    }),
  );
  if (!response.ok || payload?.ok === false) {
    setBanner(payload?.error || "Reply note save failed.", "error");
    return;
  }
  setBanner("Reply note saved locally.");
}

function renderSecondaryMetadata(lead) {
  return `
    <section class="panel-section secondary-panel">
      <div class="section-header">
        <h3>Secondary Metadata</h3>
        <span class="muted">not used for stage</span>
      </div>
      <div class="compact-box">
        <div><strong>Issue:</strong> ${escapeHtml(lead.issueTitle || "Untitled issue")}</div>
        <div><strong>Problem:</strong> ${escapeHtml(lead.problemSummary || "No problem summary")}</div>
        <div><strong>Source:</strong> ${escapeHtml(lead.source || "unknown")}</div>
        <div><strong>GitHub issue:</strong> ${lead.sendTarget ? `<a href="${escapeHtml(lead.sendTarget)}" target="_blank" rel="noreferrer">Open issue</a>` : "n/a"}</div>
        <div><strong>Fresh payment link:</strong> ${lead.availablePaymentUrl ? "present" : "none"}</div>
        <div><strong>Latest session id:</strong> ${escapeHtml(lead.latestCheckoutSessionId || "n/a")}</div>
        <div><strong>Checkout expires:</strong> ${escapeHtml(formatTimestamp(lead.latestCheckoutExpiresAt))}</div>
        <div><strong>Checkout state:</strong> ${lead.latestCheckoutExpired ? "expired" : (lead.availablePaymentUrl ? "usable" : "none")}</div>
        <div><strong>Delivery status:</strong> ${escapeHtml(lead.deliveryStatus || "n/a")}</div>
      </div>
    </section>
  `;
}

function renderTruthStatus(lead) {
  const truth = lead.truth;
  return `
    <section class="panel-section">
      <div class="section-header">
        <h3>Truth Status</h3>
        <span class="pill">${escapeHtml(lead.leadStage)}</span>
      </div>
      ${truth.firstComment.sent ? `<div class="banner warn">DO NOT SEND AGAIN — first comment already recorded in local truth.</div>` : ""}
      <div class="truth-grid">
        <div class="truth-item">
          <span class="muted">Comment sent</span>
          <strong>${truth.firstComment.sent ? "YES" : "NO"}</strong>
        </div>
        <div class="truth-item">
          <span class="muted">Reply received</span>
          <strong>${truth.reply.exists ? "YES" : "NO"}</strong>
        </div>
        <div class="truth-item">
          <span class="muted">Payment</span>
          <strong>${escapeHtml(String(truth.payment.status || "none").toUpperCase())}</strong>
        </div>
      </div>
      <div class="compact-box">
        <div><strong>Comment sent at:</strong> ${escapeHtml(formatTimestamp(truth.firstComment.timestamp))}</div>
        <div><strong>Reply recorded at:</strong> ${escapeHtml(formatTimestamp(truth.reply.timestamp))}</div>
        <div><strong>Payment updated at:</strong> ${escapeHtml(formatTimestamp(truth.payment.timestamp))}</div>
      </div>
      <div class="muted section-copy">${escapeHtml(lead.nextBestActionReason || "No grounded next step available.")}</div>
    </section>
  `;
}

function renderValidActions(lead) {
  const buttons = [];
  if (lead.canSendFirstComment) {
    buttons.push(`<button class="button-primary" id="markCommentSentBtn">Mark Comment Sent</button>`);
  }
  if (lead.canRecordReply) {
    buttons.push(`<button class="button-primary" id="recordReplyBtn">Record Reply</button>`);
  }
  if (lead.canSendPaymentLink) {
    buttons.push(`<button class="button-primary" id="sendPaymentLinkBtn">Send Payment Link</button>`);
  }

  return `
    <section class="panel-section">
      <div class="section-header">
        <h3>Valid Actions</h3>
        <span class="muted">${escapeHtml(lead.nextBestActionLabel || "Review")}</span>
      </div>
      <div class="button-row">
        ${buttons.join("") || `<span class="status-hint">No truth mutation is valid right now.</span>`}
      </div>
      ${lead.canMarkPaid ? `<div class="muted section-copy">Stripe webhook will mark this paid after checkout.session.completed. Frontend paid clicks are disabled.</div>` : ""}
      <div class="button-row secondary-actions">
        <button class="button-secondary" id="generateMessageBtn">Generate Message</button>
        <button class="button-secondary" id="copyMessageBtn">Copy Message</button>
        <button class="button-secondary" id="openIssueBtn">Open Issue</button>
        ${lead.availablePaymentUrl ? `<button class="button-secondary" id="openPaymentBtn">Open Payment Link</button>` : ""}
        ${lead.availablePaymentUrl ? `<button class="button-secondary" id="copyPaymentBtn">Copy Payment Link</button>` : ""}
        ${!lead.availablePaymentUrl ? `<button class="button-secondary" id="generatePaymentBtn">Generate Payment Link</button>` : ""}
      </div>
      ${!lead.availablePaymentUrl && lead.latestCheckoutExpired ? `<div class="muted section-copy">The latest checkout session is expired. Generate a fresh payment link before sending it.</div>` : ""}
      ${!lead.availablePaymentUrl && !lead.latestCheckoutExpired ? `<div class="muted section-copy">No fresh checkout session exists yet. Generate one before sending a payment link.</div>` : ""}
      <div class="button-row secondary-actions">
        ${lead.truth?.reply?.exists ? `<button class="button-secondary" id="undoReplyBtn">Undo Reply</button>` : ""}
        ${lead.truth?.payment?.status !== "none" ? `<button class="button-secondary" id="undoPaymentBtn">Undo Payment</button>` : ""}
        ${lead.truth?.firstComment?.sent ? `<button class="button-secondary" id="undoCommentBtn">Undo First Comment</button>` : ""}
        <button class="button-secondary danger-outline" id="resetLeadTruthBtn">Reset Lead Truth</button>
      </div>
    </section>
  `;
}

function renderOutreach(lead) {
  return `
    <section class="panel-section">
      <div class="section-header">
        <h3>Outreach Draft</h3>
        <span class="muted">secondary</span>
      </div>
      <textarea id="messageBox">${escapeHtml(currentMessage || lead.message || "")}</textarea>
      <div class="muted section-copy">Use this draft as working copy. It does not change truth until you explicitly mark the first comment as sent.</div>
    </section>
  `;
}

function renderReplyAssistant(lead) {
  const truthReply = lead.truth?.reply;
  const replyText = currentReplyText || truthReply?.text || currentReplyDetection?.replyText || "";
  const detection = currentReplyDetection || lead.replyAnalysis || null;
  const suggestion = currentReplySuggestion?.suggestedResponse || "";
  const action = currentReplySuggestion?.recommendedAction || "";

  return `
    <section class="panel-section">
      <div class="section-header">
        <h3>Reply Assistant</h3>
        <span class="muted">secondary</span>
      </div>
      <textarea id="replyInput" class="reply-input" placeholder="Paste the lead reply here...">${escapeHtml(replyText)}</textarea>
      <div class="button-row">
        <button class="button-secondary" id="detectReplyBtn">Detect Reply Type</button>
        <button class="button-secondary" id="suggestReplyBtn">Suggest Response</button>
        <button class="button-secondary" id="copySuggestedBtn">Copy Suggested Response</button>
        <button class="button-secondary" id="saveReplyNoteBtn">Save Reply Note</button>
      </div>
      <div class="compact-box">
        <div><strong>Reply type:</strong> ${escapeHtml(detection?.replyType || "not_detected")}</div>
        <div><strong>Confidence:</strong> ${escapeHtml(detection?.confidence ?? "n/a")}</div>
        <div><strong>Intent:</strong> ${escapeHtml(detection?.intentSummary || "No reply classification yet.")}</div>
        <div><strong>Recommended action:</strong> ${escapeHtml(action || "n/a")}</div>
      </div>
      <textarea id="suggestedResponseBox">${escapeHtml(suggestion)}</textarea>
    </section>
  `;
}

function renderHotLeadPaymentSuggestion(lead) {
  if (true) {
    return `
      <div style="
        border: 2px solid #22c55e;
        padding: 12px;
        margin-top: 12px;
        background: #f0fdf4;
        border-radius: 6px;
      ">
        <h3>🔥 Hot Lead — Payment Suggestion Ready</h3>

        <p style="font-size:13px;margin-bottom:8px;">
          ${escapeHtml(lead.paymentSuggestionReason || "")}
        </p>

        <div style="font-size:12px;color:#555;margin-bottom:10px;">
          ${escapeHtml(lead.replyPreview || "")}
        </div>

        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <button onclick="generatePaymentLink('${escapeHtml(lead.id)}')">
            Generate Fresh Payment Link
          </button>

          ${lead.paymentUrl ? `
            <a href="${escapeHtml(lead.paymentUrl)}" target="_blank">
              Open Payment Link
            </a>
          ` : ""}
        </div>

        <textarea id="paymentSuggestionBox" style="width:100%;height:120px;">
${escapeHtml(lead.paymentSuggestionDraft || "")}
        </textarea>
      </div>
    `;
  }

  return "";
}

function renderDetail(lead) {
  if (!lead) {
    detailPanel.innerHTML = `<div class="empty-state">Select a lead to open the workflow.</div>`;
    return;
  }

  const viewLead = {
    ...lead,
    paymentUrl: lead.paymentUrl || lead.availablePaymentUrl || "",
  };

  console.log("DEBUG LEAD:", viewLead);

  detailPanel.innerHTML = `
    <div class="detail-grid">
      <div class="stack">
        <section class="next-action-card">
          <div class="section-header">
            <div>
              <div class="eyebrow">Grounded Workflow</div>
              <h2>${escapeHtml(viewLead.name)}</h2>
            </div>
            <span class="pill">${escapeHtml(viewLead.leadStage)}</span>
          </div>
          <p class="muted">${escapeHtml(viewLead.nextBestActionReason || "Review the truth block and act only on stored events.")}</p>
        </section>
        ${renderTruthStatus(viewLead)}
        ${renderValidActions(viewLead)}
        ${renderHotLeadPaymentSuggestion(viewLead)}
        ${renderOutreach(viewLead)}
      </div>
      <div class="stack">
        ${renderReplyAssistant(viewLead)}
        ${renderSecondaryMetadata(viewLead)}
      </div>
    </div>
  `;

  document.getElementById("markCommentSentBtn")?.addEventListener("click", markCommentSent);
  document.getElementById("recordReplyBtn")?.addEventListener("click", recordReplyTruth);
  document.getElementById("sendPaymentLinkBtn")?.addEventListener("click", sendPaymentLinkTruth);
  document.getElementById("generateMessageBtn")?.addEventListener("click", generateMessage);
  document.getElementById("copyMessageBtn")?.addEventListener("click", copyMessage);
  document.getElementById("openIssueBtn")?.addEventListener("click", openIssue);
  document.getElementById("openPaymentBtn")?.addEventListener("click", openPaymentLink);
  document.getElementById("copyPaymentBtn")?.addEventListener("click", copyPaymentLink);
  document.getElementById("generatePaymentBtn")?.addEventListener("click", () => runAction("generate_payment"));
  document.getElementById("generateFreshPaymentBtn")?.addEventListener("click", generateFreshPaymentSuggestionLink);
  document.getElementById("copyPaymentSuggestionBtn")?.addEventListener("click", copyPaymentSuggestion);
  document.getElementById("openPaymentSuggestionLinkBtn")?.addEventListener("click", openPaymentLink);
  document.getElementById("copyPaymentSuggestionLinkBtn")?.addEventListener("click", copyPaymentLink);
  document.getElementById("undoReplyBtn")?.addEventListener("click", resetReplyTruth);
  document.getElementById("undoPaymentBtn")?.addEventListener("click", resetPaymentTruth);
  document.getElementById("undoCommentBtn")?.addEventListener("click", resetCommentTruth);
  document.getElementById("resetLeadTruthBtn")?.addEventListener("click", resetAllTruthForLead);
  document.getElementById("detectReplyBtn")?.addEventListener("click", detectReply);
  document.getElementById("suggestReplyBtn")?.addEventListener("click", suggestReply);
  document.getElementById("copySuggestedBtn")?.addEventListener("click", copySuggestedResponse);
  document.getElementById("saveReplyNoteBtn")?.addEventListener("click", saveReplyNote);
}

function render() {
  renderSummary(filtered);
  renderLeadList(filtered);
  const current = filtered.find((item) => item.id === selectedId) || filtered[0];
  renderDetail(current);
}

searchInput.addEventListener("input", applyFilter);

loadData().catch((error) => {
  detailPanel.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
