import { writeFileSync, mkdirSync } from "node:fs";

const profile = process.argv[2] || "";
const baseUrl = process.env.STAFFORDOS_QA_BASE_URL || "http://localhost:8081";

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON but received non-JSON response from ${url}: ${text.slice(0, 160)}`);
  }

  return { response, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const profiles = {
  async abando_basic_health() {
    const { response, json } = await requestJson(`${baseUrl}/health`);
    assert(response.status === 200, "Health endpoint did not return 200");
    assert(json.ok === true, "Health endpoint did not return ok=true");
    return { endpoint: "/health", status: "PASSED", json };
  },

  async abando_recovery_send() {
    const { response, json } = await requestJson(`${baseUrl}/api/recovery-actions/send-live-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop: "demo-shop.myshopify.com",
        email: "rossstafford1@gmail.com",
        phone: "",
        channel: "email",
        experienceId: "staffordos-runtime-qa-send"
      })
    });

    assert(response.status === 200, "Recovery send did not return 200");
    assert(json.status === "REAL_SEND_SUCCEEDED", "Recovery send did not return REAL_SEND_SUCCEEDED");
    assert(json.sends?.[0]?.success === true, "Recovery send did not include successful provider send");

    return { endpoint: "/api/recovery-actions/send-live-test", status: "PASSED", json };
  },

  async abando_return_attribution() {
    const url = `${baseUrl}/api/recovery/return?shop=demo-shop.myshopify.com&eid=staffordos-runtime-qa-return&revenue=100`;
    const { response, json } = await requestJson(url);

    assert(response.status === 200, "Return attribution did not return 200");
    assert(json.status === "REVENUE_ATTRIBUTED", "Return attribution did not return REVENUE_ATTRIBUTED");
    assert(json.attribution?.returned === true, "Return attribution did not mark returned=true");

    return { endpoint: "/api/recovery/return", status: "PASSED", json };
  }
};

async function main() {
  if (!profile || !profiles[profile]) {
    throw new Error(`Unknown QA profile: ${profile}`);
  }

  const startedAt = new Date().toISOString();
  let result;

  try {
    result = await profiles[profile]();
    result = {
      generated_at: startedAt,
      completed_at: new Date().toISOString(),
      qa_profile: profile,
      status: "PASSED",
      result
    };
  } catch (error) {
    result = {
      generated_at: startedAt,
      completed_at: new Date().toISOString(),
      qa_profile: profile,
      status: "FAILED",
      error: error instanceof Error ? error.message : String(error)
    };
  }

  mkdirSync("staffordos/execution/output", { recursive: true });
  writeFileSync(
    "staffordos/execution/output/runtime_qa_latest.json",
    JSON.stringify(result, null, 2) + "\n"
  );

  console.log(JSON.stringify(result, null, 2));

  if (result.status !== "PASSED") process.exit(1);
}

main();
