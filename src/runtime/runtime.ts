import { createAuditId, createAuditRecord } from "../audit/index.js";
import type { AuditRecord } from "../audit/index.js";
import { FIXTURE_HOST_CONFIG } from "../config/index.js";
import type { HostConfig } from "../config/index.js";
import { ExecutionContextResolutionError, resolveExecutionContext } from "../execution/index.js";
import type { VaultLookup } from "../execution/index.js";
import { findCapability } from "../manifest/index.js";
import { validateCapabilityExecutionPolicy } from "../policy/index.js";
import type { EffectRequest, EffectResponse } from "../protocol/index.js";
import { FIXTURE_SECRETS, redactStreams } from "../redact/index.js";
import type { RedactionFixture } from "../redact/index.js";
import { fakeExecute } from "./fakeExecution.js";

export interface RuntimeResult {
  response: EffectResponse;
  audit: AuditRecord;
}

export function handleEffectRequest(input: {
  request: EffectRequest;
  hostConfig?: HostConfig;
  vault?: VaultLookup;
  fixtureSecrets?: RedactionFixture[];
}): RuntimeResult {
  const auditId = createAuditId();
  const hostConfig = input.hostConfig ?? FIXTURE_HOST_CONFIG;
  const vault = input.vault;
  const guestExecutionPolicy = validateGuestRequestDoesNotCarryExecution(input.request);

  if (!guestExecutionPolicy.allowed) {
    const audit = createAuditRecord({
      auditId,
      request: input.request,
      decision: "denied",
      status: "denied",
      errorCode: "policy.guest_execution_fields_denied"
    });

    return deniedResponse(input.request.id, auditId, audit, "policy.guest_execution_fields_denied", guestExecutionPolicy.reason ?? "EffectRequest must reference a capabilityId, not command execution details.");
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

    return deniedResponse(input.request.id, auditId, audit, "policy.unknown_capability", "Capability is not declared in the Host config.");
  }

  const envNames = capability.env.map((entry) => entry.name);
  const classifications = capability.env
    .map((entry) => vault?.getClassification?.(entry.name))
    .filter((value): value is string => typeof value === "string");
  const policy = validateCapabilityExecutionPolicy(capability);
  if (!policy.allowed) {
    const audit = createAuditRecord({
      auditId,
      request: input.request,
      decision: "denied",
      status: "denied",
      errorCode: "policy.command_denied",
      envNames,
      classifications
    });

    return deniedResponse(input.request.id, auditId, audit, "policy.command_denied", policy.reason ?? "Command is denied by Host policy.");
  }

  let context;
  try {
    if (!vault && capability.env.length > 0) {
      throw new ExecutionContextResolutionError(capability.env[0]?.name ?? "unknown");
    }
    context = resolveExecutionContext({
      capability,
      vault: vault ?? {
        get() {
          return undefined;
        }
      }
    });
  } catch (error) {
    const code = error instanceof ExecutionContextResolutionError ? error.code : "execution.context_resolution_failed";
    const message = error instanceof Error ? error.message : "Unable to resolve execution context.";
    const audit = createAuditRecord({
      auditId,
      request: input.request,
      decision: "denied",
      status: "error",
      errorCode: code,
      envNames,
      classifications
    });

    return deniedResponse(input.request.id, auditId, audit, code, message);
  }

  const execution = fakeExecute(context);
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
    redactions: redacted.redactions,
    envNames,
    classifications
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

function deniedResponse(
  requestId: string,
  auditId: string,
  audit: AuditRecord,
  code: string,
  message: string
): RuntimeResult {
  return {
    audit,
    response: {
      requestId,
      type: "effect.response",
      ok: false,
      error: { code, message },
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
