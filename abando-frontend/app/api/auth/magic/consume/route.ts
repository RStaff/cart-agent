import { NextRequest } from "next/server";
import { redirectToBackend } from "../../../_proxy-utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return redirectToBackend(req, "/api/auth/magic/consume");
}
