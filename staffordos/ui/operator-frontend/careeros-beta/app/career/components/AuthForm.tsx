"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CareerBrandLogo } from "./CareerBrandLogo";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch(`/api/career/auth/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, displayName, inviteToken }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Unable to continue"); setBusy(false); return; }
    router.push("/career"); router.refresh();
  }
  return <main className="careerPublicShell"><section className="careerAuthPanel">{mode === "login" ? <CareerBrandLogo placement="auth" priority /> : null}<p className="careerEyebrow">CareerOS account</p><h1>{mode === "signup" ? "Create your career profile" : "Welcome back"}</h1><p className="careerMuted">Your career information stays private to your account.</p><form onSubmit={submit} className="careerForm">{mode === "signup" ? <><label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" /></label><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label>Password<input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /></label><label>Invite code<input required value={inviteToken} onChange={(event) => setInviteToken(event.target.value)} autoComplete="one-time-code" /></label></> : <><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label>Password<input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label></>}{error ? <p className="careerError" role="alert">{error}</p> : null}<button className="careerPrimaryButton" disabled={busy}>{busy ? "Working..." : mode === "signup" ? "Create account" : "Log in"}</button></form><p className="careerMuted">{mode === "signup" ? <>Already have an account? <Link href="/career/login">Log in</Link></> : <>New to CareerOS? <Link href="/career/signup">Create an account</Link></>}</p></section></main>;
}
