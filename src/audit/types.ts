import type { RedactionSummary } from "../protocol/types.js";

export interface AuditRecord {
  auditId: string;
  timestamp: string;
  requestId: string;
  capabilityId: string;
  guest?: {
    name?: string;
    runId?: string;
  };
  decision: "approved" | "denied";
  status: "success" | "error" | "denied";
  exitCode?: number;
  redactions: RedactionSummary[];
  envNames?: string[];
  classifications?: string[];
  executionMode: "simulate" | "execute";
  simulated: boolean;
  errorCode?: string;
}
