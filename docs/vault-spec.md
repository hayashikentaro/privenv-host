# Vault Spec

`.privenv/vault.json` is a Host-owned local vault file for development-time secret material.

The Guest must never read this file. Guest-facing manifests, `EffectResponse` JSON, and audit logs must never include vault values.

The MVP vault is plaintext local storage for development only. Encryption, operating-system keychains, and production external vault integrations are future work.

## File Path

```text
.privenv/vault.json
```

Real projects must gitignore `.privenv/`.

## Shape

```json
{
  "version": "0.1",
  "secrets": {
    "DATABASE_URL": {
      "value": "fixture-db-url",
      "classification": "secret"
    }
  }
}
```

## Fields

- `version`: must be `0.1`.
- `secrets`: object keyed by env name.
- `value`: Host-owned secret value.
- `classification`: one of `secret`, `pii`, or `token`.

## Runtime Use

The Host resolves capability env references against the vault during execution context resolution.

```text
HostConfig capability
  -> env references by name
  -> Vault lookup
  -> ResolvedExecutionContext
```

Vault values are materialized inside the Host-internal `ResolvedExecutionContext` only. The values must not be returned to the Guest or written to audit logs.

Audit logs may include env names and classifications. They must not include values.
