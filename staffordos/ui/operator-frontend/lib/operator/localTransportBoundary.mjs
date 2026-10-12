const FORWARDED_HEADERS = ["forwarded", "x-forwarded-for", "x-forwarded-host", "x-forwarded-port", "x-forwarded-proto", "x-real-ip", "true-client-ip", "cf-connecting-ip"];
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function validateLocalTransportRequest(request, { hostname, port }) {
  const peer = request.socket.remoteAddress || "";
  if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(peer)) return "LOCAL_TRANSPORT_PEER_REQUIRED";
  if (FORWARDED_HEADERS.some((header) => request.headers[header])) return "INCOMING_FORWARDING_HEADERS_REJECTED";
  if (request.headers.host !== `${hostname}:${port}`) return "LOCAL_TRANSPORT_HOST_REQUIRED";
  if (UNSAFE_METHODS.has(String(request.method || "").toUpperCase()) && request.headers.origin !== `http://${hostname}:${port}`) {
    return "LOCAL_TRANSPORT_ORIGIN_REQUIRED";
  }
  return "";
}
