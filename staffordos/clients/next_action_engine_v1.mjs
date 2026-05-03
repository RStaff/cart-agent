import { readFileSync, writeFileSync } from "node:fs";

const REGISTRY_PATH = "staffordos/clients/client_registry_v1.json";

function now() {
  return new Date().toISOString();
}


function computePriorityScore(client) {
  const revenue = client.revenue || {};
  const abando = client.abando || {};
  const lifecycle = client.lifecycle || {};
  const nextAction = client.next_action || {};

  const revenuePotential =
    Number(revenue.shopifixer_one_time || 0) +
    Number(revenue.abando_recurring_mrr || 0) * 12 +
    Number(abando.merchant_revenue_recovered || 0);

  const easeOfClose =
    lifecycle.stage === "revenue_active" ? 95 :
    lifecycle.stage === "deal_won" ? 90 :
    lifecycle.stage === "proposal_sent" ? 75 :
    lifecycle.stage === "audit_completed" ? 65 :
    lifecycle.stage === "lead" ? 40 :
    50;

  const timeToCash =
    nextAction.type === "collect_payment" ? 95 :
    nextAction.type === "close" ? 85 :
    nextAction.type === "proposal" ? 70 :
    nextAction.type === "outreach" ? 45 :
    nextAction.type === "monitor" ? 35 :
    50;

  const health = client.system_health || {};
  const greenCount = Object.entries(health)
    .filter(([key, value]) => key !== "last_verified_at" && value === "green")
    .length;

  const systemConfidence = Math.min(100, greenCount * 20);

  const total =
    Math.round(
      (Math.min(100, revenuePotential) * 0.35) +
      (easeOfClose * 0.25) +
      (timeToCash * 0.25) +
      (systemConfidence * 0.15)
    );

  return {
    revenue_potential: Math.min(100, revenuePotential),
    ease_of_close: easeOfClose,
    time_to_cash: timeToCash,
    system_confidence: systemConfidence,
    total
  };
}

function detectBlockers(client) {
  const blockers = [];

  const health = client.system_health || {};
  for (const [key, value] of Object.entries(health)) {
    if (key !== "last_verified_at" && value === "red") {
      blockers.push({
        type: "system_health",
        severity: "high",
        source: key,
        message: `${key} is red`
      });
    }
  }

  if (client.lifecycle?.stage === "proposal_sent" && client.deal?.payment_status !== "paid") {
    blockers.push({
      type: "payment",
      severity: "medium",
      source: "deal.payment_status",
      message: "Proposal sent but payment is not collected"
    });
  }

  if (client.lifecycle?.stage === "fix_in_progress" && client.shopifixer?.fix_status !== "completed") {
    blockers.push({
      type: "execution",
      severity: "medium",
      source: "shopifixer.fix_status",
      message: "Fix is in progress and not yet completed"
    });
  }

  if (client.abando?.installed === true && Number(client.abando?.checkout_events || 0) > 0 && Number(client.abando?.recovery_actions || 0) === 0) {
    blockers.push({
      type: "recovery",
      severity: "high",
      source: "abando.recovery_actions",
      message: "Checkout events exist but no recovery action has fired"
    });
  }

  return {
    blocked: blockers.length > 0,
    blocker_count: blockers.length,
    highest_severity:
      blockers.some((b) => b.severity === "high") ? "high" :
      blockers.some((b) => b.severity === "medium") ? "medium" :
      blockers.length ? "low" : null,
    blockers
  };
}


