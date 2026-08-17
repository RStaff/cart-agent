# CareerOS Application Runtime Decision

Use one isolated Node/Next.js web service for the current P0 customer namespace. The runtime needs server-side session resolution, Prisma access, pasted-text intake, export/delete, and customer routes. No worker, websocket, scheduled job, or queue is required for the first five-user beta.

The runtime must not expose `/os/professional/*` as a customer surface. Start from the operator-frontend package's production build/start contract after its deployment root and environment contract are approved.

Preferred hosting is a separate Render web service. Cloud Run is the fallback. Existing Abando services and the root cart-agent container are not CareerOS runtime authority.
