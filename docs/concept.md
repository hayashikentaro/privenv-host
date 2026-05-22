# Concept

privenv separates trusted Host environments from untrusted Guest environments for AI-era development.

The Host owns secrets and approved effects. The Guest asks for effects. The Guest does not receive secrets.

## Subjects

### Host

The Host is the trusted side. It owns:

- `.env` files and equivalent secret sources
- API tokens
- OAuth tokens
- SSH keys
- PII
- secret resolution
- approved effect execution
- output redaction
- audit logging

The Host may inject secrets into a child process at execution time, but it must not reveal those secret values to the Guest.

### Guest

The Guest is the untrusted side. It may be:

- Codex
- Claude Code
- Cursor agent
- another AI agent
- an LLM runtime
- an AI container

The Guest reads safe manifests and submits effect requests. The Guest never reads `.env` directly and never calls a raw secret API.

## Core Principle

Guests never read secrets directly. Guests request effects executed by the Host.

This means `privenv-host` must not expose:

- `getSecret()`
- `getEnv()`
- raw secret-value APIs
- manifest fields containing secret values
- audit log fields containing secret values

## Example: Manifest Generation

The Host may generate a safe manifest like this:

```json
{
  "version": "0.1",
  "capabilities": [
    {
      "id": "cmd.deploy.preview",
      "kind": "command",
      "description": "Run preview deployment",
      "env": [
        {
          "name": "DEPLOY_TOKEN",
          "source": "secret",
          "exposedToGuest": false
        }
      ],
      "command": {
        "program": "deploy",
        "args": ["preview"]
      }
    }
  ]
}
```

The manifest tells the Guest what it may request. It does not contain `DEPLOY_TOKEN` or any other secret value.

## Example: Effect Request

The Guest requests an approved capability:

```json
{
  "id": "req_001",
  "type": "effect.request",
  "capabilityId": "cmd.deploy.preview",
  "params": {
    "cwd": "/workspace/project"
  }
}
```

The Host decides whether the request is allowed, injects secrets only for execution, redacts outputs, writes an audit log, and returns an effect response.
