import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  authorizeStaffordOsOperatorRead,
  careerOsBetaOperationsProtectedProof,
  operatorAuthConfigFromEnv,
  operatorAuthorizationFailureBody,
} from "../../../../../../lib/operator/staffordosOperatorSession";

export const runtime = "nodejs";

export async function GET() {
  const config = operatorAuthConfigFromEnv(process.env);
  const jar = await cookies();
  const cookieValue = jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "";
  const authorization = authorizeStaffordOsOperatorRead(cookieValue, CAREEROS_BETA_OPERATIONS_READ_PERMISSION, config);

  if (!authorization.ok) {
    return NextResponse.json(operatorAuthorizationFailureBody(authorization), { status: authorization.status });
  }

  return NextResponse.json(careerOsBetaOperationsProtectedProof(authorization.session));
}
