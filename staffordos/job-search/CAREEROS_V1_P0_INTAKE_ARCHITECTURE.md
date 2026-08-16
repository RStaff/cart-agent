# CareerOS P0 Intake Architecture

The intake service owns source text validation, deterministic segmentation, provenance, candidate deduplication, review decisions, and tenant-scoped promotion.

Supported source types are `RESUME_TEXT`, `MANUAL_WORK_HISTORY`, `PROJECT`, `CERTIFICATION`, `PORTFOLIO_DESCRIPTION`, and `OTHER_USER_PROVIDED_TEXT`.

Binary uploads fail closed until secure object storage exists. Pasted text is bounded to 50,000 characters and is accepted only by the local P0 adapter. The extractor does not use titles, job requirements, labels, ranks, embeddings, or external providers.

The service boundary is independent of the current JSON adapter so a future Prisma/object-storage implementation can replace persistence without changing extraction or review semantics.
