import fs from "node:fs";
import path from "node:path";

export function loadShopifixerCommandCenter() {
  const filePath = path.join(process.cwd(), "../../../shopifixer/shopifixer_command_center_v1.json");

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {
      schema: "staffordos.shopifixer_command_center.v1",
      generated_at: "",
      merchant: {
        store: "unavailable",
        client_id: "unavailable",
      },
      audit: {
        score: 0,
        top_issue: "unavailable",
        recommendation: "unavailable",
      },
      offer: {
        offer_status: "unavailable",
        offer_price: 0,
        send_allowed: false,
      },
      payment: {
        payment_status: "unavailable",
        readiness: "unavailable",
      },
      fulfillment: {
        fulfillment_status: "unavailable",
        execution_status: "unavailable",
        proof_status: "unavailable",
      },
      lifecycle: {
        offer_generated: false,
        offer_sent: false,
        payment_received: false,
        fulfillment_started: false,
        proof_complete: false,
        completed: false,
      },
      overall: {
        current_stage: "unavailable",
        next_required_action: "unavailable",
        readiness_score: 0,
      },
    };
  }
}
