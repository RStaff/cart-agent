# Operator Support Boundary

The first beta has no unrestricted operator customer-data route. Support must use an explicit tenant-scoped, auditable service path and must not access another tenant by raw ID. Account recovery is an exception path and remains deferred until a governed recovery service exists; direct password database edits are prohibited.
