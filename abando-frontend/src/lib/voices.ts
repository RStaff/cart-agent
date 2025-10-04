/**
 * Central voice registry (typed) with safe exports used by:
 *  - /app/demo/playground/Client.tsx
 *  - /app/api/demo/generate/route.ts
 *
 * Whole-file authoritative source to avoid drift.
 */
export type Channel = "email" | "sms" | "chat";

export type VoiceId =
  | "brand"
  | "confident"
  | "playful"
  | "storyteller"
  | "technical"
  | "minimalist"
  | "luxury"
  | "urgency";

export type VoiceDef = {
  id: VoiceId;
  name: string;
  short: string;   // short descriptor shown in UI
  prompt: string;  // system style injected to the model
};

/** Canonical voice map used across app & API */
export const VOICES: Map<VoiceId, VoiceDef> = new Map<VoiceId, VoiceDef>([
  ["brand", {
    id: "brand",
    name: "Brand (balanced)",
    short: "Friendly, clear benefits, gentle urgency.",
    prompt: "Friendly, helpful, brand-safe tone. Clear benefits, upfront answers, gentle urgency. Keep it concise and skimmable."
  }],
  ["confident", {
    id: "confident",
    name: "Confident",
    short: "Empowering tone, decisive call-to-action.",
    prompt: "Confident and empowering. Lead with value, then proof. Decisive CTA. Keep friction low."
  }],
  ["playful", {
    id: "playful",
    name: "Playful",
    short: "Light humor, upbeat, approachable.",
    prompt: "Light, upbeat, approachable. Tasteful humor. Keep clarity first, charm second."
  }],
  ["storyteller", {
    id: "storyteller",
    name: "Storyteller",
    short: "Warm narrative with before→after arc.",
    prompt: "Warm narrative with a brief before→after arc. Tie benefits to real usage. End with a crisp next step."
  }],
  ["technical", {
    id: "technical",
    name: "Technical",
    short: "Specs-first, precise, reduces uncertainty.",
    prompt: "Precise, specs-first, reduces uncertainty. Answer objections directly. No fluff."
  }],
  ["minimalist", {
    id: "minimalist",
    name: "Minimalist",
    short: "Short, clean, no fluff.",
    prompt: "Ultra concise. One clear benefit, one reassurance, one CTA. No fluff."
  }],
  ["luxury", {
    id: "luxury",
    name: "Luxury",
    short: "Premium cues, restrained confidence.",
    prompt: "Premium cues with restrained confidence. Focus on craft, materials, and experience. Subtle urgency."
  }],
  ["urgency", {
    id: "urgency",
    name: "Urgency",
    short: "Time-bound nudge, clear next step.",
    prompt: "Clear, time-bound nudge. Explain what they gain by acting now. Stay respectful; avoid pressure."
  }],
]);

/** Default voice if not specified */
export const DEFAULT_VOICE: VoiceId = "brand";

/** List of all voice ids (stable order for batch runs) */
export function tryAllVoiceIds(): VoiceId[] {
  return Array.from(VOICES.keys());
}

/**
 * Resolve writing style text injected into the model.
 * If custom text is provided, it overrides the preset.
 */
export function voiceStyle(id: string | VoiceId, custom?: string): string {
  const trimmed = (custom || "").trim();
  if (trimmed) return trimmed;
  return VOICES.get(id as VoiceId)?.prompt || VOICES.get(DEFAULT_VOICE)!.prompt;
}

/** Human name for a voice id */
export function voiceName(id: string | VoiceId): string { return VOICES.get(id as VoiceId)?.name || (id as string); }

// Back-compat alias used by /api/demo/generate
export function describeVoice(id: string | VoiceId, custom?: string): string {
  return voiceStyle(id, custom);
}


/** Runtime guard for strings coming from URL/localStorage */
export function isVoiceId(x: string): x is VoiceId {
  return VOICES.has(x as VoiceId);
}
