import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const PROOF_LOOP_DIR = path.join(CANONICAL_ROOT, "staffordos/proof_loop");
const OUTPUT_PATH = path.join(PROOF_LOOP_DIR, "merchant_proof_loop_completion_pack.md");
const OPERATOR_FRONTDOOR_REPORT_PATH = path.join(
  CANONICAL_ROOT,
  "staffordos/operator_frontdoor/operator_frontdoor_report.md",
);
const PROMOTION_BLOCKER_BREAKDOWN_PATH = path.join(
  CANONICAL_ROOT,
  "staffordos/hygiene/output/promotion_blocker_breakdown.md",
);

const PRIMARY_TARGET_SHOP = "no-kings-athletics.myshopify.com";
const PRIMARY_TARGET_PRODUCT_URL =
  "https://no-kings-athletics.myshopify.com/products/no-kings-athletics-airl-fabric-tee";
const PRODUCTION_FRONTEND = "https://app.abando.ai";
const PRODUCTION_API = "https://cart-agent-api.onrender.com";

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function extractLine(markdown, label, fallback) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`- ${escaped}:\\s+(.+)`);
  return markdown.match(regex)?.[1]?.trim() || fallback;
}

function buildCommands(shop) {
  return [
    `curl -i ${PRODUCTION_API}/health`,
    `curl -i ${PRODUCTION_API}/api/recovery-actions/email-readiness`,
    `curl -i "${PRODUCTION_FRONTEND}/experience?shop=${shop}&eid=<fresh-eid>"`,
    `curl -i "${PRODUCTION_FRONTEND}/experience/returned?shop=${shop}&eid=<fresh-eid>"`,
    `curl -i "${PRODUCTION_API}/api/experience/status?shop=${shop}&eid=<fresh-eid>"`,
    `curl -i -X POST "${PRODUCTION_API}/api/recovery-actions/send-live-test" -H "Content-Type: application/json" -d '{"shop":"${shop}","email":"<real-email>","experienceId":"<fresh-eid>","channel":"email"}'`,
  ];
}

