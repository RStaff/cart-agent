import type {
  ApplicationFollowUpHistoryEntry,
  ApplicationFollowUpStatus,
  DraftApplicationRecord,
} from "../db/applications_repo";

export const FOLLOW_UP_MAX_COUNT = 3;

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function nowIsoString() {
  return new Date().toISOString();
}

function toIsoString(value: string | Date) {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(timestamp) ? nowIsoString() : new Date(timestamp).toISOString();
}

function addBusinessDays(start: string | Date, businessDays: number) {
  const date = new Date(toIsoString(start));
  let remaining = Math.max(0, Math.floor(businessDays));

  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }

  return date.toISOString();
}

function countableAngles(application: DraftApplicationRecord) {
  return application.strongest_angles
    .map((angle) => cleanText(angle))
    .filter(Boolean)
    .slice(0, 2);
}

function summarizeScoreReasoning(application: DraftApplicationRecord) {
  const reasoning = cleanText(application.score_reasoning);
  if (!reasoning) {
    return "";
  }

  const sentence = reasoning.split(/(?<=[.!?])\s+/)[0] || reasoning;
  return sentence.length > 220 ? `${sentence.slice(0, 217)}...` : sentence;
}

function followUpHistoryEntry(
  action: ApplicationFollowUpHistoryEntry["action"],
  note: string,
  nextFollowUpAt = "",
  timestamp = nowIsoString(),
): ApplicationFollowUpHistoryEntry {
  return {
    timestamp,
    note: cleanText(note),
    action,
    ...(cleanText(nextFollowUpAt) ? { next_follow_up_at: nextFollowUpAt } : {}),
  };
}

function appendHistory(
  application: DraftApplicationRecord,
  action: ApplicationFollowUpHistoryEntry["action"],
  note: string,
  nextFollowUpAt = "",
  timestamp = nowIsoString(),
) {
  return [
    ...application.follow_up_history_json,
    followUpHistoryEntry(action, note, nextFollowUpAt, timestamp),
  ];
}

export function isSubmittedApplication(application: DraftApplicationRecord) {
  return Boolean(cleanText(application.submitted_at)) && application.approval_state !== "skipped";
}

export function resolveFollowUpStatus(
  application: DraftApplicationRecord,
  now = new Date(),
): ApplicationFollowUpStatus {
  if (!isSubmittedApplication(application)) {
    return "none";
  }

  if (application.follow_up_status === "completed" && !cleanText(application.next_follow_up_at)) {
    return "completed";
  }

  if (!cleanText(application.next_follow_up_at)) {
    return application.follow_up_count >= FOLLOW_UP_MAX_COUNT ? "completed" : "scheduled";
  }

  const dueAt = Date.parse(application.next_follow_up_at);
  if (Number.isNaN(dueAt)) {
    return "scheduled";
  }

  return dueAt <= now.getTime() ? "due" : "scheduled";
}

export function getNextFollowUpAt(
  application: DraftApplicationRecord,
  baseAt?: string,
) {
  if (!isSubmittedApplication(application) || application.follow_up_count >= FOLLOW_UP_MAX_COUNT) {
    return "";
  }

  const cleanBaseAt = cleanText(baseAt)
    || cleanText(application.last_follow_up_at)
    || cleanText(application.submitted_at)
    || nowIsoString();

  if (application.follow_up_count <= 0) {
    return addBusinessDays(cleanBaseAt, 3);
  }

  if (application.follow_up_count === 1) {
    return addBusinessDays(cleanBaseAt, 5);
  }

  if (application.follow_up_count === 2) {
    return addBusinessDays(cleanBaseAt, 7);
  }

  return "";
}

export function hydrateFollowUpState(
  application: DraftApplicationRecord,
): DraftApplicationRecord {
  const submitted = isSubmittedApplication(application);

  if (!submitted) {
    return {
      ...application,
      submitted_at: "",
      next_follow_up_at: "",
      last_follow_up_at: cleanText(application.last_follow_up_at),
      follow_up_count: Math.max(0, Math.floor(Number(application.follow_up_count || 0))),
      follow_up_status: "none",
      follow_up_history_json: Array.isArray(application.follow_up_history_json)
        ? application.follow_up_history_json
        : [],
      last_contact_type: application.last_contact_type === "follow_up" ? "follow_up" : "application",
    };
  }

  const followUpCount = Math.max(0, Math.floor(Number(application.follow_up_count || 0)));
  const isCompleted = application.follow_up_status === "completed" && !cleanText(application.next_follow_up_at);
  const nextFollowUpAt = isCompleted
    ? ""
    : cleanText(application.next_follow_up_at)
      || getNextFollowUpAt({ ...application, follow_up_count: followUpCount });
  const lastContactType: DraftApplicationRecord["last_contact_type"] =
    application.last_contact_type === "follow_up" ? "follow_up" : "application";
  const hydrated = {
    ...application,
    submitted_at: toIsoString(application.submitted_at),
    last_follow_up_at: cleanText(application.last_follow_up_at) ? toIsoString(application.last_follow_up_at) : "",
    next_follow_up_at: nextFollowUpAt ? toIsoString(nextFollowUpAt) : "",
    follow_up_count: followUpCount,
    follow_up_history_json: Array.isArray(application.follow_up_history_json)
      ? application.follow_up_history_json
      : [],
    last_contact_type: lastContactType,
  };

  return {
    ...hydrated,
    follow_up_status: isCompleted ? "completed" : resolveFollowUpStatus(hydrated),
  };
}

