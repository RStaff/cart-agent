# S009.04B Certify Local Model Provider Boundary

## Mission

S009_04B_CERTIFY_LOCAL_MODEL_PROVIDER_BOUNDARY certifies one interchangeable local provider behind the StaffordOS Chief of Staff architecture.

This mission does not select the permanent reasoning engine for StaffordOS. Ollama plus `qwen2.5:1.5b` is a proof-of-architecture provider only.

Permanent authority order:

1. StaffordOS Governance
2. StaffordOS Validation
3. StaffordOS Source Authority
4. Provider Adapter
5. Model

The model proposes. StaffordOS decides whether the proposal can be trusted.

## Checkpoint Authority

- Starting HEAD: `29a378734e2a5b2f7eb856ec4a1290004590d766`
- Prior S009.04A planning commit: `S009 plan local model runtime authority`
- Required authorities verified:
  - `staffordos/architecture/STAFFORDOS_ARCHITECTURE_V1.md`
  - `staffordos/architecture/S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.md`
  - `staffordos/architecture/S009_01_STATIC_FIXTURE_AND_DETERMINISTIC_RESPONSE_VALIDATOR.md`
  - `staffordos/architecture/S009_02_READ_ONLY_CHIEF_OF_STAFF_DEMONSTRATION_SURFACE.md`
  - `staffordos/architecture/S009_03_PROVIDER_NEUTRAL_MODEL_ADAPTER_INTERFACE.md`
  - `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts`
  - `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.ts`

## Working Tree Exclusions

The repository contained broad preexisting unrelated modified and untracked files. They were excluded from this mission.

Excluded categories:

- S007 identity or issuer artifacts
- runtime and daemon outputs
- web, Prisma, migration, packet, and API work
- ShopiFixer, Abando, production, recovery, reconciliation, and mission-evidence artifacts
- generated frontend files
- unknown unrelated files requiring separate review

Authorized S009.04B repository changes only:

- Ollama provider adapter
- bounded proof harness
- deterministic tests
- S009.04B documentation

## Runtime Installation

Authorized installation executed:

- `brew install ollama`

Installed runtime:

- Command: `/opt/homebrew/bin/ollama`
- Version: `0.32.5`
- Formula footprint: `/opt/homebrew/Cellar/ollama/0.32.5`, about 49 MB

Homebrew side effects observed:

- Homebrew auto-updated.
- Homebrew installed Ollama formula dependencies.
- Homebrew upgraded selected Homebrew-managed dependencies required by the formula.
- Homebrew cleanup removed older formula versions and one older Homebrew Git version while Apple Git remained available.
- No repository package dependency was added.

No background Homebrew service was started.

## Model Installation

Authorized model download executed:

- `ollama pull qwen2.5:1.5b`

Installed model:

- Name: `qwen2.5:1.5b`
- Digest: `65ec06548149b04c096a120e4a6da9d4017ea809c91734ea5631e89f96ddc57b`
- Size: `986061892` bytes
- Format: `gguf`
- Family: `qwen2`
- Parameters: `1.5B`
- Quantization: `Q4_K_M`
- Context length: `32768`
- License metadata: `apache-2.0`
- Local model/cache footprint after pull: about 940 MB under `/Users/rossstafford/.ollama`

Only `qwen2.5:1.5b` was downloaded.

## Localhost Boundary

Ollama was started only as a foreground local process:

- `OLLAMA_NO_CLOUD=1 OLLAMA_HOST=127.0.0.1:11434 ollama serve`

Runtime evidence:

- `lsof` showed `ollama` listening only on `127.0.0.1:11434`.
- Ollama server log reported `Listening on 127.0.0.1:11434`.
- Ollama server log reported `Ollama cloud disabled: true`.
- The underlying runner started with `--host 127.0.0.1`, `--offline`, and `--no-webui`.
- No public `0.0.0.0` listener was accepted.
- The listener was stopped before mission completion.
- Post-stop `lsof` found no `11434` listener.
- Post-stop process inspection found no `ollama`, `llama-server`, or proof Node process.

