import { cookies } from "next/headers";
import { allowDevelopmentRequest } from "./careerP0RateLimit.mjs";
import { assertCareerP0Environment, validateCareerP0Environment } from "./careerP0Environment.mjs";

export const CAREEROS_P0_COOKIE = "careeros_p0_session";

let localStorePromise: Promise<Record<string, (...args: any[]) => Promise<any>>> | null = null;
let productionStorePromise: Promise<Record<string, (...args: any[]) => Promise<any>>> | null = null;

async function resolvedStore() {
  const production = process.env.CAREEROS_PERSISTENCE === "postgres" || process.env.NODE_ENV === "production";
  if (!production) {
    localStorePromise ||= import("./careerP0Store.mjs").then(({ createCareerP0Store }) => createCareerP0Store());
    return localStorePromise;
  }
  assertCareerP0Environment();
  productionStorePromise ||= import("./careerP0Postgres.mjs").then(({ createCareerP0PostgresStore }) => createCareerP0PostgresStore());
  return productionStorePromise;
}

export async function careerP0Pool() {
  const store = await resolvedStore();
  if (!store._pool) throw new Error("CAREEROS_POSTGRES_POOL_REQUIRED");
  return store._pool;
}

export const careerP0Store = new Proxy({} as Record<string, (...args: any[]) => Promise<any>>, {
  get(_target, property: string) {
    return (...args: any[]) => resolvedStore().then((store) => {
      const method = store[property];
      if (typeof method !== "function") throw new Error(`CAREEROS_STORE_METHOD_MISSING:${property}`);
      return method(...args);
    });
  },
});

export async function currentCareerContext() {
  const jar = await cookies();
  return careerP0Store.resolveSession(jar.get(CAREEROS_P0_COOKIE)?.value || "");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function customerMutationAllowed(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;
  const origin = request.headers.get("origin");
  const expected = process.env.CAREEROS_APP_ORIGIN;
  return Boolean(expected && origin === expected);
}

export function productionEnvStatus() {
  const status = validateCareerP0Environment();
  return { ...status, databaseConfigured: Boolean(process.env.DATABASE_URL), appOriginConfigured: Boolean(process.env.CAREEROS_APP_ORIGIN), rateLimitConfigured: status.production };
}

export async function allowCustomerAuthRequest(key: string, options: { limit?: number; windowMs?: number } = {}) {
  const production = process.env.CAREEROS_PERSISTENCE === "postgres" || process.env.NODE_ENV === "production";
  if (!production) return allowDevelopmentRequest(key, options);
  const result = await careerP0Store.consumeRateLimit(key, options);
  return result.allowed;
}
