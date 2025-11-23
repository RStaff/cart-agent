export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      route: "/api/autosend/dry-run",
      implementation: "stub",
      message: "Autosend dry-run – not implemented yet (dev stub)."
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
