# StaffordOS Operator Frontend

## Ross Operator Artifact Root

Set `STAFFORDOS_ROSS_OPERATOR_ARTIFACT_ROOT` to the absolute path of the Ross Operator artifact output directory.

Expected value:

```bash
STAFFORDOS_ROSS_OPERATOR_ARTIFACT_ROOT=/absolute/path/to/ross_operator/output
```

Local default in this repo:

```bash
STAFFORDOS_ROSS_OPERATOR_ARTIFACT_ROOT=/Users/rossstafford/projects/ross-operator/ross_operator/output
```

## Deployment

This surface is deployment-ready as a read-only Next.js app.

Deployment assumptions:

- The hosting environment can run `npm run build` and `npm run start`.
- The hosting environment can read the Ross Operator artifact directory from local disk or a mounted volume.
- `STAFFORDOS_ROSS_OPERATOR_ARTIFACT_ROOT` is set to that readable artifact directory.
- The surface remains read-only and serves data through `/api/operator/ross-command-center`.

Local run:

```bash
npm run dev
```

## Packet Authority

The operator home hydrates the paid packet from the packet authority API.

Preferred local overrides:

```bash
PACKET_AUTHORITY_URL=https://pay.abando.ai
NEXT_PUBLIC_PACKET_AUTHORITY_URL=https://pay.abando.ai
CART_AGENT_API_URL=https://cart-agent-api.onrender.com
NEXT_PUBLIC_CART_AGENT_API_URL=https://cart-agent-api.onrender.com
```

Legacy fallback:

```bash
ABANDO_API_BASE=http://localhost:8081
```

If the operator home still shows stale payment state, run the frontend with an explicit packet authority override:

```bash
PACKET_AUTHORITY_URL=https://pay.abando.ai NEXT_PUBLIC_PACKET_AUTHORITY_URL=https://pay.abando.ai npm run dev
```

Hosted run:

```bash
npm run build
npm run start
```
