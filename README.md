# privenv-host

`privenv-host` is the trusted Host-side component of privenv: an AI-era replacement for `.env` that keeps secrets away from untrusted AI development environments.

privenv separates two subjects:

- **Host**: the trusted side. The Host owns `.env`, secrets, PII, API tokens, OAuth tokens, SSH keys, approved effects, redaction, and audit logs.
- **Guest**: the untrusted side. The Guest may be an AI agent, Codex, Claude Code, Cursor agent, LLM runtime, or AI container. The Guest never reads secrets directly.

Core principle:

> Guests never read secrets directly. Guests request effects executed by the Host.

## Initial Scope

`privenv-host` focuses on:

- secret vault concept
- environment injection at execution time
- safe manifest generation
- stdout and stderr redaction
- audit logging
- Phase 1 stdio JSON request/response protocol

Phase 1 uses stdio JSON request/response. Phase 2 may add a Unix domain socket transport. This repository currently contains documentation plus a minimal TypeScript Host-side runtime skeleton for Phase 1.

## Host Responsibilities

The Host:

- stores and resolves secrets
- maps capability IDs to approved effects
- injects secrets only when executing an approved effect
- redacts secret values and sensitive derived values from outputs
- records audit logs
- returns structured responses to the Guest

## Guest Responsibilities

The Guest:

- reads only safe manifests
- selects declared capability IDs
- creates effect requests
- handles redacted effect responses
- never receives raw secrets

`privenv-host` must not expose `getSecret()`, `getEnv()`, or any raw secret-value API to the Guest.

## Documentation

- [Concept](docs/concept.md)
- [Trust Model](docs/trust-model.md)
- [Protocol](docs/protocol.md)
- [Runtime Flow](docs/runtime-flow.md)
- [Execution Context](docs/execution-context.md)
- [Host Config Spec](docs/config-spec.md)
- [Vault Spec](docs/vault-spec.md)
- [MVP Scope](docs/mvp-scope.md)
- [Test Strategy](docs/test-strategy.md)
- [Security Principles](docs/security-principles.md)

## Host Configuration

`privenv.host.json` is a project-local Host-owned configuration file. It may name environment variables, but it must not contain raw environment values or secret values. Guests read generated safe manifests, not the Host config directly.

## Local Vault

`.privenv/vault.json` is a Host-owned plaintext local vault for development. Guests must never read it. The MVP loader uses it only to materialize env values inside Host-internal execution context resolution. Encryption and external vault integrations are future work.

## Runtime Skeleton

The initial TypeScript skeleton includes:

- protocol types matching `docs/protocol.md`
- safe manifest types
- audit record types
- fixture-only redaction utility
- static command allowlist validation
- fake execution placeholder
- `privenv-host run` CLI entry for stdio JSON request/response

The skeleton does not implement production secret management, unrestricted shell execution, external API gateway behavior, Unix domain sockets, or real credential handling.

## License

Apache-2.0
