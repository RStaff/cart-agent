# CareerOS V1.25C Data Quality Matrix

| Source class | Identity | Structure | Freshness | Requirement extraction | Main limitation |
|---|---|---|---|---|---|
| Direct ATS | High | High to variable | High when authorized | Best | Employer/partner scope |
| Adzuna | Medium-high | Medium; product dependent | High current ads | Medium | Aggregated/republication and license constraints |
| TheirStack | High API identity | Medium-high; verify raw content | High plus historical | Medium-high | Contract/raw-content verification |
| Lightcast | High normalized identity | High structured enrichment | High datasets | High for taxonomy, lower for raw provenance | Enterprise license and raw description uncertainty |
| USAJOBS | High | High announcement fields | High open-state | High | Federal jobs only |
| The Muse | Medium | Medium | Medium | Medium | Curated scope and restrictive content license |
| Jooble | Medium | Low-medium snippets/fields | Medium-high partner feed | Low-medium | Full description/provenance uncertain |
| RapidAPI wrappers | Variable | Variable | Variable | Variable | Upstream authority unknown |
| Public aggregators | Variable | Variable | Variable | Variable | Commercial rights unclear |

The canonical contract is compatible with all serious candidates at a field level, but raw source authority, retention rights, and source freshness must be recorded separately from normalized match data.
