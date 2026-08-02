# S009.04A Local Model Runtime Selection and Installation Plan

## Mission

S009_04A_LOCAL_MODEL_RUNTIME_SELECTION_AND_INSTALLATION_PLAN selects one local-only runtime and one bounded model candidate for a future S009.04 Chief of Staff model proof.

This mission is read-only planning only. It did not install a runtime, download model weights, start a model server, invoke a model, add credentials, modify application code, modify `ross-llm`, deploy, or push.

## Checkpoint Authority

- Starting HEAD verified: `fc9cd1889d84fc729886bbb5bd8825032c7cd972`
- Branch observed: `main`
- No S009.04 implementation or commit exists.
- Required authorities verified:
  - `staffordos/architecture/STAFFORDOS_ARCHITECTURE_V1.md`
  - `staffordos/architecture/S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.md`
  - `staffordos/architecture/S009_01_STATIC_FIXTURE_AND_DETERMINISTIC_RESPONSE_VALIDATOR.md`
  - `staffordos/architecture/S009_02_READ_ONLY_CHIEF_OF_STAFF_DEMONSTRATION_SURFACE.md`
  - `staffordos/architecture/S009_03_PROVIDER_NEUTRAL_MODEL_ADAPTER_INTERFACE.md`
  - `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts`
  - `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffDemo.ts`
  - `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.ts`

Certified baseline:

- S009.04 stopped correctly because no authorized model path existed.
- No model call occurred.
- No model runtime was installed or started.
- No local model identity was proven.
- No sandbox boundary was established.
- Static Stafford Media fixtures remain the only authorized model-proof input.
- Adapter output remains untrusted until structural and StaffordOS validation pass.
- Professional and Personal remain Planned.
- No production, customer, merchant, family, employer, or personal data is authorized.

## Working Tree Exclusions

The worktree contains broad preexisting unrelated changes. They were inventoried and excluded.

Excluded categories:

- S007 identity or issuer artifacts
- runtime and daemon outputs
- web, Prisma, and migration work
- generated frontend files
- ShopiFixer, production, recovery, reconciliation, and mission-evidence artifacts
- unknown unrelated files requiring separate review

Authorized S009.04A files only:

- `staffordos/architecture/S009_04A_LOCAL_MODEL_RUNTIME_SELECTION_AND_INSTALLATION_PLAN.md`
- `staffordos/architecture/S009_04A_LOCAL_MODEL_RUNTIME_SELECTION_AND_INSTALLATION_PLAN.json`

No application code, package files, runtime files, tests, environment files, or `ross-llm` files were modified.

## Machine Authority

Safe local inspection found:

- Operating system: macOS 26.5.1, build 25F80
- Architecture: `arm64`
- Machine: MacBook Pro
- Model identifier: `Mac14,9`
- Chip: Apple M2 Pro
- CPU: 10 cores, 6 performance and 4 efficiency
- Memory: 16 GB
- Disk: root volume about 460 GiB total, about 87 GiB available
- Package managers/tools present:
  - Homebrew 5.1.10 at `/opt/homebrew/bin/brew`
  - Node 20.19.5 through Volta
  - npm 10.8.2
  - Python 3.9.6
  - pip 21.2.4
  - Docker CLI 28.2.2
  - Git
- Rosetta package present.
- Docker daemon: unavailable during inspection.
- Environment variable names indicating provider or secret material exist, including `OPENAI_API_KEY`, `CF_API_TOKEN`, `DATABASE_URL`, `GMAIL_APP_PASSWORD`, and `SERPER_API_KEY`; values were not inspected and are not authorized for this mission.

Current model-relevant local listeners:

- No Ollama, llama.cpp, LM Studio, vLLM, GPT4All, Jan, LocalAI, or OpenAI-compatible local model endpoint was detected.
- Existing listeners were local database and Node processes, not model runtimes.

Current local model caches:

- No common Ollama, LM Studio, llama.cpp, or Hugging Face model-cache directories were found under checked common paths.

Machine capacity classification:

`LOCAL_MODEL_CAPABLE_WITH_SMALL_MODEL`

The machine can support a small local model proof, but 16 GB RAM and evidence of current compression/swap history argue against 7B+ models and long-context runs for this stage.

## Resource and Disk Safety

Conservative S009.04 limits:

- Maximum model download size: 2 GB
- Maximum total installed footprint for first proof: 5 GB
- Minimum free disk after install and model pull: 70 GiB
- Expected RAM use: small-model class, target under 6 GB during the proof
- Expected context size: 4096 tokens for first proof
- Maximum proof attempts: 2
- Maximum process duration: 20 minutes total for proof activity
- Maximum concurrent model requests: 1
- Maximum loaded models: 1

Rationale:

- Root volume free space is about 87 GiB.
- The future proof needs only one bounded Stafford Media question and a small static source snapshot.
- Larger models materially increase disk, memory, thermal, and runtime risk without being necessary for the first contract proof.

## Existing Runtime Inventory

| Runtime | Installed | Command path | Listening address | Model cache | Tool/retrieval/persistence concern | Suitability |
|---|---:|---|---|---|---|---|
| Ollama | No | none | none | none detected | Cloud features must be disabled; logs/cache must be controlled | Not installed; suitable to install |
| llama.cpp CLI/server | No | none | none | none detected | Manual model management; server has broad endpoints if not constrained | Not installed; viable but more operational work |
| LM Studio | No | none | none | none detected | GUI, model manager, chat, MCP/tools, docs/RAG features broaden surface | Not installed; not recommended for this proof |
| MLX / mlx-lm | No | none | none | none detected | Python/package dependency and model download management needed | Not installed; not recommended for first proof |
| vLLM | No | none | none | none detected | Server/GPU-oriented; Docker unavailable; heavier footprint | Incompatible for this machine proof |
| GPT4All | No | none | none | none detected | GUI/app persistence surface unclear here | Insufficient evidence |
| Jan | No | none | none | none detected | GUI/app persistence surface unclear here | Insufficient evidence |
| LocalAI | No | none | none | none detected | Server-oriented; Docker unavailable; broader API surface | Not recommended |

`ross-llm` exists locally, but it uses chat, retrieval, pgvector, embeddings, Docker services, env-file configuration, and memory directories. It is not an authorized S009.04 path and must remain unmodified.

## Runtime Candidate Comparison

### Ollama

Classification: `RECOMMENDED`

Evidence:

- Official macOS docs support Apple M-series Macs on macOS Sonoma or newer and identify `~/.ollama` as the model/config location.
- Official API docs state the local API default is `http://localhost:11434/api`.
- Official API docs support structured output through `format: "json"` or a JSON schema object.
- Official FAQ says Ollama binds to `127.0.0.1:11434` by default and cloud features can be disabled with `OLLAMA_NO_CLOUD=1` or `disable_ollama_cloud` in `~/.ollama/server.json`.
- Homebrew provides an `ollama` formula for Apple Silicon macOS with current stable version metadata.

Fit:

- Works on this Apple Silicon Mac.
- Can be installed through Homebrew without adding Node or Python package dependencies.
- Can be started as a foreground local process with inline environment values.
- Can be stopped immediately.
- Can run one bounded request at a time.
- Does not require a provider SDK.

Constraints:

- Installation and model pull require external network.
- Future proof must disable cloud features and verify localhost binding.
- Model cache and logs must be treated as local artifacts and cleaned if requested.

### llama.cpp

Classification: `VIABLE`

Evidence:

- Official server docs state `llama-server` defaults to `127.0.0.1:8080`.
- Server docs describe schema-constrained JSON response support.
- Grammar docs describe JSON/GBNF constrained output.

Fit:

- Strong isolation and structured-output controls are possible.
- Good lower-level control over host, port, context, and grammar.

Constraints:

- Requires build or binary sourcing and manual GGUF model download.
- More operator steps and more places to misconfigure.
- Docker path is unsuitable because Docker daemon is unavailable.

### LM Studio

