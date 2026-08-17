export const SPEECH_RMS_THRESHOLD = 0.02;
export const MIN_SPEECH_ACTIVE_MS = 300;

export function sampleRms(samples) {
  if (!samples?.length) return 0;
  let energy = 0;
  for (const sample of samples) energy += sample * sample;
  return Math.sqrt(energy / samples.length);
}

export function hasSpeechEnergy(samples, threshold = SPEECH_RMS_THRESHOLD) {
  return sampleRms(samples) >= threshold;
}
