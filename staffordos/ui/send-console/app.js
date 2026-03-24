const summaryStrip = document.getElementById("summaryStrip");
const queueBody = document.getElementById("queueBody");
const detailPanel = document.getElementById("detailPanel");
const refreshButton = document.getElementById("refreshButton");

let records = [];
let selectedId = null;
let lastActionResult = null;

function statusCounts(items) {
  return {
    total: items.length,
    ready: items.filter((item) => item.nextAction === "send_initial_outreach").length,
    contacted: items.filter((item) => item.status === "contacted").length,
    replied: items.filter((item) => item.status === "replied").length,
    qualified: items.filter((item) => item.status === "qualified").length,
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderSummary(items) {
  const counts = statusCounts(items);
  const cards = [
    ["Total Leads", counts.total],
    ["Ready to Send", counts.ready],
    ["Contacted", counts.contacted],
    ["Replied", counts.replied],
    ["Qualified", counts.qualified],
  ];

  summaryStrip.innerHTML = cards
    .map(
      ([label, value]) => `
        <div class="summary-card">
          <span class="subtle">${escapeHtml(label)}</span>
          <strong>${value}</strong>
        </div>
      `,
    )
    .join("");
}

function renderTable(items) {
  queueBody.innerHTML = items
    .map(
      (item) => `
        <tr data-id="${escapeHtml(item.id)}" class="${item.id === selectedId ? "active" : ""}">
          <td>${item.priorityRank}</td>
          <td>${escapeHtml(item.name)}</td>
          <td>${item.score}</td>
          <td><span class="pill">${escapeHtml(item.status)}</span></td>
          <td>${escapeHtml(item.channel)}</td>
          <td>${escapeHtml(item.issueTitle || "Untitled issue")}</td>
          <td>${escapeHtml(item.nextAction)}</td>
        </tr>
      `,
    )
    .join("");

  for (const row of queueBody.querySelectorAll("tr")) {
    row.addEventListener("click", () => {
      selectedId = row.dataset.id;
      render();
    });
  }
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

async function updateStatus(id, status) {
  const response = await fetch("/api/update-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `Failed to update ${status}`);
  }
  records = Array.isArray(payload.records) ? payload.records : records;
  if (!records.some((item) => item.id === selectedId) && records[0]) {
    selectedId = records[0].id;
  }
  render();
}

async function runAction(action, leadId) {
  const response = await fetch("/api/run-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, leadId }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `Failed to run ${action}`);
  }
  lastActionResult = payload.result || null;
  records = Array.isArray(payload.records) ? payload.records : records;
  render();
}

function renderDetail(item) {
  if (!item) {
    detailPanel.innerHTML = `<p class="subtle">Select a lead to see the outreach copy and actions.</p>`;
    return;
  }

  detailPanel.innerHTML = `
    <h2>${escapeHtml(item.name)}</h2>
    <p class="subtle">${escapeHtml(item.issueTitle || "Untitled issue")}</p>
    <div class="detail-meta">
      <span>Score ${item.score}</span>
      <span>Status ${escapeHtml(item.status)}</span>
      <span>${escapeHtml(item.channel)}</span>
      <span>${escapeHtml(item.nextAction)}</span>
    </div>

    <div class="detail-section">
      <h3>Problem Summary</h3>
      <p>${escapeHtml(item.problemSummary || "No summary available")}</p>
    </div>

    <div class="detail-section">
      <h3>Send Target</h3>
      <a class="button-link secondary" href="${escapeHtml(item.sendTarget)}" target="_blank" rel="noreferrer">Open Target</a>
    </div>

    <div class="detail-section">
      <h3>Outreach Message</h3>
      <div class="detail-copy">${escapeHtml(item.message)}</div>
    </div>

    <div class="detail-section">
      <h3>Follow-up Message</h3>
      <div class="detail-copy">${escapeHtml(item.followUpMessage)}</div>
    </div>

    <div class="detail-section">
      <h3>Workflow Actions</h3>
      <div class="detail-actions">
        <button id="runDiagnose" class="secondary">Diagnose</button>
        <button id="runPayment" class="primary">Generate Payment</button>
        <button id="runStartFix" class="secondary">Start Fix</button>
        <button id="runComplete" class="warn">Complete Delivery</button>
      </div>
      <div id="actionResult" class="detail-copy subtle">${
        lastActionResult && lastActionResult.leadId === item.id
          ? escapeHtml(JSON.stringify(lastActionResult, null, 2))
          : "No action run yet."
      }</div>
    </div>

    <div class="detail-actions">
      <button id="copyMessage" class="primary">Copy Message</button>
      <button id="copyFollowUp" class="secondary">Copy Follow-up</button>
      <button id="markSent" class="primary">Mark Sent</button>
      <button id="markSkipped" class="warn">Mark Skipped</button>
      <button id="markReplied" class="secondary">Mark Replied</button>
    </div>
  `;

  document.getElementById("copyMessage").addEventListener("click", async () => {
    await copyText(item.message);
  });
  document.getElementById("copyFollowUp").addEventListener("click", async () => {
    await copyText(item.followUpMessage);
  });
  document.getElementById("runDiagnose").addEventListener("click", async () => {
    await runAction("diagnose", item.id);
  });
  document.getElementById("runPayment").addEventListener("click", async () => {
    await runAction("generate_payment", item.id);
  });
  document.getElementById("runStartFix").addEventListener("click", async () => {
    await runAction("start_fix", item.id);
  });
  document.getElementById("runComplete").addEventListener("click", async () => {
    await runAction("complete", item.id);
  });
  document.getElementById("markSent").addEventListener("click", async () => {
    await updateStatus(item.id, "contacted");
  });
  document.getElementById("markSkipped").addEventListener("click", async () => {
    await updateStatus(item.id, "skipped");
  });
  document.getElementById("markReplied").addEventListener("click", async () => {
    await updateStatus(item.id, "replied");
  });
}

function render() {
  renderSummary(records);
  renderTable(records);
  const current = records.find((item) => item.id === selectedId) || records[0];
  if (current && current.id !== selectedId) {
    selectedId = current.id;
  }
  renderDetail(current);
}

async function loadData() {
  refreshButton.disabled = true;
  try {
    const response = await fetch("/api/send-console-data");
    const payload = await response.json();
    records = Array.isArray(payload) ? payload : [];
    if (!selectedId && records[0]) {
      selectedId = records[0].id;
    }
    render();
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener("click", loadData);
loadData().catch((error) => {
  detailPanel.innerHTML = `<p class="subtle">${escapeHtml(error.message)}</p>`;
});
