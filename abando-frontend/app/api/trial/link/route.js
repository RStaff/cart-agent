export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      route: "/api/trial/link",
      implementation: "stub",
      message: "Trial link – not implemented yet (dev stub)."
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