function buildMarkdown({
  machineRole,
  deploymentState,
  merchantProofState,
  promotionState,
  shop,
}) {
  const experienceUrl = `${PRODUCTION_FRONTEND}/experience?shop=${shop}&eid=<fresh-eid>`;
  const returnedUrl = `${PRODUCTION_FRONTEND}/experience/returned?shop=${shop}&eid=<fresh-eid>`;
  const statusUrl = `${PRODUCTION_API}/api/experience/status?shop=${shop}&eid=<fresh-eid>`;
  const commands = buildCommands(shop);

  return `# Merchant Proof Loop Completion Pack

## Objective

Complete one real merchant proof loop on a live store with no environment confusion and no fake proof.

## Canonical Environments

- Merchant-facing frontend: \`${PRODUCTION_FRONTEND}\`
- Live backend truth: \`${PRODUCTION_API}\`
- Local hosts are operator-only and do not count as merchant proof.
- Deployment token restoration is **not** the exact next action on \`${machineRole}\`.

## Preconditions

- Machine Role: \`${machineRole}\`
- Deployment State: \`${deploymentState}\`
- Merchant Proof State: \`${merchantProofState}\`
- Promotion State: \`${promotionState}\`
- Primary Target Shop: \`${shop}\`
- Primary Target Product URL: \`${PRIMARY_TARGET_PRODUCT_URL}\`
- Real proof requires:
  - capture checkout
  - send email
  - receive email
  - click recovery link
  - returned state changes
- Fake proof does not count.
- Config-only readiness does not count.

## Exact Proof Loop Steps

### STEP 1 — Confirm canonical live endpoints

- Purpose: Verify Ross is checking the correct production surfaces.
- OPERATOR ACTION: open or curl the canonical live endpoints only.
- MERCHANT-FACING URL CHECK:
  - \`${PRODUCTION_FRONTEND}\`
- BACKEND TRUTH CHECK:
  - \`${PRODUCTION_API}/health\`
- Expected Success Result:
  - frontend resolves at \`${PRODUCTION_FRONTEND}\`
  - backend health returns \`200\`
- Exact Blocker If It Fails:
  - canonical production host is unavailable or mismatched
- Exact Next Action If It Fails:
  - stop proof execution and restore canonical production host integrity first

### STEP 2 — Confirm live readiness

- Purpose: Prove delivery is configured in the live backend.
- OPERATOR ACTION:
  - run \`curl -i ${PRODUCTION_API}/api/recovery-actions/email-readiness\`
- BACKEND TRUTH CHECK:
  - \`${PRODUCTION_API}/api/recovery-actions/email-readiness\`
- Expected Success Result:
  - response includes \`{"configured":true}\`
- Exact Blocker If It Fails:
  - live delivery configuration is not ready
- Exact Next Action If It Fails:
  - restore live email configuration before attempting any proof send

### STEP 3 — Confirm target shop/store for proof

- Purpose: Lock the proof loop to one real merchant store.
- OPERATOR ACTION:
  - use \`${shop}\`
  - open \`${PRIMARY_TARGET_PRODUCT_URL}\`
- MERCHANT-FACING URL CHECK:
  - \`${PRIMARY_TARGET_PRODUCT_URL}\`
- Expected Success Result:
  - live product page loads for \`${shop}\`
- Exact Blocker If It Fails:
  - target shop or product path is not live
- Exact Next Action If It Fails:
  - stop and repair live store/product routing before proof work

### STEP 4 — Capture a real storefront checkout

- Purpose: Create a real abandoned checkout that Abando can recover.
- OPERATOR ACTION:
  - open \`${PRIMARY_TARGET_PRODUCT_URL}\`
  - add product to cart
  - start checkout
  - enter the real recovery email in checkout
  - stop before order completion
- MERCHANT-FACING URL CHECK:
  - Shopify checkout started from the real product page
- Expected Success Result:
  - a real live storefront checkout exists for \`${shop}\`
- Exact Blocker If It Fails:
  - no real storefront checkout was captured
- Exact Next Action If It Fails:
  - repeat checkout capture until the live store has a real abandoned checkout

### STEP 5 — Generate a fresh proof eid

- Purpose: Isolate this run from older tests.
- OPERATOR ACTION:
  - create one fresh eid in this exact format:
    - \`no-kings-real-<YYYYMMDDHHMMSS>\`
- Expected Success Result:
  - fresh eid is unique for this run
- Exact Blocker If It Fails:
  - eid reuse causes ambiguous proof attribution
- Exact Next Action If It Fails:
  - generate a new eid and restart from Step 4 if needed

### STEP 6 — Run real send-live-test

- Purpose: Trigger one real recovery send tied to the fresh eid.
- OPERATOR ACTION:
  - run:
\`\`\`bash
curl -i -X POST "${PRODUCTION_API}/api/recovery-actions/send-live-test" \\
  -H "Content-Type: application/json" \\
  -d '{"shop":"${shop}","email":"<real-email>","experienceId":"<fresh-eid>","channel":"email"}'
\`\`\`
- BACKEND TRUTH CHECK:
  - \`${PRODUCTION_API}/api/recovery-actions/send-live-test\`
- Expected Success Result:
  - response returns success
  - response does not return \`real_checkout_not_captured\`
- Exact Blocker If It Fails:
  - live send path is blocked or no real checkout was captured
- Exact Next Action If It Fails:
  - if \`real_checkout_not_captured\`, return to Step 4 and capture a real abandoned checkout first
  - otherwise repair the live delivery/send path before continuing

### STEP 7 — Confirm email received

- Purpose: Prove execution, not just config.
- OPERATOR ACTION:
  - check the real inbox for the exact recovery email
- Expected Success Result:
  - recovery email arrives for the real email address
- Exact Blocker If It Fails:
  - delivery execution proof is missing
- Exact Next Action If It Fails:
  - inspect the live send result and delivery system before any claim of proof completion

### STEP 8 — Click recovery link

- Purpose: Drive the live return path from the actual recovery message.
- OPERATOR ACTION:
  - click the recovery link from the received email
- MERCHANT-FACING URL CHECK:
  - recovery link should resolve back through \`${PRODUCTION_FRONTEND}\`
- Expected Success Result:
  - link opens successfully
  - merchant-facing flow stays on canonical production hosts
- Exact Blocker If It Fails:
  - recovery link is broken or points to a non-canonical host
- Exact Next Action If It Fails:
  - repair live recovery link generation and retry from Step 6 with a fresh eid

### STEP 9 — Verify returned state

- Purpose: Prove that the click changed live return state.
- OPERATOR ACTION:
  - run:
    - \`curl -i "${statusUrl}"\`
- BACKEND TRUTH CHECK:
  - \`${statusUrl}\`
- Expected Success Result:
  - response shows:
    - \`return.returned = true\` or
    - \`loop.return_detected = true\`
- Exact Blocker If It Fails:
  - return tracking did not change after the recovery click
- Exact Next Action If It Fails:
  - inspect the live recovery redirect and return-attribution path before retrying

### STEP 10 — Verify proof/attribution surfaces

- Purpose: Confirm merchant-facing proof reflects backend truth.
- OPERATOR ACTION:
  - open:
    - \`${experienceUrl}\`
    - \`${returnedUrl}\`
  - compare them with:
    - \`${statusUrl}\`
- MERCHANT-FACING URL CHECK:
  - \`${experienceUrl}\`
  - \`${returnedUrl}\`
- BACKEND TRUTH CHECK:
  - \`${statusUrl}\`
- Expected Success Result:
  - experience surfaces load
  - returned proof reflects the live status state
  - attribution appears if and only if the backend has real proof
- Exact Blocker If It Fails:
  - proof surface does not reflect live backend truth
- Exact Next Action If It Fails:
  - repair proof-surface rendering or backend-to-frontend state mapping before claiming success

### STEP 11 — Decide whether proof loop is complete or blocked

- Purpose: End with one hard pass/fail decision.
- OPERATOR ACTION:
  - mark the run complete only if all proof conditions are met
- Expected Success Result:
  - real checkout captured
  - send succeeded
  - email received
  - recovery link clicked
  - returned state changed
- Exact Blocker If It Fails:
  - any missing step keeps merchant proof incomplete
- Exact Next Action If It Fails:
  - resolve the earliest failing step and rerun with a fresh eid

## URLs To Open

- ${PRODUCTION_FRONTEND}
- ${PRIMARY_TARGET_PRODUCT_URL}
- ${experienceUrl}
- ${returnedUrl}
- ${PRODUCTION_API}/health
- ${PRODUCTION_API}/api/recovery-actions/email-readiness
- ${statusUrl}

## Commands To Run

\`\`\`bash
${commands.join("\n")}
\`\`\`

## Success Criteria

- true success requires:
  - capture checkout
  - send email
  - receive email
  - click recovery link
  - returned state changes
- merchant-facing URLs stay on \`${PRODUCTION_FRONTEND}\`
- backend truth comes from \`${PRODUCTION_API}\`
- no localhost flow counts
- no fake proof counts

## Failure Interpretation

- If readiness fails:
  - live delivery is not ready
- If send-live-test returns \`real_checkout_not_captured\`:
  - the live proof loop has not started because checkout capture is missing
- If email is not received:
  - delivery execution proof is missing
- If the recovery link does not return the shopper:
  - return flow proof is missing
- If status does not change after click:
  - proof attribution is still incomplete

## Exact Final Pass/Fail Rule

- PASS only if:
  - a real storefront checkout was captured
  - \`send-live-test\` returned success
  - the real email was received
  - the recovery link was clicked
  - \`${statusUrl}\` changed to returned/return-detected state
- FAIL if any one of those conditions is missing
`;
}

