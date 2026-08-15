# CareerOS V1.25D Canonical Adapter Mapping

No adapter was implemented because the credential gate failed. This is the bounded mapping for a future isolated pilot.

| TheirStack concept | Canonical field | Rule |
| --- | --- | --- |
| job id | `providerJobId` | Preserve as string; never replace with an index |
| original source/provider job id | `provenance` / source observation | Preserve when returned |
| URL/final URL | `sourceUrl` | Prefer original employer URL when supplied, retain TheirStack URL separately |
| company/domain | `company`, provenance | Do not infer employer from title |
| title | `title` | Preserve source value |
| location/cities/country | `location` | Normalize without inventing remote state |
| remote | `remoteState` | Map only explicit provider value |
| employment statuses | `employmentType` | Preserve unknown for absent values |
| salary fields | `compensationText` | No fabricated range/currency |
| posted/closed/discovered dates | `publicationDate`, `freshness` | Preserve source and retrieval timestamps separately |
| description | `descriptionText`, `rawSourceContent` | Retain only under license and bounded cache policy |
| HTML/content type | `rawSourceContentType` | Explicitly mark html/plain/unknown |
| provider source fields | `sourceStructure` | Consume only if present and provenance-bearing |
| digest | `sourceDigest` | Deterministic canonical digest |

Provider-specific fields stop at the adapter boundary. Downstream extraction, qualification, preference, and V2D diagnostics consume the existing provider-neutral record.
