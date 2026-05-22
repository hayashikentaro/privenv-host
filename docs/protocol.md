# Protocol

Phase 1 uses stdio JSON request/response. Phase 2 may add a Unix domain socket transport.

This document defines protocol shape only. Runtime code is not implemented yet.

This protocol should later be mirrored in `privenv-guest` so both sides share the same contract.

## Rules

- The Guest sends JSON requests to the Host over stdio.
- The Host sends JSON responses to the Guest over stdio.
- Each request has an `id`.
- Each response includes the matching `requestId`.
- The Guest never receives raw secret values.
- The protocol must not expose `getSecret()`, `getEnv()`, or raw secret-value APIs.

## EffectRequest

TypeScript-like interface:

```ts
interface EffectRequest {
  id: string;
  type: "effect.request";
  capabilityId: string;
  params?: Record<string, unknown>;
  metadata?: {
    guestName?: string;
    guestRunId?: string;
    reason?: string;
  };
}
```

JSON Schema shape:

```json
{
  "type": "object",
  "required": ["id", "type", "capabilityId"],
  "properties": {
    "id": { "type": "string" },
    "type": { "const": "effect.request" },
    "capabilityId": { "type": "string" },
    "params": { "type": "object" },
    "metadata": {
      "type": "object",
      "properties": {
        "guestName": { "type": "string" },
        "guestRunId": { "type": "string" },
        "reason": { "type": "string" }
      }
    }
  },
  "additionalProperties": false
}
```

## EffectResponse

TypeScript-like interface:

```ts
interface EffectResponse {
  requestId: string;
  type: "effect.response";
  ok: boolean;
  result?: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
    redactions?: RedactionSummary[];
  };
  error?: {
    code: string;
    message: string;
  };
  auditId: string;
}

interface RedactionSummary {
  stream: "stdout" | "stderr" | "error";
  count: number;
  reason: "secret" | "sensitive-pattern" | "policy";
}
```

JSON Schema shape:

```json
{
  "type": "object",
  "required": ["requestId", "type", "ok", "auditId"],
  "properties": {
    "requestId": { "type": "string" },
    "type": { "const": "effect.response" },
    "ok": { "type": "boolean" },
    "result": {
      "type": "object",
      "properties": {
        "exitCode": { "type": "number" },
        "stdout": { "type": "string" },
        "stderr": { "type": "string" },
        "redactions": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["stream", "count", "reason"],
            "properties": {
              "stream": { "enum": ["stdout", "stderr", "error"] },
              "count": { "type": "number" },
              "reason": { "enum": ["secret", "sensitive-pattern", "policy"] }
            },
            "additionalProperties": false
          }
        }
      },
      "additionalProperties": false
    },
    "error": {
      "type": "object",
      "required": ["code", "message"],
      "properties": {
        "code": { "type": "string" },
        "message": { "type": "string" }
      },
      "additionalProperties": false
    },
    "auditId": { "type": "string" }
  },
  "additionalProperties": false
}
```

## Example: Request/Response

Guest request:

```json
{
  "id": "req_001",
  "type": "effect.request",
  "capabilityId": "cmd.deploy.preview",
  "params": {
    "cwd": "/workspace/project"
  },
  "metadata": {
    "guestName": "codex",
    "guestRunId": "run_abc",
    "reason": "create preview deployment"
  }
}
```

Host response:

```json
{
  "requestId": "req_001",
  "type": "effect.response",
  "ok": true,
  "result": {
    "exitCode": 0,
    "stdout": "Preview deployment created\nurl=https://preview.example.test\n",
    "stderr": "",
    "redactions": []
  },
  "auditId": "audit_001"
}
```

## Example: stdout/stderr Redaction

If command output contains fixture secret values:

```json
{
  "requestId": "req_002",
  "type": "effect.response",
  "ok": true,
  "result": {
    "exitCode": 0,
    "stdout": "token=[REDACTED]\n",
    "stderr": "debug auth=[REDACTED]\n",
    "redactions": [
      {
        "stream": "stdout",
        "count": 1,
        "reason": "secret"
      },
      {
        "stream": "stderr",
        "count": 1,
        "reason": "secret"
      }
    ]
  },
  "auditId": "audit_002"
}
```

The response reports that redaction occurred. It does not reveal the original values.
