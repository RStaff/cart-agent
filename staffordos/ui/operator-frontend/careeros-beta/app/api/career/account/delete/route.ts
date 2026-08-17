import { NextResponse } from "next/server";
import { careerP0Store, currentCareerContext, customerMutationAllowed } from "../../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  await careerP0Store.deleteAccount(context.session.id);
  return NextResponse.json({ ok: true });
}
