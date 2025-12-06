"use client";

import * as React from "react";
import Link from "next/link";
import { voiceName, type Channel, type VoiceId } from "@/lib/voices";

/** ---- Types & helpers ---- */

type Initial = {
  product: string;
  offer: string;
  channel: Channel;                  // "email" | "sms" | "chat"
  length: "short" | "medium" | "long";
  persona: string;
  concerns: string;
  voiceId: VoiceId;                  // e.g., "brand", "confident", ...
  customVoice: string;               // free text when UI "custom" selected
  imageUrl: string;                  // product image preview
};

type GenPayload = {
  product: string;
  offer: string;
  channel: Channel;
  length: "short" | "medium" | "long";
  persona: string;
  concerns: string;
  voiceId: string;       // API accepts string ids (we keep VoiceId in UI)
  customVoice: string;
};

const LS = {
  last: "abando:last",       // { message, meta }
  variants: "abando:variants"// Array<{id,text}>
} as const;

const inp: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  background: "#0f1524",
  color: "#e6eaf2",
  border: "1px solid rgba(255,255,255,.12)",
};

/** The API always returns 200 with {message, source}, falling back to mock if no OpenAI key */
async function callGenerate(payload: GenPayload) {
  const r = await fetch("/api/demo/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let j: any = {};
  try { j = await r.json(); } catch {}
  return {
    message: String(j?.message ?? ""),
    source: String(j?.source ?? (r.ok ? "openai" : "mock")),
    status: r.status,
  };
}

function persistLast(message: string, meta: Record<string, unknown>) {
  try {
    localStorage.setItem(LS.last, JSON.stringify({ message, meta, ts: Date.now() }));
  } catch {}
}

/** ---- Component ---- */
export default function DemoClient({ initial }: { initial: Initial }) {
  // core inputs
  const [product, setProduct]   = React.useState(initial.product);
  const [offer, setOffer]       = React.useState(initial.offer);
  const [channel, setChannel]   = React.useState<Channel>(initial.channel);
  const [length, setLength]     = React.useState<"short"|"medium"|"long">(initial.length);
  const [persona, setPersona]   = React.useState(initial.persona);
  const [concerns, setConcerns] = React.useState(initial.concerns);
  const [imageUrl, setImageUrl] = React.useState(initial.imageUrl || "");

  // voice selection — UI has a "custom" sentinel; map to a real voiceId on submit
  const [voiceSel, setVoiceSel]     = React.useState<string>(initial.customVoice ? "custom" : initial.voiceId);
  const [customVoice, setCustom]    = React.useState(initial.customVoice || "");

  // results
  const [result, setResult]       = React.useState<string>("");
  const [source, setSource]       = React.useState<string>("");
  const [variants, setVariants]   = React.useState<Array<{id:string; text:string}>>([]);
  const [busy, setBusy]           = React.useState(false);
  const [err, setErr]             = React.useState<string | null>(null);

  const chips: Array<{ id: VoiceId; label: string }> = [
    { id: "brand",       label: "Brand" },
    { id: "confident",   label: "Confident" },
    { id: "playful",     label: "Playful" },
    { id: "storyteller", label: "Storyteller" },
    { id: "technical",   label: "Technical" },
    { id: "minimalist",  label: "Minimalist" },
    { id: "luxury",      label: "Luxury" },
    { id: "urgency",     label: "Urgency" },
  ];

  // hydrate last run (optional)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(LS.last);
      if (raw) {
        const j = JSON.parse(raw);
        if (typeof j?.message === "string") setResult(j.message);
      }
      const vraw = localStorage.getItem(LS.variants);
      if (vraw) {
        const arr = JSON.parse(vraw);
        if (Array.isArray(arr)) setVariants(arr);
      }
    } catch {}
  }, []);

  const previewVoiceLabel =
    voiceSel === "custom" ? (customVoice || "Custom") : voiceName(voiceSel as VoiceId);

  async function generateOne(voiceLabel: string) {
    setBusy(true);
    setErr(null);
    try {
      const payload: GenPayload = {
        product, offer, channel, length, persona, concerns,
        // map UI-only "custom" to a valid voiceId + pass text in customVoice
        voiceId: voiceSel === "custom" ? "brand" : (voiceSel as string),
        customVoice: voiceSel === "custom" ? customVoice : "",
      };
      const { message, source } = await callGenerate(payload);
      if (!message) throw new Error("No copy returned");
      setResult(message);
      setSource(source);
      persistLast(message, {
        product, offer, channel, length, persona, concerns,
        voiceLabel,
        imageUrl,
        source,
      });
      // single run clears previous batch
      localStorage.removeItem(LS.variants);
      setVariants([]);
    } catch (e: any) {
      setErr(e?.message || "Failed to generate copy.");
    } finally {
      setBusy(false);
    }
  }

  async function tryAllVoices() {
    setBusy(true);
    setErr(null);
    try {
      const order: VoiceId[] = ["brand","confident","playful","storyteller","technical","minimalist","luxury","urgency"];
      const base = { product, offer, channel, length, persona, concerns };
      const out: Array<{id:string; text:string}> = [];
      for (const id of order) {
        const { message, source } = await callGenerate({ ...base, voiceId: id, customVoice: "" });
        if (message) {
          out.push({ id, text: message });
          setVariants([...out]); // live update
          setSource(source);
        }
      }
      localStorage.setItem(LS.variants, JSON.stringify(out));
      // keep the last single preview area showing the last message we got
      if (out.length > 0) {
        setResult(out[out.length - 1].text);
        persistLast(out[out.length - 1].text, {
          product, offer, channel, length, persona, concerns, voiceLabel: "Batch", imageUrl, source,
        });
      }
    } catch (e: any) {
      setErr(e?.message || "Failed to run batch voices.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "40px auto", padding: "0 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr .7fr", gap: 16 }}>
        {/* Left column */}
        <section style={{ display: "grid", gap: 12 }}>
          {/* Product / offer */}
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
            <label>Product<input value={product} onChange={e=>setProduct(e.target.value)} style={inp} /></label>
            <label>Offer<input value={offer} onChange={e=>setOffer(e.target.value)} placeholder="e.g. 10% off" style={inp} /></label>
          </div>

          {/* Channel / length */}
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
            <label>Channel<select value={channel} onChange={e=>setChannel(e.target.value as Channel)} style={inp as any}>
              <option>email</option><option>sms</option><option>chat</option>
            </select></label>
            <label>Length<select value={length} onChange={e=>setLength(e.target.value as any)} style={inp as any}>
              <option>short</option><option>medium</option><option>long</option>
            </select></label>
          </div>

          {/* Persona / concerns */}
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
            <label>Persona<input value={persona} onChange={e=>setPersona(e.target.value)} placeholder="e.g. first-time buyer" style={inp} /></label>
            <label>Concerns<input value={concerns} onChange={e=>setConcerns(e.target.value)} placeholder="e.g. sizing, returns" style={inp} /></label>
          </div>

          {/* Image URL */}
          <div style={{ display: "grid", gap: 8 }}>
            <label>Product image URL
              <input
                value={imageUrl}
                onChange={e=>setImageUrl(e.target.value)}
                placeholder="https://…"
                style={inp}
              />
            </label>
          </div>

          {/* Voice select */}
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
            <label>Voice<select value={voiceSel} onChange={e=>setVoiceSel(e.target.value)} style={inp as any}>
              {chips.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              <option value="custom">Custom</option>
            </select></label>
            <label>Custom voice
              <input
                value={customVoice}
                onChange={e=>setCustom(e.target.value)}
                placeholder="e.g. bold, witty, premium"
                style={inp}
                disabled={voiceSel !== "custom"}
              />
            </label>
          </div>

          {/* Voice chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {chips.map(c => (
              <button
                key={c.id}
                onClick={() => setVoiceSel(c.id)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,.12)",
                  background: voiceSel === c.id ? "#263258" : "transparent",
                  color: "#cbd5e1",
                  cursor: "pointer",
                }}
              >
                {c.label}
              </button>
            ))}
            <button
              onClick={() => setVoiceSel("custom")}
              style={{
                padding: "8px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.12)",
                background: voiceSel === "custom" ? "#263258" : "transparent",
                color: "#cbd5e1",
                cursor: "pointer",
              }}
            >
              Custom
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
            <button
              onClick={() => generateOne(previewVoiceLabel)}
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                fontWeight: 700,
                border: "none",
                background: busy ? "#5149ff" : "#635bff",
                color: "#D4AF37f",
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Generating…" : "Generate copy"}
            </button>

            <button
              onClick={tryAllVoices}
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,.12)",
                background: "transparent",
                color: "#cbd5e1",
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Working…" : "Try all voices"}
            </button>

            <Link href="/dashboard" style={{ color: "#9fb0c6", textDecoration: "underline" }}>
              View in dashboard →
            </Link>
          </div>

          {err && <div role="alert" style={{ color: "#fca5a5" }}>{err}</div>}

          {/* Single preview */}
          {result && (
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: 12 }}>
              <strong>Preview ({previewVoiceLabel}):</strong>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{result}</pre>
            </div>
          )}

          {/* Variants from “try all voices” */}
          {variants.length > 0 && (
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: 12 }}>
              <strong>Voice variants</strong>
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                {variants.map(v => (
                  <details
                    key={v.id}
                    style={{ background: "#0b1220", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,.06)" }}
                  >
                    <summary style={{ cursor: "pointer", fontWeight: 700 }}>{voiceName(v.id as VoiceId)}</summary>
                    <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{v.text}</div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right column: live image preview */}
        <aside style={{ position: "sticky", top: 24, alignSelf: "start" }}>
          <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: 12 }}>
            <strong>Product preview</strong>
            <div style={{ marginTop: 8 }}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" style={{ maxWidth: "100%", borderRadius: 10, display: "block" }} />
              ) : (
                <div
                  style={{
                    height: 220,
                    display: "grid",
                    placeItems: "center",
                    color: "#94a3b8",
                    border: "1px dashed rgba(255,255,255,.12)",
                    borderRadius: 10,
                  }}
                >
                  Paste an image URL to preview
                </div>
              )}
            </div>
          </div>
        </aside>
      </div></main>
  );
}
