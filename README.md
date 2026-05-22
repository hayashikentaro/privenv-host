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

Phase 1 uses stdio JSON request/response. Phase 2 may add a Unix domain socket transport. Neither transport is implemented yet; this repository currently documents the protocol and security model.

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
- [MVP Scope](docs/mvp-scope.md)
- [Test Strategy](docs/test-strategy.md)
- [Security Principles](docs/security-principles.md)

## License

Apache-2.0
