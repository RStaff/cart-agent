# CareerOS P0 Database Authority

The contained schema at `staffordos/ui/operator-frontend/prisma/careeros.prisma` is the CareerOS production persistence authority. It uses the existing PostgreSQL/Prisma technology without modifying the shared ShopiFixer/Abando schema.

The local JSON adapter remains a development-only implementation of the same service surface. Business routes select persistence through the adapter boundary. No local synthetic records are migrated automatically.

All customer-owned rows carry tenant ownership directly or through an owned profile/source relationship, with foreign keys and tenant/user indexes supporting fail-closed access.
