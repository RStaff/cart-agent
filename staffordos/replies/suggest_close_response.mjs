#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const RESPONSE_MAP = {
  interested: {
    suggestedResponse: `Yeah — this is exactly the kind of Shopify dev setup issue I fix.

Once I see the repo + error, I can usually stabilize the tunnel + preview flow pretty quickly.

If you want to skip the back-and-forth and just get it working:
http://dev.abando.ai/fix`,
    recommendedAction: "send_response_and_push_to_fix",
  },
  info_request: {
    suggestedResponse: `Perfect — just send:

- repo or project setup
- exact error / what’s happening
- what you’ve already tried

I’ll map the fix path quickly.

If you want me to just take it and get it working end-to-end:
http://dev.abando.ai/fix`,
    recommendedAction: "send_response_and_request_details",
  },
  pricing_objection: {
    suggestedResponse: `Yeah — it’s a flat fix, not hourly.

The idea is you don’t lose another day chasing tunnels / preview issues that keep breaking.

If it fits what you’re dealing with, I’ll get it stable quickly:
http://dev.abando.ai/fix`,
    recommendedAction: "justify_and_hold_line",
  },
  trust_objection: {
    suggestedResponse: `These issues usually come down to a broken path between tunnel, app URL, Shopify config, and embedded rendering.

That’s what I fix end-to-end so it stays working, not just temporarily.

If you want, the scope is here:
http://dev.abando.ai/fix`,
    recommendedAction: "reassure_with_mechanism",
  },
  delay: {
    suggestedResponse: `Makes sense — if it keeps looping or breaking again, that usually means the underlying dev path still isn’t fixed.

If you hit that point, this will still be here:
http://dev.abando.ai/fix`,
    recommendedAction: "leave_door_open",
  },
  not_interested: {
    suggestedResponse: `No problem — if it comes back or keeps breaking again, you can use this when you need it:
http://dev.abando.ai/fix`,
    recommendedAction: "archive_or_wait",
  },
  unclear: {
    suggestedResponse: `Got it — from what you described, this still sounds like a Shopify dev path issue around tunnel / preview / embedded setup.

If you want, send the exact error or use this to move faster:
http://dev.abando.ai/fix`,
    recommendedAction: "clarify_and_redirect",
  },
};

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--leadId") {
      args.leadId = String(argv[index + 1] || "").trim();
      index += 1;
    } else if (token === "--replyType") {
      args.replyType = String(argv[index + 1] || "").trim();
      index += 1;
    } else if (token === "--text") {
      args.text = String(argv[index + 1] || "").trim();
      index += 1;
    }
  }
  return args;
}

function buildContextualResponse(type, context = {}) {
  const hasDiagnosis = Boolean(context?.hasDiagnosis);
  const hasIntake = Boolean(context?.hasIntake);
  const paymentReady = context?.paymentStatus === "payment_ready" || context?.paymentStatus === "paid";

  if (type === "interested" && !hasDiagnosis && !hasIntake) {
    return {
      suggestedResponse: `Yeah — this looks like the kind of Shopify dev path issue I fix.

Drop the exact setup and error in here and I’ll map the likely fix path quickly:
http://dev.abando.ai/fix`,
      recommendedAction: "send_response_and_push_to_intake",
    };
  }

  if (type === "info_request" && !hasDiagnosis && !hasIntake) {
    return {
      suggestedResponse: `Perfect — put the setup and exact error in here and I’ll map the likely issue fast:

http://dev.abando.ai/fix

If it looks like a clean fit, you can move straight from diagnosis to the fix path there.`,
      recommendedAction: "send_response_and_request_intake",
    };
  }

  if (type === "trust_objection" && !hasDiagnosis && !hasIntake) {
    return {
      suggestedResponse: `Totally fair — the point of this isn’t “trust me first.”

Send the setup through here and I’ll classify the likely issue path before you decide what to do next:
http://dev.abando.ai/fix`,
      recommendedAction: "reassure_and_push_to_intake",
    };
  }

  if (type === "interested" && hasDiagnosis && paymentReady) {
    return RESPONSE_MAP.interested;
  }

  return RESPONSE_MAP[type] || RESPONSE_MAP.unclear;
}

export async function suggestCloseResponse(leadId, replyType, replyText = "", context = {}) {
  if (!leadId) {
    throw new Error("missing_lead_id");
  }
  const type = RESPONSE_MAP[replyType] ? replyType : "unclear";
  const config = buildContextualResponse(type, context);
  const result = {
    ok: true,
    leadId,
    replyType: type,
    suggestedResponse: config.suggestedResponse,
    recommendedAction: config.recommendedAction,
    stage: "mid_funnel",
    replyText: String(replyText || "").trim(),
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  const args = parseArgs(process.argv);
  await suggestCloseResponse(args.leadId, args.replyType, args.text);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exit(1);
  });
}
