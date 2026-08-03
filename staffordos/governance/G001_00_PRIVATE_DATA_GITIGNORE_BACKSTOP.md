# G001.00 Private Data Gitignore Backstop

Status: Complete - repository privacy hardening
Date: 2026-08-03
Mission: G001_00_PRIVATE_DATA_GITIGNORE_BACKSTOP_AND_REPOSITORY_CONTAINMENT

## Checkpoint Authority

Current HEAD at mission start was `eae4f9ddccec4ae50f28e44822b213d7be766108`.

The following commits were present in history:

- `625b9150` - Ratify StaffordOS enterprise architecture review
- `eae4f9dd` - A001 define StaffordOS Asset Authority architecture

The ratified Enterprise Architecture Review and Asset Authority artifacts exist. A001 selected this mission because private Professional data already exists outside Git and a repository-level ignore backstop was required as defense in depth.

## Existing Ignore Authority

Root `.gitignore` already covered common Node, build, temp, log, environment, editor, cache, hygiene, and selected StaffordOS generated-output paths.

Nested ignore files exist for frontend/package-specific generated output. `.git/info/exclude` contains only default commented examples and was not modified.

Existing coverage was partially sufficient for logs, env files, node modules, and some generated StaffordOS output. It was missing explicit protection for predictable StaffordOS private roots and `.private.*` runtime artifacts.

## Private Data Threat Model

Git must not become storage for:

- user-content data;
- private runtime records;
- resumes or career-source material;
- real job descriptions or opportunity records;
- family or personal media;
- customer content;
- provider credentials;
- private model conversations;
- real operator decision records.

The ignore rules reduce accidental staging risk. They do not make in-repository private data acceptable.

## External Private Root Boundary

Approved private roots remain outside Git, represented generically as:

- `$HOME/.staffordos/private/`
- `$HOME/staffordos-private-intake/`

Repository `.gitignore` cannot protect external paths directly. It protects only accidental in-repository copies or generated equivalents.

## Classification Model

MUST IGNORE:

- repository-root `.staffordos/`;
- nested `.staffordos/private/`;
- `staffordos-private-intake/`;
- `private-intake/`;
- `private-runtime/`;
- `private-data/`;
- `.private.json`, `.private.ndjson`, `.private.jsonl`, `.private.sqlite`, `.private.db`, and `.private.log` artifacts.

MUST TRACK:

- source code;
- deterministic tests;
- synthetic fixtures without private suffixes;
- architecture and doctrine;
- schemas and migrations;
- sealed or redacted evidence;
- governed configuration.

CONDITIONAL:

- exports;
- provider caches;
- local snapshots;
- test outputs;
- generated reports.

These require location-specific decisions. They must not be hidden by broad rules.

PROHIBITED LOCATION:

- real resumes;
- private Career facts;
- real Job Opportunity records;
- private contact information;
- family media;
- customer content;
- provider credentials;
- raw media libraries;
- private model conversations.

Ignored files in these categories are still misplaced if they are inside the repository.

## Rules Added

Added a marked StaffordOS private-data section to root `.gitignore`:

- `/.staffordos/`
- `**/.staffordos/private/`
- `/staffordos-private-intake/`
- `**/staffordos-private-intake/`
- `**/private-intake/`
- `**/private-runtime/`
- `**/private-data/`
- `*.private.json`
- `*.private.ndjson`
- `*.private.jsonl`
- `*.private.sqlite`
- `*.private.db`
- `*.private.log`

These are narrow path and suffix rules. They do not ignore ordinary JSON, PDF, DOCX, Pages, media, source, architecture, fixtures, or public assets.

## Rules Rejected

Rejected as too broad:

- `private/`
- `data/`
- `*.json`
- `*.pdf`
- `*.docx`
- `*.pages`
- `media/`
- `uploads/`
- `documents/`
- `resumes/`

These could hide legitimate source, architecture, public assets, redacted documentation, governed fixtures, migrations, or approved evidence.

## Tracked File Collision Result

No tracked path matched the added StaffordOS private-data patterns during the pre-edit collision scan.

Existing tracked files that may already match older ignore rules were not changed, unstaged, removed, or reclassified by this mission.

## Tracked Private Data Scan Result

Path-pattern checks found no tracked StaffordOS private roots, `.private.*` artifacts, private Career intake outputs, private Job Search intake outputs, local database files, or PDF/DOCX/Pages source files in private/runtime locations.

No file contents were inspected.

## Symlink Result

Tracked symlink scan found no tracked symlinks. Repository symlink metadata scan with package directories pruned found no symlinks pointing toward private StaffordOS roots.

Package-manager symlinks under dependency directories are outside this privacy finding.

## Containment Check Decision

No new utility was created.

Reason: this mission needed a narrow committed ignore policy, and the required deterministic checks are already provided by Git path operations:

- tracked-path collision scan;
- tracked-private-path scan;
- symlink metadata scan;
- `git check-ignore` synthetic path checks;
- staged diff review.

A future commit-gate integration can add a path-only scanner if private workflows start producing repository-adjacent artifacts more often.

## Validation

Validation covered:

- `.gitignore` behavior using synthetic paths only;
- approved architecture JSON remaining trackable;
- TypeScript source remaining trackable;
- synthetic fixture paths remaining trackable;
- public assets remaining trackable;
- PDF, DOCX, and Pages extensions not globally ignored;
- `.private.json` ignored by approved suffix rule;
- tracked-file collision scan;
- tracked-private-path scan;
- symlink metadata scan;
- JSON validation;
- diff whitespace checks.

## Limitations

- `.gitignore` does not protect private data outside the repository.
- `.gitignore` does not remove any file already tracked by Git.
- Ignored private data inside the repository remains a policy violation.
- This mission did not implement secret scanning.
- This mission did not inspect private data contents.

## Rollback

Repository rollback:

`git revert <G001.00 commit SHA>`

Rollback removes the repository ignore backstop and G001 documentation. It does not move, delete, expose, or modify external private data.

## Exact Next Mission

Selected next mission:

`G002_00_PROFESSIONAL_MODE_AND_WORKSPACE_REGISTRY_RECONCILIATION`

Reason: A001 identified Professional registry drift and missing `professionalMode` as the next required correction before richer Job Search UI connection.

## Non-Impact

This mission did not move, copy, read, rewrite, delete, or migrate private data. It did not modify source applications, Prisma, migrations, routes, UI, `/operator`, `/os`, provider integrations, Ollama, deployment, push, or private external directories.
