# STAFFORDOS_OPERATOR_TASK2_PACKET_AUTHORITY_VERIFY_REPORT_V1

## Env Vars Inspected

Local operator frontend config currently contained:

- `ABANDO_API_BASE=http://localhost:8081`
- `NEXT_PUBLIC_ABANDO_API_BASE` not set in `staffordos/ui/operator-frontend/.env.local`
- `PACKET_AUTHORITY_URL` not set
- `NEXT_PUBLIC_PACKET_AUTHORITY_URL` not set
- `CART_AGENT_API_URL` not set
- `NEXT_PUBLIC_CART_AGENT_API_URL` not set

Supporting repo config also contains:

- root `.env.local` with `NEXT_PUBLIC_ABANDO_API_BASE="https://pay.abando.ai"`
- root `.env.local` with `NEXT_PUBLIC_API_BASE="https://pay.abando.ai"`
- `staffordos/ui/operator-frontend/app/operator/page.tsx` now accepts packet-authority and cart-agent API env vars first

## API Base Selected

Before the fix, the local operator frontend selected:

- `ABANDO_API_BASE=http://localhost:8081`

That is why `/operator` fell back to stale local runtime truth instead of the paid packet authority.

After the fix, the operator frontend now prefers, in order:

1. `PACKET_AUTHORITY_URL`
2. `NEXT_PUBLIC_PACKET_AUTHORITY_URL`
3. `CART_AGENT_API_URL`
4. `NEXT_PUBLIC_CART_AGENT_API_URL`
5. `NEXT_PUBLIC_ABANDO_API_BASE`
6. `NEXT_PUBLIC_API_BASE`
7. `NEXT_PUBLIC_ABANDO_BACKEND_ORIGIN`
8. `ABANDO_BACKEND_ORIGIN`
9. `ABANDO_API_BASE`
10. `CART_AGENT_API_BASE`
11. `https://pay.abando.ai`
12. `https://cart-agent-api.onrender.com`

## Files Changed

- `staffordos/ui/operator-frontend/app/operator/page.tsx`
- `staffordos/ui/operator-frontend/README.md`

## Diff Summary

- Added packet-authority-specific env precedence to the operator home.
- Added packet list probing from packet authority before falling back to local runtime truth.
- Documented the correct local override variables in the operator frontend README.
- Documented the exact local command to run the operator frontend against packet authority.

## Validation Result

- `npm --prefix /Users/rossstafford/projects/cart-agent/staffordos/ui/operator-frontend run build` passed.
- Local dev server rendered `/operator` successfully.
- With explicit packet-authority env vars, `/operator` rendered the paid packet from live authority:
  - `packet_elkeyecoffee-com_7431aab34d`
  - `payment_received`
  - `elkeyecoffee.com`
  - `res_11fede09-d76f-49b7-98cb-eae0e5f70500`

## Local Verification Result

Rendered `/operator` locally:

- Packet ID: `packet_elkeyecoffee-com_7431aab34d`
- Store: `elkeyecoffee.com`
- Packet status: `payment_received`
- Continuity link: `/fix-status?packet_id=packet_elkeyecoffee-com_7431aab34d&session_id=cs_live_b1mPfq24qSn7fXGcg9Tzap6sq1FkmRt5O2nfd5K0uWK4YMWVWWNJEHrnRw&store=elkeyecoffee.com&reservation_id=res_11fede09-d76f-49b7-98cb-eae0e5f70500`

The sandbox-local dev server verified the live packet authority fetch path once packet-authority env vars were provided explicitly.

## Exact Local Command Ross Should Run Next

```bash
cd /Users/rossstafford/projects/cart-agent/staffordos/ui/operator-frontend && \
PACKET_AUTHORITY_URL=https://pay.abando.ai \
NEXT_PUBLIC_PACKET_AUTHORITY_URL=https://pay.abando.ai \
npm run dev
```

If Ross’s environment still prefers the Render packet API, this equivalent override is also supported:

```bash
cd /Users/rossstafford/projects/cart-agent/staffordos/ui/operator-frontend && \
CART_AGENT_API_URL=https://cart-agent-api.onrender.com \
NEXT_PUBLIC_CART_AGENT_API_URL=https://cart-agent-api.onrender.com \
npm run dev
```

## GO / NO-GO

- **GO**
- The source-of-truth config fix is in place and the local operator frontend now hydrates the paid packet with explicit packet-authority env vars.
