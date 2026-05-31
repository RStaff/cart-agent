import fs from "fs";

const registryPath = "staffordos/authority/authority_registry_v1.json";
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const failures = [];

function requireAuthority(name) {
  const found = registry.authorities.find((a) => a.name === name);
  if (!found) failures.push(`missing_authority:${name}`);
  return found;
}

const checkout = requireAuthority("Checkout Authority");
const packet = requireAuthority("Packet Authority");
const webhook = requireAuthority("Stripe Webhook Authority");

if (checkout?.not_allowed?.includes("Mark payment_received") !== true) {
  failures.push("checkout_may_mark_payment_received");
}

if (packet?.not_allowed?.some((x) => x.includes("payment_received")) !== true) {
  failures.push("packet_authority_missing_payment_received_boundary");
}

if (!webhook?.required?.includes("STRIPE_WEBHOOK_SECRET")) {
  failures.push("webhook_missing_STRIPE_WEBHOOK_SECRET_requirement");
}

if (!webhook?.required?.some((x) => x.includes("constructEvent"))) {
  failures.push("webhook_missing_constructEvent_requirement");
}

if (!webhook?.required?.includes("express.raw()")) {
  failures.push("webhook_missing_express_raw_requirement");
}

const result = {
  schema: "staffordos.authority_registry_validation.v1",
  status: failures.length ? "failed" : "passed",
  failures,
  next_required_phase: registry.next_required_phase,
  blocked_actions: registry.blocked_actions
};

fs.mkdirSync("staffordos/authority/output", { recursive: true });
fs.writeFileSync(
  "staffordos/authority/output/authority_registry_validation_v1.json",
  JSON.stringify(result, null, 2)
);

console.log(JSON.stringify(result, null, 2));

if (failures.length) process.exit(1);
