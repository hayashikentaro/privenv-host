# Security Principles

Security in privenv starts with a strict Host/Guest boundary.

## Principles

1. Guests never read secrets directly.
2. Guests request effects executed by the Host.
3. The Host owns `.env`, secrets, PII, API tokens, OAuth tokens, and SSH keys.
4. The Host injects secrets only at execution time.
5. The Host redacts stdout, stderr, errors, and logs.
6. The Host writes audit logs for approved and denied effect requests.
7. Guest-visible manifests describe capabilities, not secret values.

## Forbidden Guest APIs

`privenv-host` must not expose the following to the Guest:

- `getSecret()`
- `getEnv()`
- raw secret-value APIs
- raw `.env` readers
- APIs that return OAuth tokens
- APIs that return SSH private keys
- APIs that return PII

## Capability-Based Effects

The Guest should request capabilities by ID. The Host resolves the capability internally.

Good:

```json
{
  "type": "effect.request",
  "id": "req_001",
  "capabilityId": "cmd.deploy.preview"
}
```

Bad:

```json
{
  "type": "secret.request",
  "name": "DEPLOY_TOKEN"
}
```

The bad example asks for a secret. The good example asks for an approved effect.

## Redaction

The Host must redact known secret values and sensitive patterns before returning output to the Guest.

Example response:

```json
{
  "requestId": "req_002",
  "type": "effect.response",
  "ok": true,
  "result": {
    "exitCode": 0,
    "stdout": "Authorization: Bearer [REDACTED]\n",
    "stderr": "",
    "redactions": [
      {
        "stream": "stdout",
        "count": 1,
        "reason": "secret"
      }
    ]
  },
  "auditId": "audit_002"
}
```

## Audit Logging

Audit logs should help answer what happened without revealing secrets.

Audit logs should record:

- request ID
- capability ID
- Guest metadata
- decision
- execution status
- exit code when applicable
- redaction counts

Audit logs must not record:

- secret values
- raw environment values
- raw `.env` contents
- OAuth tokens
- SSH private keys
- PII

## Local Vault

`.privenv/vault.json` is Host-owned plaintext development storage in the MVP. Guests must never read it. Vault values must never appear in manifests, responses, or audit logs. Real projects must gitignore `.privenv/`. Encryption and external vault integrations are future work.

## Fixture Mode

`privenv-host run` must not use fixture config or fixture vault fallback implicitly. `privenv-host demo-run` is the only mode allowed to use fixture fallback, and it is unsafe/demo-only.

## Passthrough

`privenv-host` does not implement passthrough mode. Passthrough is an upper-layer or Guest-side operational mode for situations without an active untrusted Guest boundary. Host-side behavior remains limited to protected `run` and explicit `demo-run`.
