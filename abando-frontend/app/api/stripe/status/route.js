export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      route: "/api/stripe/status",
      implementation: "stub",
      message: "Stripe status – not implemented yet (dev stub)."
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
