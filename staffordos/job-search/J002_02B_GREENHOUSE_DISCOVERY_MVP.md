# J002.02B Greenhouse Discovery MVP

## Authority

Starting authority is local `main` at `4c17f27c`, after J002.02A Private Job Source Import Queue.

This mission reuses:

- J002.02A provider-neutral import queue;
- J002.01 deterministic ranking, duplicate detection, and Opportunity queue;
- J001 JobOpportunity and Application boundaries;
- J001.03A deterministic requirement extraction and private fit assessment;
- G001 private-data containment;
- G003 source snapshot authority;
- G004.01 operator write isolation.

CareerOS remains Professional → Career Operations. This mission does not create a new workspace, new shell, new authentication domain, or new application execution authority.

## Purpose

J002.02B implements the first production-quality read-only provider for Career Operations:

Provider Manifest → Greenhouse Adapter → Retrieve Published Jobs → Eligibility Filter → Normalize → Existing Job Source Import Queue → Existing Duplicate Detection → Existing Prioritization Engine → Existing Explainable Fit Artifact → Opportunity Queue.

## Provider Manifest

The manifest is simple configuration, not a plugin framework.

Example shape:

```json
{
  "schemaVersion": "staffordos.job_search.greenhouse_provider_manifest.v1",
  "sources": [
    {
      "company": "Example Company",
      "provider": "greenhouse",
      "boardToken": "examplecompany"
    }
  ]
}
```

`boardToken` should be explicit when known because Greenhouse board tokens can differ from company names. If omitted, StaffordOS derives a conservative token from the company name and records failures without fallback scraping.

## Greenhouse Provider

Implemented provider:

- Greenhouse only;
- public Job Board API only;
- HTTP GET only;
- no authentication;
- no cookies;
- no browser automation;
- no scraping;
- no login.

Captured fields include:

- provider job ID;
- title;
- company;
- location;
- department if present;
- employment type if present;
- published date if present;
- canonical URL;
- retrieval timestamp;
- source digest and G003 source snapshot.

The Greenhouse application POST endpoint is not implemented.

## Eligibility Filter

Before ranking, deterministic rules reject obvious non-target roles:

- location incompatible with the current US/remote search boundary;
- security-clearance-only roles;
- incompatible non-US work-authorization wording;
- traditional narrow marketing specialist roles;
- clearly unrelated disciplines such as sales, recruiting, legal, accounting, office administration, and support roles.

The filter does not estimate success probability, employer interest, interview probability, or offer probability.

## Normalization

Greenhouse jobs normalize into the existing J002.02A `RawJobSourceInput` and then into `staffordos.job_search.private_job_source_record.v1`.

J002.02A was extended narrowly so provider job ID and requisition ID remain separate. Public provider records use `PUBLIC_READ_ONLY_PROVIDER` authority and produce G003 `PROVIDER_CONFIRMED` source snapshots.

No new Opportunity schema is introduced.

## Duplicate Detection

Duplicate detection is delegated to J002.01. Signals include provider job ID, source URL, source digest, company plus requisition, and company plus normalized role. Duplicates are not silently merged.

## Prioritization

J002.02B delegates ranking to J002.01 with unchanged weights:

- AI / Automation: 45;
- Business Technology: 25;
- Product / TPM: 15;
- Marketing Technology: 15.

Traditional marketing specialist roles remain deprioritized or rejected before ranking.

## Explainable Fit

Discovery cannot create a full role-focused evidence review by itself. Instead, J002.02B uses existing J001.03A primitives:

- deterministic requirement extraction;
- requirement-to-career-evidence mapping with no private evidence loaded in this provider MVP;
- private fit assessment.

The resulting artifact is an explainable fit artifact for queue review. It does not promote CareerFacts, does not verify candidate claims, and does not authorize resume wording.

## Opportunity Queue

The Opportunity Queue remains the authoritative read model for discovered opportunities. Queue items include source, company, role, freshness, duplicate status, application status, ranking summary, knowns, unknowns, Ross approval requirements, completion proof, and limitations.

No Application is created by discovery.

## CLI

Local commands:

```bash
node staffordos/ui/operator-frontend/lib/staffordos/runGreenhouseDiscovery.mjs manifest-example
node staffordos/ui/operator-frontend/lib/staffordos/runGreenhouseDiscovery.mjs discover --manifest <manifest.json>
node staffordos/ui/operator-frontend/lib/staffordos/runGreenhouseDiscovery.mjs discover --example --max-jobs-per-source 15 --write
```

When `--write` is used, outputs are owner-private and outside Git.

## Private Outputs

Private output files may include:

- provider manifest snapshot;
- Greenhouse retrieval metadata;
- eligibility reviews;
- Job Source Import Queue;
- Opportunity Queue;
- explainable fit artifacts;
- audit summary.

Raw job descriptions and source records are not committed.

## Tests

Focused tests cover:

- provider-manifest token resolution;
- public Greenhouse API retrieval with GET;
- Greenhouse normalization;
- eligibility filtering;
- J002.02A queue generation;
- J002.01 duplicate integration;
- existing Application prevention;
- explainable fit artifact generation;
- failed-board handling without scraping fallback;
- private output repository rejection;
- absence of application, resume, message, browser, OAuth, external AI, `/os`, or `/operator` execution surfaces.

## Known Limitations

This mission implements Greenhouse only. It does not implement LinkedIn, Workday, Lever, Ashby, OAuth, scheduling, notifications, dashboard redesign, resume generation, resume tailoring, cover letters, Applications, auto-apply, recruiter messaging, deployment, or push.

Board discovery still depends on correct Greenhouse board tokens. The built-in example manifest is for validation only; Ross should maintain real monitored sources in owner-private storage.

Explainable fit artifacts are discovery-level artifacts and intentionally do not replace full private role-focused evidence review.

## Rollback

Rollback with:

```bash
git revert <J002.02B commit SHA>
```

No real Greenhouse job payloads are committed.

## Recommended Next Mission

`J002_02C_OPERATOR_REVIEW_GREENHOUSE_OPPORTUNITY_QUEUE`

That slice should let Ross review the real discovered queue, approve selected JobOpportunity imports, and preserve rejected/deferred decisions without applying to jobs.
