# Host Config Spec

`privenv.host.json` is a project-local Host-owned configuration file.

The Host reads this file. The Guest must not read this file directly. The Guest reads a generated safe manifest derived from this file.

`privenv.host.json` may name environment variables, but it must not contain raw environment values, secrets, tokens, credentials, private keys, or PII.

## File Name

```text
privenv.host.json
```

## Shape

```json
{
  "version": "0.1",
  "capabilities": [
    {
      "id": "cmd.npm.test",
      "kind": "command",
      "description": "Run npm test",
      "command": {
        "program": "npm",
        "args": ["test"]
      },
      "env": [
        {
          "name": "DATABASE_URL",
          "source": "secret",
          "exposedToGuest": false
        }
      ],
      "timeoutMs": 30000,
      "redactionPolicy": "default"
    }
  ]
}
```

## Fields

- `version`: config format version.
- `capabilities`: Host-owned capability definitions.
- `id`: stable capability ID referenced by `EffectRequest.capabilityId`.
- `kind`: currently only `command`.
- `description`: safe human-readable description.
- `command.program`: fixed command program selected by the Host capability.
- `command.args`: fixed command args selected by the Host capability.
- `env`: secret references by environment variable name only.
- `env.name`: environment variable name, not value.
- `env.source`: currently `secret`.
- `env.exposedToGuest`: must be `false`.
- `timeoutMs`: Host execution timeout budget.
- `redactionPolicy`: currently `default`.

## Security Rules

`privenv.host.json` must not contain:

- raw secret values
- raw `.env` contents
- API tokens
- OAuth tokens
- SSH private keys
- PII
- realistic credentials

The Host config may contain `DATABASE_URL` as an env name. It must not contain a database URL value.

## Guest Manifest

The Host may generate a safe Guest-facing manifest from `privenv.host.json`.

The safe manifest may include:

- capability ID
- description
- kind
- command program and fixed args when safe to disclose
- env variable names only

The safe manifest must not include env values, tokens, raw secrets, or credentials.
