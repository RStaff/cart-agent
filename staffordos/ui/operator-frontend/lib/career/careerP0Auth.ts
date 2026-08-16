import { cookies } from "next/headers";
import { createCareerP0Store, CAREEROS_P0_COOKIE } from "./careerP0Store.mjs";

export { CAREEROS_P0_COOKIE } from "./careerP0Store.mjs";

export const careerP0Store = createCareerP0Store();

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
