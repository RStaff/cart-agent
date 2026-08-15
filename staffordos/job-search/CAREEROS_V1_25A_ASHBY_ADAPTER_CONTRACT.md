# CareerOS V1.25A Ashby Adapter Contract

No adapter is implemented in V1.25A because access authorization failed closed.

If permission is obtained, the adapter must be a thin provider boundary:

```text
Ashby listed job-board response
  -> Ashby adapter
  -> existing RawJobSourceInput
  -> normalizeJobSourceInput
  -> existing NormalizedJobSourceRecord
```

Mapping rules:

- `provider`: `ashby`
- `providerJobId`: stable Ashby posting identity when supplied; otherwise the documented job URL only as a secondary identity
- `sourceUrl`: `jobUrl`
- `title`: `title`
- `location`: primary location plus secondary locations without inventing geography
- `remoteState`: `workplaceType` / `isRemote`
- `employmentType`: `employmentType`
- `compensationText`: compensation summary only when `includeCompensation=true` and present
- `publicationDate`: `publishedAt`
- `descriptionText`: `descriptionPlain`
- `rawSourceContent`: `descriptionHtml`, privately retained
- `rawSourceContentType`: `text/html`
- `sourceStructure`: existing structure parser and provider-neutral block contract

Absent fields remain null/unknown. No Ashby-specific downstream branches are authorized.
