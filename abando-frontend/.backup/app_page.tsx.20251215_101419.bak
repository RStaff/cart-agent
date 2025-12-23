import { redirect } from "next/navigation";

/**
 * Root route ("/")
 * We keep the production entry point pointed at the static demo playground
 * so that:
 *   - https://abando-frontend-....vercel.app
 *   - https://app.abando.ai
 * both land on /demo/playground.
 */
export default function RootRedirect() {
  redirect("/demo/playground");
}
