import type { EffectRequest, RedactionSummary } from "../protocol/types.js";
import type { AuditRecord } from "./types.js";

let auditCounter = 0;

export function createAuditId(): string {
  auditCounter += 1;
  return `audit_${String(auditCounter).padStart(3, "0")}`;
}

export function createAuditRecord(input: {
  auditId: string;
  request: Pick<EffectRequest, "id" | "capabilityId" | "metadata">;
  decision: AuditRecord["decision"];
  status: AuditRecord["status"];
  exitCode?: number;
  redactions?: RedactionSummary[];
  envNames?: string[];
  classifications?: string[];
  errorCode?: string;
}): AuditRecord {
  return {
    auditId: input.auditId,
    timestamp: new Date().toISOString(),
    requestId: input.request.id,
    capabilityId: input.request.capabilityId,
    guest: {
      name: input.request.metadata?.guestName,
      runId: input.request.metadata?.guestRunId
    },
    decision: input.decision,
    status: input.status,
    exitCode: input.exitCode,
    redactions: input.redactions ?? [],
    envNames: input.envNames ? [...input.envNames] : undefined,
    classifications: input.classifications ? [...input.classifications] : undefined,
    errorCode: input.errorCode
  };
}
