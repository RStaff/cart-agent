import http from "node:http";
import next from "next";
import { runWithLocalTransportProof } from "./lib/operator/localTransportProof.mjs";
import { validateLocalTransportRequest } from "./lib/operator/localTransportBoundary.mjs";

const hostname = process.env.STAFFORDOS_LOCAL_OPERATOR_BIND_HOST || "127.0.0.1";
if (hostname !== "127.0.0.1" || process.env.NODE_ENV !== "development") {
  throw new Error("STAFFORDOS_LOCAL_OPERATOR_SERVER_REQUIRES_LOOPBACK_DEVELOPMENT");
}

const port = Number(process.env.PORT || 3210);
const app = next({ dev: true, hostname, port, turbopack: true });
await app.prepare();
const handle = app.getRequestHandler();
const server = http.createServer((request, response) => {
  const boundaryError = validateLocalTransportRequest(request, { hostname, port });
  if (boundaryError) {
    response.writeHead(boundaryError === "LOCAL_TRANSPORT_PEER_REQUIRED" ? 403 : 400, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: false, error: boundaryError }));
    return;
  }
  void runWithLocalTransportProof(() => handle(request, response));
});

server.listen(port, hostname, () => console.log(`StaffordOS operator local server listening on http://${hostname}:${port}`));
