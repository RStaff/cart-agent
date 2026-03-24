export async function getDashboardSummary(prisma, shop) {
  const normalizedShop = String(shop || "").trim().toLowerCase();
  if (!normalizedShop) return null;

  const shopRecord = await prisma.shop.findUnique({
    where: { key: normalizedShop },
  });

  if (!shopRecord) return null;

  const artifactInstalled = Boolean(shopRecord.apiKey);
  const shopId = shopRecord.id;

  const [
    cartsTotal,
    cartsRecovered,
    emailsSent,
    realRevenueStats,
    decisionStats,
    validationDecisionStats,
    latestCheckoutEvent,
    checkoutEventCount,
    latestRecoveryAction,
    latestRecoverySendTest,
    latestCustomerReturn,
  ] = await Promise.all([
    prisma.cart.count({ where: { shopId } }),
    prisma.cart.count({ where: { shopId, status: "recovered" } }),
    prisma.emailQueue.count({ where: { shopId, status: "sent" } }),
    prisma.cart.aggregate({
      where: {
        shopId,
        attributedOrderId: { not: null },
        attributionIsSynthetic: false,
      },
      _sum: { attributedOrderValueCents: true },
      _count: { attributedOrderId: true },
    }),
    prisma.decisionLog.groupBy({
      by: ["outcome"],
      where: {
        shopDomain: shopRecord.key,
        validationMode: false,
      },
      _count: { outcome: true },
    }),
    prisma.decisionLog.groupBy({
      by: ["outcome"],
      where: {
        shopDomain: shopRecord.key,
        validationMode: true,
      },
      _count: { outcome: true },
    }),
    prisma.systemEvent.findFirst({
      where: {
        shopDomain: shopRecord.key,
        eventType: "abando.checkout_event.v1",
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.systemEvent.count({
      where: {
        shopDomain: shopRecord.key,
        eventType: "abando.checkout_event.v1",
      },
    }),
    prisma.systemEvent.findFirst({
      where: {
        shopDomain: shopRecord.key,
        eventType: "abando.recovery_action.v1",
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.systemEvent.findFirst({
      where: {
        shopDomain: shopRecord.key,
        eventType: "abando.recovery_send_test.v1",
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.systemEvent.findFirst({
      where: {
        shopDomain: shopRecord.key,
        eventType: "abando.customer_return.v1",
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const decisionCounts = Object.fromEntries(
    (decisionStats || []).map((row) => [row.outcome, Number(row._count?.outcome || 0)]),
  );
  const validationCounts = Object.fromEntries(
    (validationDecisionStats || []).map((row) => [row.outcome, Number(row._count?.outcome || 0)]),
  );
  const latestEventPayload = latestCheckoutEvent?.payload && typeof latestCheckoutEvent.payload === "object"
    ? latestCheckoutEvent.payload
    : null;
  const latestRecoveryActionPayload = latestRecoveryAction?.payload && typeof latestRecoveryAction.payload === "object"
    ? latestRecoveryAction.payload
    : null;
  const latestRecoverySendTestPayload = latestRecoverySendTest?.payload && typeof latestRecoverySendTest.payload === "object"
    ? latestRecoverySendTest.payload
    : null;
  const latestCustomerReturnPayload = latestCustomerReturn?.payload && typeof latestCustomerReturn.payload === "object"
    ? latestCustomerReturn.payload
    : null;
  const connectionStatus = artifactInstalled ? "connected" : "not_connected";
  const listeningStatus = artifactInstalled ? "listening" : "idle";
  const lastCheckoutEventAt =
    latestEventPayload?.occurredAt ||
    latestEventPayload?.timestamp ||
    latestCheckoutEvent?.createdAt?.toISOString?.() ||
    null;
  const recoveryStatus = checkoutEventCount >= 1 ? "ready" : "not_ready";
  const recoveryActionStatus = typeof latestRecoveryActionPayload?.status === "string"
    ? latestRecoveryActionPayload.status
    : "none";
  const lastRecoveryActionAt =
    latestRecoveryActionPayload?.createdAt ||
    latestRecoveryAction?.createdAt?.toISOString?.() ||
    null;
  const lastRecoveryActionType = typeof latestRecoveryActionPayload?.action_type === "string"
    ? latestRecoveryActionPayload.action_type
    : null;
  const lastRecoverySentAt = typeof latestRecoveryActionPayload?.sentAt === "string"
    ? latestRecoveryActionPayload.sentAt
    : null;
  const lastRecoveryChannels = Array.isArray(latestRecoveryActionPayload?.channels)
    ? latestRecoveryActionPayload.channels.filter((value) => typeof value === "string")
    : typeof latestRecoveryActionPayload?.channel === "string"
      ? [latestRecoveryActionPayload.channel]
      : [];
  const sendNotConfigured = Boolean(
    latestRecoveryActionPayload
    && latestRecoveryActionPayload.status === "created"
    && latestRecoveryActionPayload.sendNotConfigured === true
  );
  const lastSendStatus = typeof latestRecoverySendTestPayload?.status === "string"
    ? latestRecoverySendTestPayload.status
    : "none";
  const lastSendTime = typeof latestRecoverySendTestPayload?.timestamp === "string"
    ? latestRecoverySendTestPayload.timestamp
    : null;
  const lastSendChannels = Array.isArray(latestRecoverySendTestPayload?.successfulChannels)
    ? latestRecoverySendTestPayload.successfulChannels.filter((value) => typeof value === "string")
    : [];
  const lastSendMissingEnvVars = Array.isArray(latestRecoverySendTestPayload?.missingEnvVars)
    ? latestRecoverySendTestPayload.missingEnvVars.filter((value) => typeof value === "string")
    : [];
  const lastSendProviderStatuses = Array.isArray(latestRecoverySendTestPayload?.providerStatuses)
    ? latestRecoverySendTestPayload.providerStatuses.filter((value) => typeof value === "string")
    : [];
  const lastCustomerReturnAt =
    latestCustomerReturnPayload?.timestamp ||
    latestCustomerReturn?.createdAt?.toISOString?.() ||
    null;

  return {
    shopDomain: shopRecord.key,
    connectionStatus,
    listeningStatus,
    lastCheckoutEventAt,
    checkoutEventsCount: checkoutEventCount,
    recoveryStatus,
    recoveryActionStatus,
    lastRecoveryActionAt,
    lastRecoveryActionType,
    lastRecoverySentAt,
    lastRecoveryChannels,
    sendNotConfigured,
    lastSendStatus,
    lastSendTime,
    lastSendChannels,
    lastSendMissingEnvVars,
    lastSendProviderStatuses,
    lastCustomerReturnAt,
    customerReturned: Boolean(lastCustomerReturnAt),
    installedAt: shopRecord.createdAt
      ? new Date(shopRecord.createdAt).toISOString().slice(0, 10)
      : "Not recorded",
    artifactStatus: artifactInstalled ? "Installed" : "Pending",
    planTier: "free",
    abandoStatus: artifactInstalled ? "Active" : "Pending",
    merchantRecoveryStatus: Number(checkoutEventCount || 0) >= 1
      ? "Recovery ready"
      : artifactInstalled
        ? "Listening for checkout activity"
        : "Not connected",
    latestEventType: latestEventPayload?.event_type || null,
    latestEventTimestamp: lastCheckoutEventAt,
    checkoutEventCount,
    cartsTotal,
    cartsRecovered,
    emailsSent,
    realAttributedRevenueCents: Number(realRevenueStats?._sum?.attributedOrderValueCents || 0),
    realAttributedOrderCount: Number(realRevenueStats?._count?.attributedOrderId || 0),
    decisionsObserved: Object.values(decisionCounts).reduce((sum, count) => sum + Number(count || 0), 0),
    interceptsShown: Number(decisionCounts.shown || 0),
    continuedAfterIntercept: Number(decisionCounts.continued || 0),
    dismissedAfterIntercept: Number(decisionCounts.dismissed || 0),
    validationDecisionsObserved: Object.values(validationCounts).reduce((sum, count) => sum + Number(count || 0), 0),
    validationInterceptsShown: Number(validationCounts.shown || 0),
    validationContinuedAfterIntercept: Number(validationCounts.continued || 0),
    validationDismissedAfterIntercept: Number(validationCounts.dismissed || 0),
  };
}
