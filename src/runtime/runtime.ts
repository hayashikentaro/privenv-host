import { createAuditId, createAuditRecord } from "../audit/index.js";
import type { AuditRecord } from "../audit/index.js";
import { findCapability } from "../manifest/index.js";
import { validateCommandAllowlist } from "../policy/index.js";
import type { EffectRequest, EffectResponse } from "../protocol/index.js";
import { FIXTURE_SECRETS, redactStreams } from "../redact/index.js";
import type { RedactionFixture } from "../redact/index.js";
import { fakeExecuteCapability } from "./fakeExecution.js";

export interface RuntimeResult {
  response: EffectResponse;
  audit: AuditRecord;
}

export function handleEffectRequest(input: {
  request: EffectRequest;
  fixtureSecrets?: RedactionFixture[];
}): RuntimeResult {
  const auditId = createAuditId();
  const capability = findCapability(input.request.capabilityId);

  if (!capability) {
    const audit = createAuditRecord({
      auditId,
      request: input.request,
      decision: "denied",
      status: "denied",
      errorCode: "policy.unknown_capability"
    });

    return {
      audit,
      response: {
        requestId: input.request.id,
        type: "effect.response",
        ok: false,
        error: {
          code: "policy.unknown_capability",
          message: "Capability is not declared in the Host manifest."
        },
        auditId
      }
    };
  }

  const policy = validateCommandAllowlist(capability.command);
  if (!policy.allowed) {
    const audit = createAuditRecord({
      auditId,
      request: input.request,
      decision: "denied",
      status: "denied",
      errorCode: "policy.command_denied"
    });

    return {
      audit,
      response: {
        requestId: input.request.id,
        type: "effect.response",
        ok: false,
        error: {
          code: "policy.command_denied",
          message: policy.reason ?? "Command is denied by Host policy."
        },
        auditId
      }
    };
  }

  const execution = fakeExecuteCapability(capability);
  const redacted = redactStreams({
    stdout: execution.stdout,
    stderr: execution.stderr,
    fixtureSecrets: input.fixtureSecrets ?? FIXTURE_SECRETS
  });

  const audit = createAuditRecord({
    auditId,
    request: input.request,
    decision: "approved",
    status: "success",
    exitCode: execution.exitCode,
    redactions: redacted.redactions
  });

  return {
    audit,
    response: {
      requestId: input.request.id,
      type: "effect.response",
      ok: true,
      result: {
        exitCode: execution.exitCode,
        stdout: redacted.stdout,
        stderr: redacted.stderr,
        redactions: redacted.redactions
      },
      auditId
    }
  };
}
