# Trust Model

privenv treats Host and Guest as separate subjects with different trust levels.

## Host

The Host is trusted. It owns secrets and approved effects.

The Host is responsible for:

- loading secret material from local trusted sources
- keeping raw secret values out of Guest-readable data
- deciding whether an effect request is allowed
- injecting secrets only during approved execution
- redacting stdout, stderr, error messages, and logs
- recording audit logs

## Guest

The Guest is untrusted. It may generate useful requests, but it must not be trusted with secrets.

The Guest is allowed to:

- read safe manifests
- choose capability IDs from the manifest
- submit effect requests
- receive redacted effect responses

The Guest is not allowed to:

- read `.env`
- read raw secret stores
- call `getSecret()`
- call `getEnv()`
- receive secret values in manifests, responses, errors, or logs

## Boundary Rule

The Host/Guest boundary is not a convenience abstraction. It is the central security boundary of the project.

Guest-facing APIs must describe capabilities and effects, not secrets. Any API that returns raw secret values to the Guest violates the model.

## Threats

The model assumes the Guest may:

- be controlled by an LLM
- produce malicious or confused requests
- attempt prompt injection
- ask for logs or diagnostics
- try to exfiltrate secrets through command output
- request commands that print environment variables

The Host must therefore redact outputs and record what capability was executed without recording secret values.

## Example: Command Execution With Env Injection

The Guest asks for `cmd.github.list-repos`. The Host maps that capability to a command and injects `GITHUB_TOKEN` only into the child process environment.

```json
{
  "capabilityId": "cmd.github.list-repos",
  "resolvedExecution": {
    "program": "gh",
    "args": ["repo", "list"],
    "env": {
      "GITHUB_TOKEN": "[injected by Host at execution time]"
    }
  }
}
```

The above object is conceptual Host-internal state. It must not be returned to the Guest with the real token.

## Example: Redaction

If a command prints a secret value:

```text
token=fixture_secret_value_123
```

The Host returns:

```text
token=[REDACTED]
```

The audit log records the capability ID and redaction event, not the secret value.