## Tool, Retrieval, and Persistence Boundary

The StaffordOS proof adapter supplied:

- no tools
- no retrieval context
- no embeddings
- no vector search
- no filesystem access
- no shell access
- no browser access
- no email or calendar access
- no database access
- no API mutation authority
- no production data
- no Professional data
- no Personal data
- no Family data
- no `ross-llm` data or memory

Ollama model metadata listed generic model capabilities `completion` and `tools`. No tools were supplied by StaffordOS, no tool bridge exists in the adapter, and the proof payload contains no tool definitions.

Persistence observations:

- StaffordOS created no database record, runtime memory, vector store, retrieval index, or persisted proof artifact.
- Ollama created local runtime/model files under `~/.ollama`, including a local runtime key and model weights.
- No `~/.ollama/logs` directory was present after the proof.
- Ollama server logs showed an in-process prompt cache while the model was loaded. The request used `keep_alive: "0"`, `/api/ps` returned no loaded models after generation, and the listener was stopped. Future provider certification should continue to re-check prompt-cache behavior.

## Provider Adapter

Created:

- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffOllamaAdapter.ts`

The adapter:

- uses the S009.03 provider-neutral request and execution pipeline
- sends only the governed static Stafford Media source snapshot
- calls only `http://127.0.0.1:11434/api/generate`
- enforces the exact localhost endpoint
- requests JSON output with `format: "json"`
- uses `stream: false`
- uses `keep_alive: "0"`
- uses `temperature: 0`
- uses `num_ctx: 4096`
- has a 60-second fail-closed timeout
- does not add a provider SDK
- does not use secrets or environment variables
- does not mark output trusted
- returns output through the existing StaffordOS structural guard and deterministic validator

## Proof Harness

Created:

- `staffordos/ui/operator-frontend/lib/staffordos/runOllamaChiefOfStaffProof.mjs`

The harness:

- compiles committed local TypeScript modules for this proof command
- loads the fixed Stafford Media governed request
- loads only authorized Stafford Media source fixtures
- invokes one local Ollama request
- prints a redacted operator-safe summary
- does not print raw model output
- exits nonzero if the response is blocked
- performs no writes beyond terminal output

## Live Model Attempt

Completed model attempts: 1

Attempt 1:

- Endpoint: `http://127.0.0.1:11434`
- Model: `qwen2.5:1.5b`
- Digest: `65ec06548149b04c096a120e4a6da9d4017ea809c91734ea5631e89f96ddc57b`
- Request: `What deserves my attention, and why?`
- Sources: 9 static Stafford Media source fixtures
- Generation status: `Proposed`
- Structural validation: passed
- StaffordOS deterministic validation: passed
- Trusted response available: yes
- Validation error codes: none
- Trusted response headline: `Start with Start My Day.`
- Recommendation status: `Ready for operator review`
- Claims checked: 4
- Recommendations checked: 1
- Sources checked: 9
- Duration: about 19.1 seconds
- Prompt eval count: 3762
- Eval count: 1312

The interrupted proof command before the timeout update produced no `/api/generate` entry in the Ollama logs and left no proof Node process running. It was not counted as a completed model attempt.

## Validation Authority Result

The local model output became trusted only after:

1. adapter result envelope construction
2. structural response guard
3. S009.01 deterministic StaffordOS validation

Provider success alone did not create a trusted response.

The local provider remains below StaffordOS Governance, StaffordOS Validation, and StaffordOS Source Authority.

## Fail-Closed Proof

Deterministic tests proved:

- malformed output fails closed
- empty output fails closed
- transport failure fails closed
- timeout fails closed
- unsupported recommendation status fails closed
- invalid output does not create `trustedResponse`
- Professional and Personal sources cannot be supplied
- non-localhost endpoints are rejected before transport

Invalid live model output was not requested. The deterministic invalid fixtures remain the safer fail-closed proof path.

