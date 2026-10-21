import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hasSpeechEnergy, sampleRms } from "../../careeros-beta/lib/career/voiceActivity.mjs";

const rootPage = readFileSync(new URL("../../careeros-beta/app/career/profile/page.tsx", import.meta.url), "utf8");
const privacy = readFileSync(new URL("../../careeros-beta/app/career/components/PrivacyDisclosure.tsx", import.meta.url), "utf8");
const capabilities = readFileSync(new URL("../../careeros-beta/app/career/capabilities/page.tsx", import.meta.url), "utf8");
const story = readFileSync(new URL("../../careeros-beta/app/career/components/CareerStoryBuilder.tsx", import.meta.url), "utf8");
const recorder = readFileSync(new URL("../../careeros-beta/app/career/components/VoiceRecorder.tsx", import.meta.url), "utf8");
const provider = readFileSync(new URL("../../careeros-beta/lib/career/transcriptionProvider.mjs", import.meta.url), "utf8");
const route = readFileSync(new URL("../../careeros-beta/app/api/career/story/transcribe/route.ts", import.meta.url), "utf8");

test("profile uses compact privacy treatment while the full notice remains available", () => {
  assert.match(rootPage, /PrivacyDisclosure compact/);
  assert.match(privacy, /Your career information is private to your account/);
  assert.match(privacy, /Data &amp; privacy/);
  assert.match(privacy, /invite-only early beta/);
});

test("capability acknowledgement is question-specific and transient", () => {
  assert.match(capabilities, /saveNotice/);
  assert.match(capabilities, /Answer saved/);
  assert.match(capabilities, /saveNotice\?\.capabilityId === current\.id/);
  assert.match(capabilities, /setSaveNotice\(null\)/);
  assert.doesNotMatch(capabilities, /setMessage|Saved\."/);
  assert.match(capabilities, /aria-pressed/);
});

test("silence guard rejects zero energy and accepts meaningful synthetic activity", () => {
  assert.equal(sampleRms(new Float32Array(128)), 0);
  assert.equal(hasSpeechEnergy(new Float32Array(128)), false);
  assert.equal(hasSpeechEnergy(Float32Array.from({ length: 128 }, () => 0.08)), true);
});

test("no-speech stops before transcription and preserves text fallback", () => {
  assert.match(recorder, /onNoSpeech/);
  assert.match(recorder, /MIN_SPEECH_ACTIVE_MS/);
  assert.match(recorder, /if \(!speechDetected\)/);
  assert.match(story, /We didn't hear enough speech/);
  assert.match(story, /Try again or type your answer/);
});

test("unusable provider output is rejected without keyword or language filters", () => {
  assert.match(provider, /VOICE_TRANSCRIPTION_UNUSABLE/);
  assert.match(provider, /\\p\{L\}/);
  assert.doesNotMatch(provider, /Sheffield|No, thank you|Why are you here/);
  assert.match(route, /VOICE_TRANSCRIPTION_UNUSABLE/);
});

test("voice authority still terminates at the existing intake path", () => {
  assert.match(story, /\/api\/career\/intake\/source/);
  assert.doesNotMatch(recorder, /CareerSource|CareerFact|capabilit|matching/i);
  assert.doesNotMatch(route, /createSource|saveCandidates|CareerFact|CareerSource/);
});
