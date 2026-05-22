import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { FIXTURE_SECRETS } from "../redact/index.js";
import type { AuditRecord } from "./types.js";

export const DEFAULT_AUDIT_LOG_PATH = ".privenv/audit.log.jsonl";

export interface AppendAuditRecordOptions {
  cwd?: string;
  path?: string;
  fixtureSecretValues?: string[];
}

export class AuditSerializationError extends Error {
  readonly code = "audit.serialization_error";
}

export async function appendAuditRecord(
  record: AuditRecord,
  options: AppendAuditRecordOptions = {}
): Promise<void> {
  const path = options.path ?? join(options.cwd ?? process.cwd(), DEFAULT_AUDIT_LOG_PATH);
  const serialized = serializeAuditRecord(record, options);

  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${serialized}\n`, "utf8");
}

export function serializeAuditRecord(record: AuditRecord, options: AppendAuditRecordOptions = {}): string {
  const serialized = JSON.stringify(record);
  const fixtureSecretValues = options.fixtureSecretValues ?? FIXTURE_SECRETS.map((secret) => secret.value);

  for (const value of fixtureSecretValues) {
    if (value.length > 0 && serialized.includes(value)) {
      throw new AuditSerializationError("Audit record contains a fixture secret value.");
    }
  }

  return serialized;
}
