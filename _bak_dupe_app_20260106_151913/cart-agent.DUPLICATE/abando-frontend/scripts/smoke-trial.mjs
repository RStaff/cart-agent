const BASE = process.env.SMOKE_BASE_URL || "http://localhost:4000";
const plan = process.argv[2] || "basic";

const res = await fetch(`${BASE}/api/trial/start`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ plan }),
});
if (!res.ok) {
  console.error("Smoke FAIL:", res.status, await res.text());
  process.exit(1);
}
const j = await res.json();
if (!j.checkout_url) {
  console.error("Smoke FAIL: missing checkout_url", j);
  process.exit(1);
}
console.log("Smoke OK:", j.checkout_url);
