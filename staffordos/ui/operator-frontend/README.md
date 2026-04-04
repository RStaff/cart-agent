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

Hosted run:

```bash
npm run build
npm run start
```
