export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      route: "/api/checkout",
      implementation: "stub",
      message: "Checkout – not implemented yet (dev stub)."
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
