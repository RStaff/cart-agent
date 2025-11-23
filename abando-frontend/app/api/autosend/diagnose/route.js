export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      route: "/api/autosend/diagnose",
      implementation: "stub",
      message: "Autosend diagnose – not implemented yet (dev stub)."
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
