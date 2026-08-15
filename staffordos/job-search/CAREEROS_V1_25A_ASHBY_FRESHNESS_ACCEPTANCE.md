# Ashby Freshness Acceptance

No live freshness acceptance was run. The documented `publishedAt` field supports source publication authority; the provider-neutral contract must additionally record retrieval and last-observed timestamps locally.

Future acceptance must verify:

- `publishedAt` is not replaced by retrieval time;
- missing `updatedAt` remains unknown;
- listed/unlisted state is preserved;
- absence from a later response does not imply closure without feed completeness authority;
- repeated identical payloads produce deterministic freshness state.
