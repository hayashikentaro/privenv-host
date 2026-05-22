# MVP Scope

The MVP is documentation-first and Host-side.

`privenv-host` is an AI-era replacement for `.env` on the Host side. It defines how trusted Host code can keep secrets away from untrusted Guest agents while still allowing approved effects.

## In Scope

- project-local Host config skeleton using `privenv.host.json`

- secret vault concept
- safe manifest generation
- effect capability IDs
- env injection at execution time
- stdout and stderr redaction
- audit logging
- Phase 1 stdio JSON request/response protocol

## Out of Scope

- runtime implementation in the initial documentation pass
- full OS sandbox implementation
- generic AI agent runtime
- external API gateway in MVP
- production vault integration in MVP
- Phase 2 Unix domain socket implementation
- Guest SDK implementation

## Phase 1

Phase 1 defines stdio JSON request/response.

The Guest sends an `EffectRequest`. The Host validates the request, executes an approved effect, redacts output, writes an audit log, and returns an `EffectResponse`.

## Phase 2

Phase 2 may add Unix domain socket transport.

The protocol should remain transport-independent where practical, so the same request and response shapes can be reused.

## Manifest Requirements

`privenv.host.json` is Host-owned configuration. Guests read generated safe manifests, not Host config directly.

Manifests are safe for Guest consumption. They may include:

- capability IDs
- descriptions
- command names and fixed arguments where safe
- required environment variable names
- policy hints

Manifests must not include:

- secret values
- raw `.env` contents
- OAuth tokens
- SSH private keys
- production credentials
- PII

## Non-Goal Reminder

The MVP is not a complete sandbox. It is a Host-side secret and effect boundary with documented protocol, redaction, and audit principles.
