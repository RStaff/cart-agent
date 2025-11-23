export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      route: "/api/auth/me",
      implementation: "stub",
      message: "Auth me – not implemented yet (dev stub)."
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
