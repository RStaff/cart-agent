import { readFileSync } from "node:fs";

const file = "web/src/routes/recoveryLiveTest.esm.js";
const text = readFileSync(file, "utf8");

const failures = [];

if (text.includes("to: proof.email") || text.includes("shop: proof.shop")) {
  failures.push("Route uses proof before proof is initialized.");
}

if (!text.includes("sendAbandoRecoveryEmail")) {
  failures.push("Route is not wired to Abando recovery sender.");
}

if (text.includes('status: "PASS"') && !text.includes("REAL_SEND_SUCCEEDED")) {
  failures.push("Route appears to use fake PASS proof instead of real send status.");
}

if (failures.length) {
  console.error("❌ Recovery route guardrail failed:");
  for (const failure of failures) console.error("-", failure);
  process.exit(1);
}

console.log("✅ Recovery route guardrail passed");