function computeNextAction(client) {
  const stage = client.lifecycle?.stage || "lead";
  const auditStatus = client.shopifixer?.audit_status || "not_started";
  const fixStatus = client.shopifixer?.fix_status || "not_started";
  const paymentStatus = client.deal?.payment_status || "unpaid";

  const abandoInstalled = client.abando?.installed === true;
  const checkoutEvents = Number(client.abando?.checkout_events || 0);
  const recoveryActions = Number(client.abando?.recovery_actions || 0);
  const merchantRevenueRecovered = Number(client.abando?.merchant_revenue_recovered || 0);

  const health = client.system_health || {};
  const redHealth = Object.entries(health)
    .filter(([key, value]) => key !== "last_verified_at" && value === "red")
    .map(([key]) => key);

  if (redHealth.length > 0) {
    return {
      lifecycle_stage: stage,
      blocked: true,
      block_reason: `System health issue: ${redHealth.join(", ")}`,
      next_action: {
        type: "monitor",
        owner: "ross",
        due_at: null,
        instructions: `Investigate failed system health checks: ${redHealth.join(", ")}.`,
        auto_executable: false
      }
    };
  }

  if (merchantRevenueRecovered > 0) {
    return {
      lifecycle_stage: "revenue_active",
      blocked: false,
      block_reason: null,
      next_action: {
        type: "monitor",
        owner: "system",
        due_at: null,
        instructions: "Monitor recovered revenue and prepare upsell or case study.",
        auto_executable: true
      }
    };
  }

  if (stage === "lead") {
    return {
      lifecycle_stage: "lead",
      blocked: false,
      block_reason: null,
      next_action: {
        type: "outreach",
        owner: "system",
        due_at: null,
        instructions: "Send first ShopiFixer audit outreach message.",
        auto_executable: true
      }
    };
  }

  if (auditStatus === "not_started" && stage !== "proof_client") {
    return {
      lifecycle_stage: "audit_requested",
      blocked: false,
      block_reason: null,
      next_action: {
        type: "audit",
        owner: "system",
        due_at: null,
        instructions: "Run ShopiFixer audit and write findings to client record.",
        auto_executable: true
      }
    };
  }

  if (auditStatus === "completed" && paymentStatus !== "paid") {
    return {
      lifecycle_stage: "proposal_sent",
      blocked: false,
      block_reason: null,
      next_action: {
        type: "close",
        owner: "ross",
        due_at: null,
        instructions: "Review audit findings and close paid fix or Abando install.",
        auto_executable: false
      }
    };
  }

  if (paymentStatus === "paid" && fixStatus === "not_started") {
    return {
      lifecycle_stage: "deal_won",
      blocked: false,
      block_reason: null,
      next_action: {
        type: "fix",
        owner: "system",
        due_at: null,
        instructions: "Start paid ShopiFixer fix execution packet.",
        auto_executable: true
      }
    };
  }

  if (fixStatus === "completed" && !abandoInstalled) {
    return {
      lifecycle_stage: "fix_completed",
      blocked: false,
      block_reason: null,
      next_action: {
        type: "install_abando",
        owner: "ross",
        due_at: null,
        instructions: "Install Abando for merchant after fix completion.",
        auto_executable: false
      }
    };
  }

  if (abandoInstalled && checkoutEvents === 0) {
    return {
      lifecycle_stage: "abando_installed",
      blocked: false,
      block_reason: null,
      next_action: {
        type: "monitor",
        owner: "system",
        due_at: null,
        instructions: "Monitor for first checkout event.",
        auto_executable: true
      }
    };
  }

  if (abandoInstalled && checkoutEvents > 0 && recoveryActions === 0) {
    return {
      lifecycle_stage: "abando_installed",
      blocked: false,
      block_reason: null,
      next_action: {
        type: "trigger_recovery",
        owner: "system",
        due_at: null,
        instructions: "Trigger recovery action for latest checkout event.",
        auto_executable: true
      }
    };
  }

  return {
    lifecycle_stage: stage,
    blocked: false,
    block_reason: null,
    next_action: {
      type: "followup",
      owner: "ross",
      due_at: null,
      instructions: "Review client state and choose next revenue action.",
      auto_executable: false
    }
  };
}

function run() {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const timestamp = now();

  registry.generated_at = timestamp;
  registry.decision_engine = {
    name: "staffordos.next_action_engine_v1",
    generated_at: timestamp,
    rule: "Deterministically derive lifecycle, blocker state, and next action from client truth."
  };

  registry.clients = (registry.clients || []).map((client) => {
    const decision = computeNextAction(client);

    return {
      ...client,
      updated_at: timestamp,
      lifecycle: {
        ...(client.lifecycle || {}),
        stage: decision.lifecycle_stage,
        stage_updated_at:
          client.lifecycle?.stage === decision.lifecycle_stage
            ? client.lifecycle?.stage_updated_at || timestamp
            : timestamp,
        blocked: decision.blocked,
        block_reason: decision.block_reason
      },
      next_action: {
        ...(client.next_action || {}),
        ...decision.next_action,
        updated_at: timestamp
      },
      priority_score: computePriorityScore({
        ...client,
        lifecycle: {
          ...(client.lifecycle || {}),
          stage: decision.lifecycle_stage,
          blocked: decision.blocked,
          block_reason: decision.block_reason
        },
        next_action: {
          ...(client.next_action || {}),
          ...decision.next_action
        }
      }),
      blocker_detection: detectBlockers({
        ...client,
        lifecycle: {
          ...(client.lifecycle || {}),
          stage: decision.lifecycle_stage,
          blocked: decision.blocked,
          block_reason: decision.block_reason
        },
        next_action: {
          ...(client.next_action || {}),
          ...decision.next_action
        }
      }),
      decision_trace: {
        engine: "next_action_engine_v1",
        evaluated_at: timestamp,
        lifecycle_stage: decision.lifecycle_stage,
        next_action_type: decision.next_action.type,
        blocked: decision.blocked,
        block_reason: decision.block_reason
      }
    };
  });

  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");

  console.log(JSON.stringify({
    ok: true,
    engine: "next_action_engine_v1",
    generated_at: timestamp,
    clients: registry.clients.length,
    next_actions: registry.clients.map((client) => ({
      client_id: client.client_id,
      lifecycle_stage: client.lifecycle.stage,
      blocked: client.lifecycle.blocked,
      next_action: client.next_action.type,
      owner: client.next_action.owner,
      instructions: client.next_action.instructions,
      priority_total: client.priority_score?.total,
      blocker_count: client.blocker_detection?.blocker_count
    }))
  }, null, 2));
}

run();
