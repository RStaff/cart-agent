const http = require("http");
function req(path, method = "GET", body) {
  return new Promise((res, rej) => {
    const r = http.request(
      {
        host: "localhost",
        port: 3000,
        path,
        method,
        headers: { "content-type": "application/json" },
      },
      (x) => {
        let d = "";
        x.on("data", (c) => (d += c));
        x.on("end", () => res({ status: x.statusCode, body: d }));
      },
    );
    r.on("error", rej);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}
(async () => {
  const s = await req("/api/status");
  if (s.status !== 200) throw new Error("status failed");
  const g = await req("/api/demo/generate", "POST", {
    product: "Wireless ANC headphones",
    tone: "urgent",
  });
  const j = JSON.parse(g.body || "{}");
  if (!j.ok || !j.message) throw new Error("generate failed");
  console.log("✓ API smoke OK:", j.message.slice(0, 60) + "…");
})().catch((e) => {
  console.error("✗ smoke failed:", e.message);
  process.exit(1);
});
