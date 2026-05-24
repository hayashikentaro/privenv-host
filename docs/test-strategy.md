# Test Strategy

Tests must protect the Host/Guest boundary.

## Principles

- Never use real secrets in tests.
- Use fixture secrets only.
- Fixture secrets must be obviously fake.
- Manifests must not contain secret values.
- Logs must redact secret values.
- Audit logs must record capability IDs, not secret values.
- Responses must not expose raw secret values.
- Errors must not expose raw secret values.

## Fixture Secret Examples

Acceptable fixture values:

```text
fixture_secret_value_123
test_only_token_do_not_use
fake_ssh_key_material_for_tests_only
```

Do not use realistic credentials, real token formats, real private keys, or copied production-looking examples.

## Manifest Tests

Manifest tests should verify:

- capability IDs are present
- allowed effects are described
- env names may be present
- env values are absent
- secret values are absent

Example assertion:

```text
manifest contains "DEPLOY_TOKEN"
manifest does not contain "fixture_secret_value_123"
```

## Redaction Tests

Redaction tests should simulate commands that print fixture secrets to stdout and stderr.

Input:

```text
stdout: token=fixture_secret_value_123
stderr: debug=test_only_token_do_not_use
```

Expected output:

```text
stdout: token=[REDACTED]
stderr: debug=[REDACTED]
```

## Audit Log Tests

Audit tests should verify logs record:

- audit ID
- request ID
- capability ID
- Guest metadata when provided
- execution status
- redaction counts

Audit tests should verify logs do not record:

- secret values
- raw `.env` contents
- OAuth tokens
- SSH private keys
- PII

Example audit entry:

```json
{
  "auditId": "audit_001",
  "requestId": "req_001",
  "capabilityId": "cmd.deploy.preview",
  "guest": {
    "name": "codex",
    "runId": "run_abc"
  },
  "status": "success",
  "redactions": [
    {
      "stream": "stdout",
      "count": 1,
      "reason": "secret"
    }
  ]
}
```

The audit entry records `capabilityId`, not secret values.

## Validation Tests

Validation tests should verify valid Host config and vault setup, missing Host config, missing vault entries by env name only, invalid config rejection, invalid vault rejection, duplicate capability IDs, static command policy violations, and that `validate` and `doctor` outputs never contain fixture secret values.

## Vault Tests

Vault tests use fixture values only. They must verify valid vault loading, invalid vault rejection, missing vault safety for required env references, and that responses and audit logs never contain raw vault values.

## CLI Mode Tests

Tests must verify that `run` does not use fixture fallback, `demo-run` can use fixture fallback, and normal mode with required env but missing vault fails with a structured response that contains no raw secret values.

## Audit Persistence Tests

Audit persistence tests must verify JSONL creation, timestamps, denied-request auditing, env names without env values, fixture secret guard behavior, and that `manifest` does not create an audit log.
