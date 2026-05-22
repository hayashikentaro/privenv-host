import { createAuditId, createAuditRecord } from "../audit/index.js";
import type { AuditRecord } from "../audit/index.js";
import { FIXTURE_HOST_CONFIG } from "../config/index.js";
import type { HostConfig } from "../config/index.js";
import { findCapability } from "../manifest/index.js";
import { validateCapabilityExecutionPolicy } from "../policy/index.js";
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
  hostConfig?: HostConfig;
  fixtureSecrets?: RedactionFixture[];
}): RuntimeResult {
  const auditId = createAuditId();
  const hostConfig = input.hostConfig ?? FIXTURE_HOST_CONFIG;
  const guestExecutionPolicy = validateGuestRequestDoesNotCarryExecution(input.request);

  if (!guestExecutionPolicy.allowed) {
    const audit = createAuditRecord({
      auditId,
      request: input.request,
      decision: "denied",
      status: "denied",
      errorCode: "policy.guest_execution_fields_denied"
    });

    return {
      audit,
      response: {
        requestId: input.request.id,
        type: "effect.response",
        ok: false,
        error: {
          code: "policy.guest_execution_fields_denied",
          message: guestExecutionPolicy.reason ?? "EffectRequest must reference a capabilityId, not command execution details."
        },
        auditId
      }
    };
  }

  const capability = findCapability(hostConfig, input.request.capabilityId);

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
          message: "Capability is not declared in the Host config."
        },
        auditId
      }
    };
  }

  const policy = validateCapabilityExecutionPolicy(capability);
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

interface GuestRequestPolicyDecision {
  allowed: boolean;
  reason?: string;
}

function validateGuestRequestDoesNotCarryExecution(request: EffectRequest): GuestRequestPolicyDecision {
  const params = request.params;
  if (!params) {
    return { allowed: true };
  }

  const deniedFields = ["command", "program", "args", "argv", "shell", "env", "timeout", "timeoutMs"];
  const present = deniedFields.find((field) => Object.prototype.hasOwnProperty.call(params, field));

  if (present) {
    return {
      allowed: false,
      reason: `EffectRequest params must not include execution field "${present}". Use capabilityId only.`
    };
  }

  return { allowed: true };
}