export function runMerchantProofLoopCompletionPack() {
  if (!fileExists(OPERATOR_FRONTDOOR_REPORT_PATH)) {
    throw new Error(`Required report missing: ${OPERATOR_FRONTDOOR_REPORT_PATH}`);
  }
  if (!fileExists(PROMOTION_BLOCKER_BREAKDOWN_PATH)) {
    throw new Error(`Required report missing: ${PROMOTION_BLOCKER_BREAKDOWN_PATH}`);
  }

  const frontdoor = readText(OPERATOR_FRONTDOOR_REPORT_PATH);
  const blockerBreakdown = readText(PROMOTION_BLOCKER_BREAKDOWN_PATH);
  const machineRole = extractLine(frontdoor, "Machine Role", "UNKNOWN").replace(/`/g, "");
  const deploymentState = extractLine(frontdoor, "DEPLOYMENT STATE", "UNKNOWN");
  const merchantProofState = extractLine(frontdoor, "MERCHANT PROOF STATE", "UNKNOWN");
  const promotionState = extractLine(frontdoor, "PROMOTION STATE", "UNKNOWN");

  const exactNextAction =
    blockerBreakdown.includes("live_proof_loop_currently_stops_if_no_real_storefront_checkout_has_been_captured")
      ? "Capture a real live storefront checkout, then rerun send-live-test and the return flow."
      : "Complete the real merchant proof loop with a real storefront checkout and verified return.";

  const markdown = buildMarkdown({
    machineRole,
    deploymentState,
    merchantProofState,
    promotionState,
    shop: PRIMARY_TARGET_SHOP,
  });

  return {
    status: "READY",
    primaryTargetShop: PRIMARY_TARGET_SHOP,
    exactNextAction,
    markdown,
  };
}

export function writeMerchantProofLoopCompletionPack(markdown) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, markdown, "utf8");
  if (!fs.existsSync(OUTPUT_PATH)) {
    throw new Error(`merchant_proof_loop_completion_pack.md was not created at ${OUTPUT_PATH}`);
  }
  const stats = fs.statSync(OUTPUT_PATH);
  if (!stats.isFile()) {
    throw new Error(`merchant_proof_loop_completion_pack.md path is not a file: ${OUTPUT_PATH}`);
  }
  return OUTPUT_PATH;
}

export { OUTPUT_PATH, PRIMARY_TARGET_SHOP };
