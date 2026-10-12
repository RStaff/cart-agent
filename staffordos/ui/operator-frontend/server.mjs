import http from "node:http";
import next from "next";
import { runWithLocalTransportProof } from "./lib/operator/localTransportProof.mjs";

const hostname = process.env.STAFFORDOS_LOCAL_OPERATOR_BIND_HOST || "127.0.0.1";
if (hostname !== "127.0.0.1" || process.env.NODE_ENV !== "development") {
  throw new Error("STAFFORDOS_LOCAL_OPERATOR_SERVER_REQUIRES_LOOPBACK_DEVELOPMENT");
}

const port = Number(process.env.PORT || 3210);
const app = next({ dev: true, hostname, port, turbopack: true });
await app.prepare();
const handle = app.getRequestHandler();
const forbiddenForwardingHeaders = ["forwarded", "x-forwarded-for", "x-forwarded-host", "x-forwarded-port", "x-forwarded-proto", "x-real-ip", "true-client-ip", "cf-connecting-ip"];

const server = http.createServer((request, response) => {
  const peer = request.socket.remoteAddress || "";
  if (peer !== "127.0.0.1" && peer !== "::1" && peer !== "::ffff:127.0.0.1") {
    response.writeHead(403, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: false, error: "LOCAL_TRANSPORT_PEER_REQUIRED" }));
    return;
  }
  if (forbiddenForwardingHeaders.some((header) => request.headers[header])) {
    response.writeHead(400, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: false, error: "INCOMING_FORWARDING_HEADERS_REJECTED" }));
    return;
  }
  void runWithLocalTransportProof(() => handle(request, response));
});

server.listen(port, hostname, () => console.log(`StaffordOS operator local server listening on http://${hostname}:${port}`));
