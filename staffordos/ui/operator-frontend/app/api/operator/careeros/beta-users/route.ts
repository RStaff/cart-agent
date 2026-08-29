import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCareerOsBetaOperationsResult } from "../../../../../lib/operator/careerosBetaOperationsAccess";
import { STAFFORDOS_OPERATOR_SESSION_COOKIE } from "../../../../../lib/operator/staffordosOperatorSession";

export const runtime = "nodejs";

export async function GET() {
  const jar = await cookies();
  const cookieValue = jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "";
  const result = await getCareerOsBetaOperationsResult(cookieValue);

  return NextResponse.json(result.body, { status: result.status });
}
