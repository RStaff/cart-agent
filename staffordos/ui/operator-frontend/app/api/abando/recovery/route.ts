import { NextResponse } from "next/server";
import { appendRecoveryActionLog, LOG_PATH } from "../../../../../../products/abando/recovery/log_recovery_action.js";
import { generateRecoveryMessage } from "../../../../../../products/abando/recovery/generate_recovery_message.js";
import { getQueueRow, QUEUE_PATH, readQueue, updateQueueRow } from "../../../../../../products/abando/recovery/queue_store.js";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeInput(input: Record<string, unknown>) {
  return {
    id: cleanText(input.id),
    shop: cleanText(input.shop),
    customer_email: cleanText(input.customer_email),
    customer_phone: cleanText(input.customer_phone),
    channel: cleanText(input.channel).toLowerCase() === "sms" ? "sms" : "email",
    cart_value: Number(input.cart_value || 0) || 0,
    currency: cleanText(input.currency) || "USD",
    event_type: cleanText(input.event_type) || "checkout_abandoned",
    experience_id: cleanText(input.experience_id),
    recovery_url: cleanText(input.recovery_url),
    message_angle: cleanText(input.message_angle) || "complete_purchase",
    subject: cleanText(input.subject),
    body: cleanText(input.body),
    status: cleanText(input.status) || "queued",
    notes: cleanText(input.notes),
  };
}

function validateInput(input: ReturnType<typeof normalizeInput>) {
  const errors: string[] = [];
  if (!input.shop) errors.push("shop_missing");
  if (!input.customer_email && !input.customer_phone) errors.push("recipient_missing");
  if (!input.recovery_url) errors.push("recovery_url_missing");
  return errors;
}

function loggableStatus(status: string) {
  return ["sent", "returned", "lost"].includes(status);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    console: {
      product: "abando",
      surface: "StaffordOS -> Products -> Abando -> Recovery Queue",
      queuePath: QUEUE_PATH,
      logPath: LOG_PATH,
      allowedStatuses: ["queued", "draft_generated", "sent", "returned", "lost"],
      allowedAngles: ["complete_purchase", "return_to_cart", "simple_reminder"],
      operatorRequired: true,
    },
    queue: readQueue(),
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      action?: string;
      selected_row_id?: string;
      input?: Record<string, unknown>;
    };

    const action = cleanText(payload.action).toLowerCase();
    const input = normalizeInput(payload.input || {});
    const selectedRowId = cleanText(payload.selected_row_id || input.id);

    if (action === "generate") {
      const row = getQueueRow(selectedRowId);
      const source = row ? { ...row, ...input, id: row.id } : input;
      const errors = validateInput(source);
      if (errors.length) {
        return NextResponse.json({ ok: false, errors }, { status: 400 });
      }

      const draft = generateRecoveryMessage(source);
      const queueRow = updateQueueRow(selectedRowId, {
        ...source,
        ...draft,
        status: "draft_generated",
      });

      return NextResponse.json({
        ok: true,
        draft,
        queue_row: queueRow,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "save_review") {
      const queueRow = updateQueueRow(selectedRowId, {
        ...input,
      });

      return NextResponse.json({
        ok: true,
        queue_row: queueRow,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "set_status") {
      const status = cleanText(input.status);
      const queueRow = updateQueueRow(selectedRowId, {
        ...input,
        status,
      });

      const log = loggableStatus(status)
        ? appendRecoveryActionLog(queueRow)
        : null;

      return NextResponse.json({
        ok: true,
        queue_row: queueRow,
        log,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: false, error: "unsupported_action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "abando_recovery_failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
