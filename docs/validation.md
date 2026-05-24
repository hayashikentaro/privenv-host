# Validation

`privenv-host` provides Host-side setup checks before any real execution exists.

Validation is safe to run before generating or handing a manifest to a Guest. It inspects Host-owned configuration and optional Host-owned vault metadata, but it must never print vault values, raw env values, tokens, PII, or fixture secret values.

## Commands

```sh
privenv-host validate
privenv-host doctor
```

`validate` is machine-readable. It writes JSON to stdout.

`doctor` is human-readable. It writes a short operational summary to stdout.

Neither command writes an audit log for now. Neither command performs command execution.

## validate

`privenv-host validate` checks:

- `privenv.host.json` exists
- Host config JSON shape is valid
- capability IDs are unique
- each capability command passes static Host policy validation
- env references use `exposedToGuest: false`
- Host config contains no obvious secret-like values
- `.privenv/vault.json` shape is valid when present
- required env names have matching vault entries when a vault is present

Example output:

```json
{
  "ok": true,
  "type": "validation.result",
  "config": {
    "exists": true,
    "valid": true
  },
  "vault": {
    "exists": true,
    "valid": true
  },
  "capabilities": [
    {
      "id": "cmd.npm.test",
      "valid": true,
      "envNames": ["DATABASE_URL"],
      "missingEnvNames": [],
      "errors": [],
      "warnings": []
    }
  ],
  "warnings": []
}
```

Missing env entries are reported by env name only. Secret values are never included.

## doctor

`privenv-host doctor` summarizes the same checks for humans:

```text
Host config: OK
Vault: OK
Capabilities: 3 valid
Missing env: none
Real execution: not implemented
Mode: simulate only
```

The doctor output is intentionally terse so it can be pasted into issue reports without disclosing secrets.

## Boundary

`validate` and `doctor` are Host-side commands. The Guest should read generated safe manifests, not Host config, vault files, or audit logs.

These commands do not add passthrough mode. Host supports protected `run`, explicit unsafe/demo `demo-run`, safe `manifest`, and setup inspection through `validate` and `doctor`.
