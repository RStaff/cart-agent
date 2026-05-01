import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "staffordos/system_inventory/output");

function exists(p) {
  return fs.existsSync(path.join(root, p));
}

function read(p) {
  const full = path.join(root, p);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

function grepFile(p, terms) {
  const text = read(p);
  return terms.map((term) => ({
    term,
    found: text.includes(term)
  }));
}

const files = {
  public_demo_route: "web/src/routes/playground.esm.js",
  live_test_route: "web/src/routes/recoveryLiveTest.esm.js",
  backend_entry: "web/src/index.js",
  recovery_engine: "web/src/lib/recoveryMessageEngine.js",
  abandoned_email_renderer: "web/src/lib/renderAbandonedEmail.js",
  email_sender_shopifixer: "web/src/lib/emailSender.js",
  sms_sender: "web/src/lib/smsSender.js",
  checkout_signals: "web/src/routes/checkoutSignals.esm.js",
  worker: "web/src/jobs/worker.js",
  latest_live_test_proof: "staffordos/system_inventory/output/proof_runs/latest_abando_live_test_proof.json",
  latest_worker_proof: "staffordos/system_inventory/output/proof_runs/latest_abando_recovery_loop_run.json"
};

const checks = {
  playground_to_live_test: grepFile(files.public_demo_route, [
    "/demo/recovery-proof.js",
    "/demo/playground.js"
  ]),
  live_test_route_contract: grepFile(files.live_test_route, [
    "/api/recovery-actions/send-live-test",
    "renderAbandonedEmail",
    "nodemailer",
    "REAL_SEND_SUCCEEDED",
    "latest_abando_live_test_proof.json"
  ]),
  backend_mounts: grepFile(files.backend_entry, [
    "installPlayground(app)",
    "installRecoveryLiveTestRoute(app",
    "installAskAbandoRoute(app)"
  ]),
  worker_loop: grepFile(files.worker, [
    "recovery_email",
    "renderAbandonedEmail",
    "claimNextRunnableJob"
  ]),
  checkout_signal_loop: grepFile(files.checkout_signals, [
    "checkout_started",
    "recovery_email",
    "decision"
  ])
};

let latestLiveProof = null;
try {
  latestLiveProof = JSON.parse(read(files.latest_live_test_proof));
} catch {}

let latestWorkerProof = null;
try {
  latestWorkerProof = JSON.parse(read(files.latest_worker_proof));
} catch {}

const map = {
  generated_at: new Date().toISOString(),
  canonical_abando_proof_path: {
    name: "Abando canonical proof path v1",
    purpose: "Unify public demo proof and backend abandoned-checkout recovery proof into one product truth path.",
    current_truth: {
      A_backend_recovery_worker_proof: latestWorkerProof ? "FOUND" : "NOT_FOUND",
      B_public_playground_live_send_proof: latestLiveProof ? "FOUND" : "NOT_FOUND",
      unified_canonical_path_status: latestWorkerProof && latestLiveProof ? "PARTIALLY_UNIFIED_REQUIRES_BRIDGE" : "INCOMPLETE"
    },
    path_A_backend_worker: {
      description: "Checkout signal or seeded abandoned checkout creates/queues recovery_email job; worker renders abandoned email and sends it.",
      source_files: [
        files.checkout_signals,
        files.worker,
        files.abandoned_email_renderer
      ],
      proof_file: files.latest_worker_proof,
      proof_summary: latestWorkerProof
        ? {
            status: latestWorkerProof.status || latestWorkerProof.ok || "unknown",
            generated_at: latestWorkerProof.generated_at || latestWorkerProof.completed_at || null
          }
        : null
    },
    path_B_public_playground: {
      description: "Public playground calls send-live-test; route generates Abando recovery message, sends real SMTP email, and writes proof.",
      source_files: [
        files.public_demo_route,
        files.live_test_route,
        files.recovery_engine,
        files.abandoned_email_renderer
      ],
      proof_file: files.latest_live_test_proof,
      proof_summary: latestLiveProof
        ? {
            ok: latestLiveProof.ok,
            status: latestLiveProof.status,
            provider: latestLiveProof.sends?.[0]?.provider || null,
            messageId: latestLiveProof.sends?.[0]?.messageId || null,
            accepted: latestLiveProof.sends?.[0]?.accepted || [],
            generated_at: latestLiveProof.generated_at || null
          }
        : null
    },
    missing_bridge: {
      description: "The public playground proof and backend worker proof are both real, but they are not yet one canonical flow.",
      required_bridge: [
        "send-live-test should optionally create or reference a canonical checkout/recovery event",
        "worker proof and live-test proof should write into one shared Abando proof ledger",
        "proof UI should display both direct-demo send and real abandoned-checkout send under one proof path",
        "return link should resolve to a real /recover/:token route and record attribution"
      ]
    },
    canonical_one_path_target: [
      "Customer/storefront checkout signal captured",
      "Canonical recovery event created",
      "Recovery message generated",
      "Email/SMS provider send executed",
      "Provider message id recorded",
      "Recovery proof ledger updated",
      "Return link clicked",
      "Attribution recorded",
      "Operator/System Map reads same ledger"
    ]
  },
  files,
  file_existence: Object.fromEntries(Object.entries(files).map(([k, v]) => [k, exists(v)])),
  checks
};

fs.writeFileSync(
  path.join(outDir, "abando_canonical_proof_path_map_v1.json"),
  JSON.stringify(map, null, 2) + "\n"
);

const md = `# Abando Canonical Proof Path Map v1

Generated: ${map.generated_at}

## Current Truth

| Path | Status |
|---|---|
| A — Backend abandoned-checkout / worker proof | ${map.canonical_abando_proof_path.current_truth.A_backend_recovery_worker_proof} |
| B — Public playground / live send proof | ${map.canonical_abando_proof_path.current_truth.B_public_playground_live_send_proof} |
| Unified canonical path | ${map.canonical_abando_proof_path.current_truth.unified_canonical_path_status} |

## Path A — Backend Worker Proof

${map.canonical_abando_proof_path.path_A_backend_worker.description}

Source files:
${map.canonical_abando_proof_path.path_A_backend_worker.source_files.map(f => `- \`${f}\``).join("\n")}