## Resource Observations

- Model footprint: about 940 MB under `~/.ollama`
- Free disk after model pull: about 85 GiB
- Ollama server log reported Apple M2 Pro Metal execution.
- Runtime log reported projected model memory around 1.1 GiB device memory for this proof.
- The proof did not disrupt the operator frontend tests.

## Runtime Stop Result

The local listener was stopped with:

- `pkill -f "ollama serve"`

Post-stop evidence:

- no `127.0.0.1:11434` listener
- no `ollama` process
- no `llama-server` process
- no proof Node process
- deterministic StaffordOS tests passed with Ollama stopped

## Tests

Focused and regression tests:

- `node --test staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffOllamaAdapter.test.mjs`: 14/14 passed
- `node --test staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.test.mjs`: 25/25 passed
- `node --test staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.test.mjs`: 37/37 passed
- `node --test staffordos/ui/operator-frontend/lib/staffordos/*.test.mjs`: 221/221 passed

Build and static checks:

- `npm run build` in `staffordos/ui/operator-frontend`: exited 0.
- Build emitted an existing NFT tracing warning for `app/api/operator/ceo-snapshot/route.ts`.
- Build emitted existing `/operator/shopifixer-pilot` function-serialization errors while still completing static generation and exiting 0.
- This mission did not modify `/operator`, ShopiFixer runtime code, or route behavior.
- `jq -e staffordos/architecture/S009_04B_CERTIFY_LOCAL_MODEL_PROVIDER_BOUNDARY.json`: passed.
- `git diff --check` for the S009.04B paths: passed.

## Boundary Safety

Verified:

- Ollama installed successfully.
- `qwen2.5:1.5b` installed successfully.
- Runtime was localhost only.
- No public listener existed.
- No StaffordOS tool bridge existed.
- No retrieval was supplied.
- No StaffordOS persistence was implemented.
- Adapter remained provider-neutral.
- Static Stafford Media fixture executed.
- Structural validation passed.
- StaffordOS deterministic validation passed.
- Trusted response was created only after validation.
- Invalid responses remained blocked by deterministic tests.
- Runtime stopped cleanly.
- StaffordOS tests continued to pass with runtime stopped.

## Files Changed

Added:

- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffOllamaAdapter.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffOllamaAdapter.test.mjs`
- `staffordos/ui/operator-frontend/lib/staffordos/runOllamaChiefOfStaffProof.mjs`
- `staffordos/architecture/S009_04B_CERTIFY_LOCAL_MODEL_PROVIDER_BOUNDARY.md`
- `staffordos/architecture/S009_04B_CERTIFY_LOCAL_MODEL_PROVIDER_BOUNDARY.json`

Modified:

- none

## Known Limitations

- This does not prove robust reasoning quality.
- The prompt included an exact expected response template, so this certifies the provider boundary and validation gate, not autonomous response design.
- The model metadata advertises generic tool capability, but no tools were supplied or connected.
- Ollama stores local model weights and a local runtime key under `~/.ollama`.
- Ollama server logs showed an in-process prompt cache while the model was loaded; future certification should continue to verify that no conversation or business memory survives model unload.
- The provider remains local proof infrastructure only and is not a permanent StaffordOS reasoning engine.

## Rollback

Repository rollback:

`git revert <S009.04B commit SHA>`

Local runtime cleanup if Ross wants to remove the proof provider later:

- stop any listener with `pkill -f "ollama serve"`
- remove the model with `ollama rm qwen2.5:1.5b`
- uninstall the runtime with `brew uninstall ollama`
- inspect residual local files under `~/.ollama`

No production, database, identity, Stripe, ShopiFixer, Abando, provider-account, or deployment rollback is required.

## Recommendation

S009 can proceed with a provider-independent Chief of Staff architecture. The next mission should not promote Ollama to permanent reasoning authority. The safest next step is a small contract-hardening mission that reduces the proof prompt size, records provider-output audits without persistence, and keeps model selection interchangeable.