Classification: `NOT_RECOMMENDED`

Evidence:

- Official docs support Apple Silicon Macs and structured output through local server endpoints.
- Official docs also include GUI chat, model management, MCP/tool integrations, local server features, embeddings, and document chat.

Fit:

- Capable runtime on this machine.

Constraints:

- Broader app surface than necessary.
- GUI/server state and logs increase retention review.
- Tool, MCP, document, and retrieval features must be manually excluded.
- Less suitable than Ollama for a narrow, auditable one-request proof.

## Selected Runtime

Selected runtime:

`Ollama`

Selected installation path:

`brew install ollama`

Selected execution style:

Foreground CLI server only, bound to `127.0.0.1:11434`, with cloud disabled for the proof.

Planned runtime identity verification:

- `ollama --version`
- `ollama list`
- `curl -sS http://127.0.0.1:11434/api/tags | jq .`
- `lsof -nP -iTCP:11434 -sTCP:LISTEN`

Selected because it is the smallest operational surface that satisfies local-only execution, structured JSON output, Apple Silicon compatibility, clear model cache location, no provider SDK requirement, and straightforward uninstall.

References:

- Ollama macOS docs: `https://docs.ollama.com/macos`
- Ollama FAQ: `https://docs.ollama.com/faq`
- Ollama generate API: `https://docs.ollama.com/api/generate`
- Ollama API introduction: `https://docs.ollama.com/api/introduction`
- Homebrew formula metadata: `https://formulae.brew.sh/formula/ollama`

## Model Candidate Comparison

### qwen2.5:1.5b

Classification: `RECOMMENDED`

- Exact model tag: `qwen2.5:1.5b`
- Ollama tag digest observed in library metadata: `65ec06548149`
- Family: Qwen2.5 instruct
- Parameter size: 1.5B
- Approximate download size: 986 MB
- Context window listed by Ollama: 32K
- Input: text
- License/use note: Ollama page states all Qwen2.5 models except 3B and 72B are Apache 2.0.
- Structured-output suitability: Qwen2.5 model notes explicitly mention structured output, especially JSON.
- External network: required only to pull model
- Tool behavior: no tools supplied by S009 proof
- Suitability: best balance of small footprint and structured-output capability

### llama3.2:3b

Classification: `VIABLE`

- Exact model tag: `llama3.2:3b`
- Ollama tag digest observed in library metadata: `a80c4f17acd5`
- Parameter size: 3B
- Approximate download size: 2.0 GB
- Context window listed by Ollama: 128K
- Input: text
- Suitability: stronger instruction following than many tiny models, but larger than needed for first proof
- Constraint: larger memory and disk use than `qwen2.5:1.5b`

### gemma3:1b

Classification: `VIABLE`

- Exact model tag: `gemma3:1b`
- Approximate download size: 815 MB
- Context window listed by Ollama: 32K
- Input: text
- Suitability: small and resource-friendly
- Constraint: not selected because Qwen2.5 documentation is more directly aligned to structured JSON output for this proof

Smaller fallback:

`qwen2.5:0.5b`

- Digest observed in library metadata: `a8b0c5157701`
- Approximate download size: 398 MB
- Use only if the selected primary model cannot be downloaded or loaded safely.
- Lower expected reliability for S009 structured contract compliance.

## Selected Model

Primary model:

`qwen2.5:1.5b`

Selected for:

- small enough for 16 GB RAM and 87 GiB free disk
- structured-output suitability
- 32K context capacity, though S009.04 should cap at 4096 for first proof
- no provider account requirement
- no external execution requirement after download
- Apache 2.0 license note in Ollama model page

Expected footprint:

- Model download: about 986 MB
- Conservative total first-install footprint: under 5 GB including runtime, model cache, manifest, and logs
- Expected RAM class: small local model, target under 6 GB for one bounded proof
- Expected install time: short to moderate, depending on network

## Local-Only Isolation Design

Future S009.04 must enforce:

- localhost binding only: `127.0.0.1:11434`
- no public interface
- no custom domain
- no tunnel
- no inbound internet exposure
- no tool use
- no shell access granted to the model
- no filesystem tools granted to the model
- no browser tools
- no email or calendar tools
- no database tools
- no retrieval
- no embeddings
- no vector database
- no persistent conversation memory
- no production data
- no unrestricted repository access
- fixed static Stafford Media source snapshot only
- one request at a time
- maximum two attempts
- model unloaded after request where supported
- process can be stopped immediately
- cache location known: `~/.ollama/models`
- logs location known: `~/.ollama/logs`
- uninstall/removal paths known

Distinction:

- Model weights stored locally are allowed after explicit operator approval.
- Conversation memory, StaffordOS memory, business state, and cross-workspace memory remain prohibited.

## Network Authority Plan

Installation/download network:

- Required once for Homebrew installation unless the formula is already cached.
- Required once for `ollama pull qwen2.5:1.5b`.
- No paid model credits or provider account should be used.

Model execution network:

- Must be local only.
- The future proof adapter may call only `http://127.0.0.1:11434`.
- It must not call `https://ollama.com/api`, OpenAI, Anthropic, Google, or any external service.

Future verification:

- `lsof -nP -iTCP:11434 -sTCP:LISTEN` must show localhost only.
- `curl -sS http://127.0.0.1:11434/api/tags | jq .` must list only local models.
- No public `0.0.0.0` or `*` listener may be accepted.
- The proof should work after external network is disabled where practical.
- Only `qwen2.5:1.5b` should be made available to the proof adapter.

## Data-Retention Plan

Expected local storage:

- Homebrew runtime files under Homebrew-managed locations.
- Model weights under `~/.ollama/models`.
- Ollama config under `~/.ollama`.
- Ollama logs under `~/.ollama/logs`.
- Temporary Homebrew/model download files during installation.

Requirements:

- Disable cloud features with `OLLAMA_NO_CLOUD=1` for the proof process or `disable_ollama_cloud` in `~/.ollama/server.json`.
- Do not use the desktop chat UI.
- Do not use `ollama launch` integrations.
- Do not use tools, web search, retrieval, embeddings, or document chat.
- Do not include secrets, production data, Professional data, Personal data, customer data, merchant data, payment data, employer data, family data, or private memory in the request.
- Use only static Stafford Media fixture source summaries.
- Use `keep_alive: "0"` in the future model request where supported to unload after response.
- Confirm logs do not contain prohibited input before retaining proof artifacts.
- Cleanup must use `ollama rm qwen2.5:1.5b` and, if full runtime removal is authorized, `brew uninstall ollama`.

If future retention behavior differs from this plan, S009.04 must stop.

## Planned Installation Procedure

All commands in this section are PLANNED, NOT EXECUTED.

1. Pre-install resource check:

```zsh
df -h /
```

```zsh
vm_stat
```

2. Runtime installation:

```zsh
brew install ollama
```

3. Runtime version verification:

```zsh
ollama --version
```

4. Model download:

```zsh
ollama pull qwen2.5:1.5b
```

5. Model identity verification:

```zsh
ollama show qwen2.5:1.5b
```

6. Cache-location verification:

```zsh
ls -ld ~/.ollama ~/.ollama/models
```

7. Localhost-only process start:

```zsh
OLLAMA_NO_CLOUD=1 OLLAMA_HOST=127.0.0.1:11434 ollama serve
```

8. Listener verification from another terminal:

```zsh
lsof -nP -iTCP:11434 -sTCP:LISTEN
```

9. Safe local model-list check:

```zsh
curl -sS http://127.0.0.1:11434/api/tags | jq .
```

10. Process stop:

```zsh
pkill -f "ollama serve"
```

11. Model removal:

```zsh
ollama rm qwen2.5:1.5b
```

12. Runtime uninstall:

```zsh
brew uninstall ollama
```

13. Residual-file inspection:

```zsh
ls -ld ~/.ollama ~/Library/Application\ Support/Ollama ~/Library/Caches/ollama 2>/dev/null
```

