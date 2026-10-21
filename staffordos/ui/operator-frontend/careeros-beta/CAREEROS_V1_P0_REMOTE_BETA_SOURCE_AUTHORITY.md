# CareerOS Private Beta Source Authority

This isolated application root is the governed source boundary for the CareerOS
invite-only text beta.

## Deployment Boundary

- Repository: `RStaff/cart-agent`
- Render root directory: `staffordos/ui/operator-frontend/careeros-beta`
- Build command: `npm run build`
- Start command: `npm run start`
- Runtime: Next.js Node runtime
- Customer routes: `/career/*` and `/api/career/*`
- Database migration source: `prisma/careeros.prisma` and `prisma/migrations/`
- Promoted source SHA: `e9fdcd390281f0022a8f42ae68f9326133180a6b`
- Remote beta branch: `careeros/private-beta`

The root intentionally excludes `/os/*`, `/operator/*`, operator components, and
StaffordOS private loaders. It is not a replacement for the StaffordOS operator
application.

## Promotion Contract

Promotion uses a dedicated remote branch, never `origin/main`. The source SHA
must be a committed, validated tree containing this root. The promotion script
rejects a main-branch destination, force pushes, staged changes, and a changed
`origin/main` reference.

No Render resource, database, migration, DNS record, secret, or customer data is
created by source promotion.
