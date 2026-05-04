import { readFileSync, writeFileSync } from "fs";
import https from "https";

const OFFER_PATH = "staffordos/clients/shopifixer_offer_latest.json";
const REGISTRY_PATH = "staffordos/clients/client_registry_v1.json";

function sendEmail(shop, email) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      shop,
      email
    });

    const req = https.request(
      "https://pay.abando.ai/api/recovery-actions/send-live-test",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length
        }
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body
          });
        });
      }
    );

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function run() {
  const offer = JSON.parse(readFileSync(OFFER_PATH, "utf8"));
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));

  const client = registry.clients.find(
    (c) => c.client_id === offer.client_id
  );

  if (!client) {
    console.error("Client not found.");
    process.exit(1);
  }

  console.log("\n===== SENDING OFFER =====\n");

  sendEmail(client.merchant_shop, offer.email)
    .then((result) => {
      console.log("Email send result:", result.status);

      const now = new Date().toISOString();

      // LOG EVENT
      client.notes = client.notes || [];
      client.notes.push({
        at: now,
        type: "offer_sent",
        text: `ShopiFixer offer sent ($${offer.offer.pricing.shopifixer_one_time})`
      });

      // UPDATE LIFECYCLE
      client.lifecycle = client.lifecycle || {};
      client.lifecycle.stage = "proposal_sent";
      client.lifecycle.stage_updated_at = now;

      // UPDATE NEXT ACTION
      client.next_action = {
        type: "followup",
        owner: "ross",
        instructions: "Follow up on ShopiFixer offer.",
        auto_executable: false,
        updated_at: now
      };

      writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");

      console.log("\n===== SYSTEM UPDATED =====\n");
      console.log({
        lifecycle: client.lifecycle.stage,
        next_action: client.next_action.type
      });
    })
    .catch((err) => {
      console.error("Send failed:", err);
    });
}

run();