export function initializeFollowUpStateForSubmission(
  application: DraftApplicationRecord,
  submittedAt = nowIsoString(),
): DraftApplicationRecord {
  if (application.approval_state === "skipped") {
    throw new Error("cannot_schedule_follow_up_for_skipped_application");
  }

  const normalizedSubmittedAt = toIsoString(submittedAt);
  const initialized = {
    ...application,
    submitted_at: normalizedSubmittedAt,
    next_follow_up_at: addBusinessDays(normalizedSubmittedAt, 3),
    last_follow_up_at: "",
    follow_up_count: 0,
    follow_up_status: "scheduled" as ApplicationFollowUpStatus,
    follow_up_history_json: Array.isArray(application.follow_up_history_json)
      ? application.follow_up_history_json
      : [],
    last_contact_type: "application" as const,
    updated_at: nowIsoString(),
  };

  return hydrateFollowUpState(initialized);
}

function assertFollowUpGenerationAllowed(application: DraftApplicationRecord) {
  if (application.approval_state === "skipped") {
    throw new Error("follow_up_not_available_for_skipped_application");
  }

  if (!isSubmittedApplication(application)) {
    throw new Error("follow_up_not_available_for_unsubmitted_application");
  }

  if (application.follow_up_count >= FOLLOW_UP_MAX_COUNT) {
    throw new Error("follow_up_limit_reached");
  }
}

export function generateFollowUpDraft(application: DraftApplicationRecord) {
  assertFollowUpGenerationAllowed(application);

  const followUpNumber = application.follow_up_count + 1;
  const role = cleanText(application.title);
  const company = cleanText(application.company);
  const submittedAt = cleanText(application.submitted_at)
    ? new Date(application.submitted_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    })
    : "recently";
  const angles = countableAngles(application);
  const reasoning = summarizeScoreReasoning(application);
  const angleSentence = angles.length
    ? `The role still feels like a strong fit because of my experience with ${angles.join(" and ")}.`
    : "";
  const reasoningSentence = reasoning
    ? `One reason I remain especially interested is ${reasoning.charAt(0).toLowerCase()}${reasoning.slice(1)}`
    : "";

  const subjects = [
    "",
    `Following up on my ${role} application`,
    `Checking in on my ${role} application`,
    `Final follow-up on my ${role} application`,
  ];

  const openerByNumber = [
    "",
    `I wanted to follow up on my application for the ${role} role at ${company}, which I submitted on ${submittedAt}.`,
    `I wanted to check in again on my application for the ${role} role at ${company}.`,
    `I wanted to send one final follow-up on my application for the ${role} role at ${company}.`,
  ];

  const body = [
    `Hi ${company} team,`,
    "",
    openerByNumber[followUpNumber],
    angleSentence,
    reasoningSentence,
    "If helpful, I would be glad to share any additional context about my experience or interest in the role.",
    "",
    "Best,",
    "[Your Name]",
  ].filter(Boolean).join("\n");

  return {
    follow_up_number: followUpNumber,
    subject: subjects[followUpNumber],
    body,
    next_follow_up_at: cleanText(application.next_follow_up_at),
    follow_up_status: resolveFollowUpStatus(application),
  };
}

export function markFollowUpSentState(
  application: DraftApplicationRecord,
  note = "",
  sentAt = nowIsoString(),
): DraftApplicationRecord {
  assertFollowUpGenerationAllowed(application);

  const timestamp = toIsoString(sentAt);
  const nextCount = application.follow_up_count + 1;
  const nextFollowUpAt = nextCount >= FOLLOW_UP_MAX_COUNT
    ? ""
    : getNextFollowUpAt({ ...application, follow_up_count: nextCount }, timestamp);
  const nextState = {
    ...application,
    follow_up_count: nextCount,
    last_follow_up_at: timestamp,
    next_follow_up_at: nextFollowUpAt,
    last_contact_type: "follow_up" as const,
    follow_up_status: nextCount >= FOLLOW_UP_MAX_COUNT ? "completed" as const : "scheduled" as const,
    follow_up_history_json: appendHistory(application, "sent", note, nextFollowUpAt, timestamp),
    updated_at: timestamp,
  };

  return hydrateFollowUpState(nextState);
}

export function snoozeFollowUpState(
  application: DraftApplicationRecord,
  businessDays: number,
  note = "",
  now = nowIsoString(),
): DraftApplicationRecord {
  assertFollowUpGenerationAllowed(application);

  const timestamp = toIsoString(now);
  const nextFollowUpAt = addBusinessDays(
    cleanText(application.next_follow_up_at) || timestamp,
    Math.max(1, Math.floor(businessDays || 0)),
  );
  const nextState = {
    ...application,
    next_follow_up_at: nextFollowUpAt,
    follow_up_status: "scheduled" as const,
    follow_up_history_json: appendHistory(application, "snoozed", note, nextFollowUpAt, timestamp),
    updated_at: timestamp,
  };

  return hydrateFollowUpState(nextState);
}

export function skipFollowUpState(
  application: DraftApplicationRecord,
  note = "",
  now = nowIsoString(),
): DraftApplicationRecord {
  if (!isSubmittedApplication(application)) {
    throw new Error("follow_up_not_available_for_unsubmitted_application");
  }

  const timestamp = toIsoString(now);
  return hydrateFollowUpState({
    ...application,
    next_follow_up_at: "",
    follow_up_status: "completed",
    follow_up_history_json: appendHistory(application, "skipped", note, "", timestamp),
    updated_at: timestamp,
  });
}
