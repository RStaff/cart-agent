import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { transcribeAudio, VOICE_TRANSCRIPTION_MODEL } from "../../careeros-beta/lib/career/transcriptionProvider.mjs";

const route = readFileSync(new URL("../../careeros-beta/app/api/career/story/transcribe/route.ts", import.meta.url), "utf8");

test("voice provider fails closed without a server credential", async () => {
  await assert.rejects(() => transcribeAudio({ bytes: new Uint8Array([1]), mimeType: "audio/webm", filename: "voice.webm", apiKey: "" }), (error) => error.code === "VOICE_PROVIDER_CREDENTIAL_REQUIRED");
});

test("voice provider returns transcript metadata without persisting input", async () => {
  let request;
  const result = await transcribeAudio({
    bytes: new Uint8Array([1, 2]), mimeType: "audio/webm", filename: "voice.webm", apiKey: "test-key",
    fetchImpl: async (url, options) => { request = { url, options }; return { ok: true, async json() { return { text: "A reviewed story draft." }; } }; },
  });
  assert.deepEqual(result, { transcript: "A reviewed story draft.", provider: "openai", model: VOICE_TRANSCRIPTION_MODEL });
  assert.equal(request.url, "https://api.openai.com/v1/audio/transcriptions");
  assert.equal(request.options.headers.Authorization, "Bearer test-key");
  assert.equal(request.options.method, "POST");
});

test("transcription route is an authenticated, non-persisting boundary", () => {
  assert.match(route, /customerMutationAllowed/);
  assert.match(route, /currentCareerContext/);
  assert.match(route, /MAX_AUDIO_BYTES/);
  assert.doesNotMatch(route, /createSource|saveCandidates|CareerFact|CareerSource/);
  assert.doesNotMatch(route, /console\.(log|error)|DATABASE_URL|OPENAI_API_KEY/);
});
