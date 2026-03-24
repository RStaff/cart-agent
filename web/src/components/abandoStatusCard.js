function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderAbandoStatus(store) {
  const connectionStatus = store?.connectionStatus || "not_connected";
  const listeningStatus = store?.listeningStatus || "idle";
  const lastCheckoutEventAt = store?.lastCheckoutEventAt || null;
  const checkoutEventsCount = Number(store?.checkoutEventsCount || 0);
  const recoveryStatus = store?.recoveryStatus || "not_ready";
  const recoveryActionStatus = store?.recoveryActionStatus || "none";
  const lastRecoveryActionAt = store?.lastRecoveryActionAt || null;
  const lastRecoveryActionType = store?.lastRecoveryActionType || null;
  const lastRecoverySentAt = store?.lastRecoverySentAt || null;
  const lastRecoveryChannels = Array.isArray(store?.lastRecoveryChannels) ? store.lastRecoveryChannels : [];
  const sendNotConfigured = store?.sendNotConfigured === true;
  const lastSendStatus = store?.lastSendStatus || "none";
  const lastSendTime = store?.lastSendTime || null;
  const lastSendChannels = Array.isArray(store?.lastSendChannels) ? store.lastSendChannels : [];
  const lastSendProviderStatuses = Array.isArray(store?.lastSendProviderStatuses) ? store.lastSendProviderStatuses : [];
  const shopDomain = String(store?.shopDomain || "");
  const canTriggerTestEvent = connectionStatus === "connected" && shopDomain;
  const canCreateRecoveryAction = connectionStatus === "connected" && recoveryStatus === "ready" && shopDomain;
  const canSendTestRecovery = connectionStatus === "connected" && recoveryStatus === "ready" && shopDomain;

  let state = "NOT_CONNECTED";
  if (connectionStatus === "connected" && checkoutEventsCount === 0) {
    state = "CONNECTED_LISTENING";
  } else if (checkoutEventsCount >= 1 && recoveryStatus === "ready") {
    state = "RECOVERY_READY";
  } else if (checkoutEventsCount >= 1) {
    state = "SIGNAL_DETECTED";
  }

  let title = "Not connected";
  let description = "Connect your Shopify store to begin monitoring checkout activity.";
  let subtext = "";
  let meta = "";
  let helper = "Abando monitors checkout activity and creates recovery actions when customers drop off.";
  let guidance = "Open Abando from Shopify to complete connection.";
  const recoveryActionChannelLabel = lastRecoveryChannels.length > 0
    ? lastRecoveryChannels.join(" + ")
    : "";
  const recoveryActionLabel = recoveryActionStatus === "created"
    ? (sendNotConfigured ? "Send not configured" : "Recovery action created")
    : recoveryActionStatus === "sent"
      ? recoveryActionChannelLabel
        ? `Recovery action sent (${recoveryActionChannelLabel})`
        : "Recovery action sent"
      : recoveryActionStatus === "failed"
        ? "Recovery action failed"
        : "Not active";
  const lastRecoveryActionLabel = lastRecoveryActionType
    ? `${lastRecoveryActionType}${lastRecoverySentAt ? ` · sent ${lastRecoverySentAt}` : lastRecoveryActionAt ? ` · ${lastRecoveryActionAt}` : ""}`
    : "—";
  const lastSendLabel = lastSendStatus === "sent_email_and_sms"
    ? "Email + SMS sent"
    : lastSendStatus === "sent_email"
      ? "Email sent"
      : lastSendStatus === "sent_sms"
        ? "SMS sent"
        : lastSendStatus === "failed"
          ? "Send failed"
          : lastSendStatus === "created"
            ? (lastSendProviderStatuses.length > 0 ? lastSendProviderStatuses.join(", ") : "Send not configured")
            : "—";
  const lastSendChannelsLabel = lastSendChannels.length > 0 ? lastSendChannels.join(" + ") : "—";

  if (state === "CONNECTED_LISTENING") {
    title = "Listening for checkout activity";
    description = "No checkout events detected yet.";
    subtext = checkoutEventsCount === 0
      ? "Complete a test checkout to verify Abando is working."
      : "Abando is monitoring your store in real time.";
    meta = checkoutEventsCount === 0 ? "No checkout activity yet" : "";
    helper = "Next step: Run test event.";
    guidance = "Use the test event button to verify the connection before waiting for live store traffic.";
  } else if (state === "SIGNAL_DETECTED") {
    title = "Checkout activity detected";
    description = "1 or more checkout events observed.";
    subtext = lastCheckoutEventAt
      ? `Last event timestamp: ${escapeHtml(lastCheckoutEventAt)}`
      : "Last event timestamp: —";
    meta = `Event count: ${checkoutEventsCount}`;
    helper = "Next step: Create recovery action.";
    guidance = "Review the latest signal and create one recovery action when you are ready.";
  } else if (state === "RECOVERY_READY") {
    title = "Recovery ready";
    description = "Checkout signals detected. Recovery path is ready.";
    subtext = lastCheckoutEventAt
      ? `Last event timestamp: ${escapeHtml(lastCheckoutEventAt)}`
      : "Last event timestamp: —";
    meta = `Event count: ${checkoutEventsCount}`;
    helper = recoveryActionStatus === "created"
      ? (sendNotConfigured ? "Send not configured" : "Recovery action created")
      : "Next step: Create recovery action.";
    guidance = recoveryActionStatus === "created"
      ? sendNotConfigured
        ? "Configure SMTP to send recovery email. Abando will not mark sent until a real send succeeds."
        : "Recovery action is recorded. Sent status appears only after a real outbound send succeeds."
      : "Recovery is prepared. You can create one recovery action from this screen.";
  }

  return `
    <section class="abando-status-card" data-abando-status-card data-state="${state}">
      <div class="abando-status-header">
        <div>
          <div class="abando-status-eyebrow">Abando status</div>
          <h2 class="abando-status-title" data-abando-status-title>${escapeHtml(title)}</h2>
        </div>
        <div class="abando-status-pill" data-abando-status-pill>${escapeHtml(title)}</div>
      </div>
      <p class="abando-status-description" data-abando-status-description>${escapeHtml(description)}</p>
      <p class="abando-status-helper">${escapeHtml(helper)}</p>
      <p class="abando-status-subtext" data-abando-status-subtext>${escapeHtml(subtext)}</p>
      <div class="abando-status-meta" data-abando-status-meta>${escapeHtml(meta)}</div>
      <div class="abando-status-meta">${escapeHtml(guidance)}</div>
      <div class="abando-status-details">
        <div><b>Recovery Action</b><span data-abando-recovery-action-label>${escapeHtml(recoveryActionLabel)}</span></div>
        <div><b>Last Recovery Action</b><span data-abando-last-recovery-action>${escapeHtml(lastRecoveryActionLabel)}</span></div>
        <div><b>Last Send Status</b><span data-abando-last-send-status>${escapeHtml(lastSendLabel)}</span></div>
        <div><b>Last Send Time</b><span data-abando-last-send-time>${escapeHtml(lastSendTime || "—")}</span></div>
        <div><b>Channels Used</b><span data-abando-last-send-channels>${escapeHtml(lastSendChannelsLabel)}</span></div>
      </div>
      ${canTriggerTestEvent ? `
        <div class="abando-status-actions">
          <button
            type="button"
            class="abando-trigger-button"
            data-abando-trigger-test
            data-shop-domain="${escapeHtml(shopDomain)}"
          >
            Run test event
          </button>
          <div class="abando-trigger-status" data-abando-trigger-status></div>
        </div>
      ` : ""}
      ${canCreateRecoveryAction ? `
        <div class="abando-status-actions">
          <button
            type="button"
            class="abando-trigger-button"
            data-abando-create-recovery
            data-shop-domain="${escapeHtml(shopDomain)}"
          >
            Create recovery action
          </button>
          <div class="abando-trigger-status" data-abando-recovery-action-status>${escapeHtml(
            recoveryActionStatus === "created"
              ? `${sendNotConfigured ? "Send not configured" : "Recovery action created"}${lastRecoveryActionType ? ` · ${lastRecoveryActionType}` : ""}${lastRecoveryActionAt ? ` · ${lastRecoveryActionAt}` : ""}`
              : ""
          )}</div>
        </div>
      ` : ""}
      ${canSendTestRecovery ? `
        <div class="abando-status-actions">
          <button
            type="button"
            class="abando-trigger-button"
            data-abando-send-test-recovery
            data-shop-domain="${escapeHtml(shopDomain)}"
          >
            Send test recovery
          </button>
          <div class="abando-trigger-status" data-abando-send-test-status></div>
        </div>
      ` : ""}
    </section>
  `;
}
