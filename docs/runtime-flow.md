# Runtime Flow

This document describes the initial Host-side runtime skeleton. It is not a production secret manager and does not implement real command execution.

## Development command

The current vertical slice is exercised with:

```text
echo EFFECT_REQUEST_JSON | npm run dev -- run
```

npm run dev builds the TypeScript skeleton and runs the Phase 1 stdio CLI.

## Flow

```text
Guest request
  ->
Host protocol parsing
  ->
capability validation
  ->
command allowlist validation
  ->
fake execution placeholder
  ->
stdout/stderr redaction
  ->
audit record creation
  ->
EffectResponse JSON
```

## Guest Request

The Guest sends an `EffectRequest` over Phase 1 stdio JSON.

The request names a `capabilityId`. It does not ask for a secret value.

## Host Validation

The Host parses the request and validates:

- the JSON protocol shape
- the capability ID
- the static command allowlist

The skeleton currently allows only:

- `npm test`
- `npm run lint`
- `npm run typecheck`

The skeleton explicitly denies examples such as:

- `rm -rf`
- `curl`
- `wget`
- `ssh`
- `git push`

## Fixture Policy

The skeleton validates capabilityId against a fixture Host policy. Safe manifest generation exposes only normal npm capabilities, while tests may use fixture-only capabilities to exercise denied commands and redaction behavior. Fixture capabilities must not contain secret values.

## Fake Execution

The runtime currently uses a fake execution placeholder. It does not spawn a shell, run arbitrary commands, read `.env`, read `process.env`, or inject real secrets.

TODO comments mark the future location for approved Host-side execution.

## Redaction

The skeleton redacts fixture secrets only. It uses deterministic replacement with:

```text
[REDACTED]
```

This is intentionally limited. Production-ready secret detection is out of scope for the initial skeleton.

## Audit

The Host creates an audit record containing:

- audit ID
- request ID
- capability ID
- Guest metadata when provided
- decision
- status
- exit code when available
- redaction summaries

Audit records must not contain secret values.

## Response

The Host returns an `EffectResponse` JSON object to stdout.

The response may contain redacted stdout and stderr. It must not contain raw secrets.