14. Full residual cleanup only after explicit operator confirmation:

```zsh
rm -rf ~/.ollama
```

15. Rollback verification:

```zsh
command -v ollama
```

```zsh
lsof -nP -iTCP:11434 -sTCP:LISTEN
```

## Planned Verification Procedure

All commands in this section are PLANNED, NOT EXECUTED.

Future S009.04B must verify:

- runtime command exists
- runtime version is recorded
- model tag and digest are recorded
- process owner is Ross
- listener is `127.0.0.1:11434`
- no public listener exists
- cloud features are disabled
- no tools are attached
- no retrieval or embeddings are used
- model cache location is known
- fixed Stafford Media static source snapshot is the only input
- S009.03 structural guard runs before S009.01 semantic validation
- invalid output fails closed
- process stops cleanly
- cleanup path works

## Planned Cleanup and Uninstall Procedure

All commands are PLANNED, NOT EXECUTED.

Preferred cleanup:

```zsh
pkill -f "ollama serve"
```

```zsh
ollama rm qwen2.5:1.5b
```

Full runtime cleanup:

```zsh
brew uninstall ollama
```

Residual inspection:

```zsh
ls -ld ~/.ollama ~/Library/Application\ Support/Ollama ~/Library/Caches/ollama 2>/dev/null
```

Delete residual Ollama data only after confirming no other local Ollama assets should remain:

```zsh
rm -rf ~/.ollama
```

No production, database, identity, Stripe, ShopiFixer, Abando, provider-account, or deployment rollback is required for S009.04A because no installation occurred.

## Installation Authority Gate

Ross must explicitly approve before Codex:

- installs Ollama
- downloads `qwen2.5:1.5b`
- starts `ollama serve`
- opens any local listener
- creates or changes any local environment setting or Ollama config
- creates a runtime-specific S009.04 adapter
- invokes the model

Approval packet:

- Runtime: Ollama
- Model: `qwen2.5:1.5b`
- Approximate model download: 986 MB
- Approximate total footprint: under 5 GB
- Expected RAM class: small local model, target under 6 GB
- Expected installation time: short to moderate depending on network
- Installation network: Homebrew and Ollama model pull
- Execution network: localhost only
- Cleanup path: `ollama rm qwen2.5:1.5b`, `brew uninstall ollama`, optional residual deletion
- Main risks: public listener, cloud feature misconfiguration, logs retaining input, model output failing validation, resource pressure

Recommendation:

Proceed to S009.04B only after Ross approves the exact installation and model download plan.

## S009.04 Resumption Evidence

S009.04 may not resume until S009.04B returns:

- runtime command path
- runtime version
- model name and exact tag or digest
- process owner
- listening address
- listener protocol
- external-network requirement
- cloud disabled proof
- tool capability disabled proof
- retrieval disabled proof
- persistence disabled or bounded proof
- model-cache location
- successful bounded local health check
- successful stop/restart check
- no production data supplied
- no secrets supplied
- rollback path verified

Do not claim S009.04 is unblocked before this evidence exists.

## Risk Review

