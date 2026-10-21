export const STORY_DRAFT_STORAGE_PREFIX = "careeros.story-draft.v1:";

export function draftStorageKey(profileId) {
  return `${STORY_DRAFT_STORAGE_PREFIX}${profileId}`;
}

export function serializeStoryDraft(draft) {
  return JSON.stringify({
    experienceContext: String(draft.experienceContext || ""),
    talkAnswers: Array.isArray(draft.talkAnswers) ? draft.talkAnswers : [],
    inputModes: Array.isArray(draft.inputModes) ? draft.inputModes : [],
    questionIndex: Number.isInteger(draft.questionIndex) ? draft.questionIndex : 0,
    interviewReview: Boolean(draft.interviewReview),
    updatedAt: new Date().toISOString(),
  });
}

export function restoreStoryDraft(raw, questionCount) {
  const empty = { experienceContext: "", talkAnswers: Array(questionCount).fill(null), inputModes: Array(questionCount).fill(null), questionIndex: 0, interviewReview: false };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.experienceContext !== "string" || !Array.isArray(parsed.talkAnswers) || !Array.isArray(parsed.inputModes)) return empty;
    return {
      experienceContext: parsed.experienceContext,
      talkAnswers: Array.from({ length: questionCount }, (_, index) => parsed.talkAnswers[index] == null ? null : String(parsed.talkAnswers[index])),
      inputModes: Array.from({ length: questionCount }, (_, index) => parsed.inputModes[index] === "VOICE" || parsed.inputModes[index] === "TEXT" ? parsed.inputModes[index] : null),
      questionIndex: Math.min(Math.max(Number(parsed.questionIndex) || 0, 0), Math.max(questionCount - 1, 0)),
      interviewReview: Boolean(parsed.interviewReview || parsed.talkAnswers.some(Boolean)),
    };
  } catch {
    return empty;
  }
}

export function skipStoryQuestion(answers, questionIndex) {
  if (answers[questionIndex]) return [...answers];
  return answers.map((answer, index) => index === questionIndex ? null : answer);
}

export function assembleStoryDraft({ experienceContext, talkAnswers }) {
  const context = experienceContext?.trim() || "";
  const answers = talkAnswers.map((answer) => answer?.trim() || "").filter(Boolean);
  return [context, ...answers].filter(Boolean).join("\n\n");
}