Proof file:
- \`${files.latest_worker_proof}\`

## Path B — Public Playground Proof

${map.canonical_abando_proof_path.path_B_public_playground.description}

Source files:
${map.canonical_abando_proof_path.path_B_public_playground.source_files.map(f => `- \`${f}\``).join("\n")}

Proof file:
- \`${files.latest_live_test_proof}\`

## Missing Bridge

${map.canonical_abando_proof_path.missing_bridge.required_bridge.map(x => `- ${x}`).join("\n")}

## Canonical One-Path Target

${map.canonical_abando_proof_path.canonical_one_path_target.map((x, i) => `${i + 1}. ${x}`).join("\n")}

## Rule Going Forward

Abando proof must resolve to one path:

\`\`\`
checkout signal OR playground test
  → canonical recovery event
  → recovery message
  → provider send
  → proof ledger
  → return attribution
  → operator/system map
\`\`\`
`;

fs.writeFileSync(
  path.join(outDir, "abando_canonical_proof_path_map_v1.md"),
  md
);

console.log(JSON.stringify({
  ok: true,
  wrote: [
    "staffordos/system_inventory/output/abando_canonical_proof_path_map_v1.json",
    "staffordos/system_inventory/output/abando_canonical_proof_path_map_v1.md"
  ],
  status: map.canonical_abando_proof_path.current_truth.unified_canonical_path_status,
  live_send_status: latestLiveProof?.status || null,
  live_send_message_id: latestLiveProof?.sends?.[0]?.messageId || null,
  worker_proof_found: Boolean(latestWorkerProof)
}, null, 2));
