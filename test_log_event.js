const { logEvent } = require('./api/lib/eventLogger');

(async () => {
  try {
    console.log("[test_log_event] Calling logEvent()…");
    await logEvent({
      storeId: "test-store-node",
      eventType: "direct_node_test",
      eventSource: "node_test_script",
      customerId: "test-customer",
      cartId: "test-cart",
      checkoutId: "test-checkout",
      value: 123.45,
      aiLabel: { kind: "node_harness", env: "local->render" },
      metadata: {
        note: "direct Node test of logEvent()",
        ts: new Date().toISOString(),
      },
    });
    console.log("[test_log_event] logEvent() resolved without throwing.");
    process.exit(0);
  } catch (err) {
    console.error("[test_log_event] ERROR:", err);
    process.exit(1);
  }
})();
