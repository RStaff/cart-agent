"use client";

import { useEffect, useRef, useState } from "react";
import { hasSpeechEnergy, MIN_SPEECH_ACTIVE_MS } from "../../../lib/career/voiceActivity.mjs";

export const MAX_RECORDING_DURATION_SECONDS = 5 * 60;
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

type Props = { onRecordingReady: (blob: Blob, mimeType: string) => void; onError?: (message: string) => void; onNoSpeech?: () => void };

function supportedMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || null;
}

export function VoiceRecorder({ onRecordingReady, onError, onNoSpeech }: Props) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const elapsedRef = useRef(0);
  const speechActiveMsRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    if (audioContextRef.current) void audioContextRef.current.close();
    audioContextRef.current = null;
    recorderRef.current = null;
  }

  function stop() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    setRecording(false);
    if (elapsedRef.current >= MAX_RECORDING_DURATION_SECONDS) setError("Recording stopped at the five-minute beta limit.");
  }

  async function start() {
    setError("");
    const mimeType = supportedMimeType();
    if (!mimeType || !navigator.mediaDevices?.getUserMedia) {
      const message = "Microphone recording is not supported here. You can still type your experience.";
      setError(message); onError?.(message); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: mimeType }); const speechDetected = speechActiveMsRef.current >= MIN_SPEECH_ACTIVE_MS; cleanup(); if (!speechDetected) { onNoSpeech?.(); return; } if (blob.size) onRecordingReady(blob, mimeType); };
      recorder.onerror = () => { const message = "Recording failed. You can still type your experience."; setError(message); onError?.(message); cleanup(); setRecording(false); };
      recorder.start();
      speechActiveMsRef.current = 0;
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextCtor) { const audioContext = new AudioContextCtor(); const analyser = audioContext.createAnalyser(); analyser.fftSize = 2048; audioContext.createMediaStreamSource(stream).connect(analyser); audioContextRef.current = audioContext; analyserRef.current = analyser; }
      setElapsed(0); setRecording(true);
      timerRef.current = setInterval(() => { const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000); elapsedRef.current = seconds; if (analyserRef.current) { const samples = new Float32Array(analyserRef.current.fftSize); analyserRef.current.getFloatTimeDomainData(samples); if (hasSpeechEnergy(samples)) speechActiveMsRef.current += 100; } setElapsed(seconds); if (seconds >= MAX_RECORDING_DURATION_SECONDS) stop(); }, 100);
    } catch {
      cleanup(); setRecording(false);
      const message = "Microphone access is not available. You can still type your experience.";
      setError(message); onError?.(message);
    }
  }

  useEffect(() => () => cleanup(), []);
  const time = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  return <div aria-live="polite"><p className="careerMuted">Microphone use is optional. Speak naturally about an experience; you can edit the transcript before CareerOS uses it.</p>{recording ? <div className="careerVoiceStatus"><span>● Listening</span><span>{time}</span><button type="button" className="careerSmallButton" onClick={stop}>Stop</button></div> : <button type="button" className="careerPrimaryButton" onClick={start}>Start talking</button>}{error ? <p className="careerError" role="alert">{error}</p> : null}</div>;
}
