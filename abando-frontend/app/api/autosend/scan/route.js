export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      route: "/api/autosend/scan",
      implementation: "stub",
      message: "Autosend scan – not implemented yet (dev stub)."
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