| Risk | Likelihood | Impact | Mitigation | Stop condition | Rollback action |
|---|---|---|---|---|---|
| Disk exhaustion | Low | Medium | Keep first model under 2 GB and footprint under 5 GB | Free disk would fall below 70 GiB | Remove model and uninstall runtime |
| Memory pressure | Medium | Medium | Use 1.5B model and 4096 context | Swap or frontend instability increases | Stop server and remove model if needed |
| Thermal or CPU load | Medium | Low | One request at a time, max two attempts | Machine becomes unstable or noisy for sustained period | Stop server |
| Public listener exposure | Low | High | Bind to `127.0.0.1`; verify with `lsof` | Listener shows `0.0.0.0` or `*` | Stop server immediately |
| Telemetry or cloud behavior | Medium | High | Use `OLLAMA_NO_CLOUD=1`; verify logs where possible | Cloud remains enabled or unclear | Stop and block S009.04 |
| Hidden external calls | Low | High | Disable cloud; run local endpoint only | Any external execution call observed | Stop and block |
| Model cache growth | Medium | Low | Pull one model only | Additional unapproved model appears | Remove unapproved model |
| Incompatible architecture | Low | Medium | Use Apple Silicon-supported runtime | Runtime cannot run arm64 locally | Uninstall |
| License restrictions | Low | Medium | Prefer Qwen2.5 1.5B based on Apache 2.0 note | License terms conflict with intended use | Remove model and reassess |
| Structured JSON failure | Medium | Medium | Use `format` or schema and validator gate | Output fails contract twice | Preserve failure and stop |
| Hallucination | Medium | Medium | Validator rejects unsupported claims | Unsupported claim appears | Block output |
| Process remains active | Medium | Low | Foreground server and explicit stop | Listener remains after stop | Kill process |
| Accidental production data use | Low | High | Static fixture input only | Any production/customer data enters prompt | Stop and discard attempt |
| Accidental `ross-llm` retrieval/memory merge | Low | High | Do not use `ross-llm` runtime or memory | Retrieval, pgvector, or memory appears in path | Stop and block |

## Selected Next Mission

Selected next mission:

`S009_04B_INSTALL_AND_CERTIFY_SELECTED_LOCAL_MODEL_RUNTIME`

Evidence-backed reason:

- This Mac is capable of a small local model proof.
- No runtime currently exists.
- Ollama plus `qwen2.5:1.5b` is narrow, resource-safe, and compatible with the S009.03 adapter boundary.
- Installation requires explicit operator approval before proceeding.

Expected outcome:

- Install and certify Ollama and `qwen2.5:1.5b` locally.
- Prove localhost-only operation and disabled cloud/tool/retrieval behavior.
- Return the evidence required before S009.04 can resume.

## External Source Index

External references used for this planning mission:

- Ollama macOS requirements and file locations: `https://docs.ollama.com/macos`
- Ollama FAQ for localhost binding, cloud disabling, model storage, and local prompt handling: `https://docs.ollama.com/faq`
- Ollama generate API structured output and `keep_alive`: `https://docs.ollama.com/api/generate`
- Ollama API default local base URL: `https://docs.ollama.com/api/introduction`
- Ollama list/show APIs: `https://docs.ollama.com/api/tags`, `https://docs.ollama.com/api-reference/show-model-details`
- Ollama model library Qwen2.5 tags: `https://ollama.com/library/qwen2.5/tags`
- Ollama model library Llama 3.2 tags: `https://ollama.com/library/llama3.2/tags`
- Ollama model library Gemma 3: `https://www.ollama.com/library/gemma3`
- Homebrew Ollama formula metadata: `https://formulae.brew.sh/formula/ollama`
- llama.cpp server docs: `https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md`
- llama.cpp grammar docs: `https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md`
- LM Studio requirements and structured output docs: `https://www.lmstudio.ai/docs/app/system-requirements`, `https://beta.lmstudio.ai/docs/developer/openai-compat/structured-output`

## Files Changed

Added:

- `staffordos/architecture/S009_04A_LOCAL_MODEL_RUNTIME_SELECTION_AND_INSTALLATION_PLAN.md`
- `staffordos/architecture/S009_04A_LOCAL_MODEL_RUNTIME_SELECTION_AND_INSTALLATION_PLAN.json`

Modified:

- none

## Validation

Validation completed before local commit:

- JSON artifact validates with `jq -e`.
- `git diff --check` passes for the two S009.04A artifacts.
- No application build or route probe was required because this mission created documentation only and changed no route or runtime code.

## Commit Gate

Commit gate requirement:

- Stage only the two authorized S009.04A documentation artifacts.
- Exclude all preexisting unrelated modified and untracked files.
- Commit locally with `S009 plan local model runtime authority`.
- Do not push.

## Rollback

Rollback requires only:

`git revert <S009.04A commit SHA>`

No runtime, model, application, database, identity, Stripe, ShopiFixer, Abando, provider-account, or deployment rollback is required because installation was forbidden and not performed.
