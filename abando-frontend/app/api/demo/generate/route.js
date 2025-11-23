export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      route: "/api/demo/generate",
      implementation: "stub",
      message: "Demo generate – not implemented yet (dev stub)."
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
