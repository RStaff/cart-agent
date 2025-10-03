/**
 * Session + Magic-link utilities that:
 * - Export the symbols your routes expect (createMagicToken, getSessionEmailFromCookie, clearSession, etc.).
 * - Are resilient to Next 15 cookies() behavior (may be Promise-like).
 * - Keep a synchronous getSessionEmailOnServer() for SSR without refactors.
 * - Use in-memory stores (good for local/dev); swap to Redis later without touching callers.
 */

import { cookies as nextCookies, headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/** ===== Types ===== */
export type Session = { id: string; email: string; createdAt: number };
type MagicRecord = { email: string; exp: number };

/** ===== In-memory stores (swap with Redis later) ===== */
export const SESSIONS = new Map<string, Session>();
const MAGIC = new Map<string, MagicRecord>();

/** ===== Constants ===== */
const COOKIE_NAME = "sid";
const MAGIC_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** ===== Utils ===== */
function now() { return Date.now(); }

function randomId(): string {
  try { return crypto.randomUUID(); }
  catch { return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); }
}

function isPromiseLike<T = unknown>(x: any): x is Promise<T> {
  return !!x && typeof x.then === "function";
}

/** ===== Sessions ===== */
export function createSession(email: string): Session {
  const id = randomId();
  const s: Session = { id, email, createdAt: now() };
  SESSIONS.set(id, s);
  return s;
}

export function getSession(id: string | null | undefined): Session | undefined {
  if (!id) return undefined;
  return SESSIONS.get(id);
}

/** Sets the sid cookie on a NextResponse (server route / action). */
export function attachSessionCookie(res: NextResponse, sid: string): void {
  res.cookies.set({
    name: COOKIE_NAME,
    value: sid,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/** Clears the sid cookie on a NextResponse. (Export name used by your routes) */
export function clearSession(res: NextResponse): void {
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}

/**
 * Sync, SSR-friendly email getter (no refactors required).
 * If cookies() is Promise-like in this runtime, we return null.
 */
export function getSessionEmailOnServer(): string | null {
  try {
    const jar: any = (nextCookies as any)();
    if (isPromiseLike(jar)) return null; // cannot read sync in this phase
    const sid = jar?.get?.(COOKIE_NAME)?.value ?? null;
    if (!sid) return null;
    return SESSIONS.get(sid)?.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Read session email using a NextRequest (for route handlers).
 * Exported as getSessionEmailFromCookie because your routes import it.
 */
export function getSessionEmailFromCookie(req?: NextRequest): string | null {
  try {
    // Prefer request cookies when provided (route handlers)
    const sid = req?.cookies?.get?.(COOKIE_NAME)?.value
      ?? ((): string | null => {
          // Fallback to headers() cookie jar (may be Promise-like)
          try {
            const jar: any = (nextCookies as any)();
            if (isPromiseLike(jar)) return null;
            return jar?.get?.(COOKIE_NAME)?.value ?? null;
          } catch { return null; }
        })();

    if (!sid) return null;
    return SESSIONS.get(sid)?.email ?? null;
  } catch {
    return null;
  }
}

/** Helper to create a session for an email and attach cookie to response. */
export function createAndAttachSession(email: string, res: NextResponse): Session {
  const s = createSession(email);
  attachSessionCookie(res, s.id);
  return s;
}

/** ===== Magic Links (for email login) ===== */
export function createMagicToken(email: string): string {
  const token = randomId();
  MAGIC.set(token, { email, exp: now() + MAGIC_TTL_MS });
  return token;
}

/** Verify (but do not consume) a magic token; returns email or null if invalid/expired. */
export function verifyMagicToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const rec = MAGIC.get(token);
  if (!rec) return null;
  if (rec.exp < now()) { MAGIC.delete(token); return null; }
  return rec.email;
}

/** Consume a magic token (one-time). Returns email or null. */
export function consumeMagicToken(token: string | null | undefined): string | null {
  if (typeof token !== "string" || !token) return null;

  // The map may store either a raw string email (legacy) or a record like { email: string }
  type MaybeRecord = string | { email?: string } | undefined;
  const rec = (MAGIC as Map<string, any>).get(token) as MaybeRecord;

  if (!rec) return null;
  (MAGIC as Map<string, any>).delete(token);

  if (typeof rec === "string") return rec;
  if (rec && typeof rec.email === "string" && rec.email) return rec.email;
  return null;
}

/** Optional: derive base URL for magic links (can use NEXT_PUBLIC_APP_URL). */
export function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Convenience: build a magic link URL (e.g., /api/auth/magic/consume?token=...) */
export function buildMagicLink(token: string): string {
  const u = new URL(appBaseUrl());
  u.pathname = "/api/auth/magic/consume";
  u.searchParams.set("token", token);
  return u.toString();
}

// --- Back-compat export for legacy routes ---
// Older code imports `setSessionCookie`; our canonical name is `attachSessionCookie`.
export const setSessionCookie = attachSessionCookie;
