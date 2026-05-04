import { readFileSync, writeFileSync } from "fs";

const REGISTRY_PATH = "staffordos/clients/client_registry_v1.json";

function hoursSince(ts) {
  if (!ts) return 999;
  return (Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60);
}

function buildFollowupMessage(client, stageHours) {
  const recovered = client.abando?.merchant_revenue_recovered || 0;

  if (stageHours < 24) {
    return `Quick follow-up — we already recovered $${recovered} from your store.

Want me to lock this in so it runs consistently?`;
  }

  if (stageHours < 72) {
    return `Just checking back — the $${recovered} we recovered was only a one-time event.

Right now nothing is running to capture that consistently.

Want me to set this up for you?`;
  }

  return `Last note on this — we proved there's revenue being left on the table ($${recovered}).

If you want, I can fix it and set it up so it runs daily.

Let me know.`;
}

function run() {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const now = new Date().toISOString();

  const results = [];

  registry.clients = registry.clients.map(client => {
    if (client.lifecycle?.stage !== "proposal_sent") return client;

    const lastUpdate = client.lifecycle.stage_updated_at;
    const hours = hoursSince(lastUpdate);

    const message = buildFollowupMessage(client, hours);

    const followup = {
      type: "followup_ready",
      owner: "system",
      message,
      urgency:
        hours > 72 ? "high" :
        hours > 24 ? "medium" :
        "low",
      generated_at: now
    };

    client.close_engine = {
      last_evaluated_at: now,
      hours_since_proposal: Math.round(hours),
      followup_ready: true,
      suggested_message: message,
      urgency: followup.urgency
    };

    results.push({
      client_id: client.client_id,
      hours_since: Math.round(hours),
      urgency: followup.urgency
    });

    return client;
  });

  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");

  console.log(JSON.stringify({
    ok: true,
    engine: "close_engine_v1",
    evaluated_at: now,
    results
  }, null, 2));
}

run();
