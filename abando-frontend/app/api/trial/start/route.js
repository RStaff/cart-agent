export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      route: "/api/trial/start",
      implementation: "stub",
      message: "Trial start – not implemented yet (dev stub)."
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
