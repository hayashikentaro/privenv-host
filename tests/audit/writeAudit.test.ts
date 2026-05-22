import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { appendAuditRecord, AuditSerializationError, DEFAULT_AUDIT_LOG_PATH, serializeAuditRecord } from "../../src/audit/index.js";
import type { AuditRecord } from "../../src/audit/index.js";

function auditRecord(overrides: Partial<AuditRecord> = {}): AuditRecord {
  return {
    auditId: "audit_test",
    timestamp: new Date().toISOString(),
    requestId: "req_test",
    capabilityId: "cmd.fixture.vaulted",
    decision: "approved",
    status: "success",
    redactions: [],
    envNames: ["FIXTURE_TOKEN"],
    classifications: ["secret"],
    ...overrides
  };
}

test("audit JSONL file is created", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "privenv-host-audit-"));
  await appendAuditRecord(auditRecord(), { cwd });

  const contents = await readFile(join(cwd, DEFAULT_AUDIT_LOG_PATH), "utf8");
  const parsed = JSON.parse(contents.trim());

  assert.equal(parsed.auditId, "audit_test");
  assert.equal(parsed.capabilityId, "cmd.fixture.vaulted");
});

test("serialized audit includes timestamp and env names but not values", () => {
  const serialized = serializeAuditRecord(auditRecord());
  const parsed = JSON.parse(serialized);

  assert.equal(typeof parsed.timestamp, "string");
  assert.deepEqual(parsed.envNames, ["FIXTURE_TOKEN"]);
  assert.deepEqual(parsed.classifications, ["secret"]);
  assert.doesNotMatch(serialized, /fixture_secret_value_123|test_only_token_do_not_use/);
});

test("audit serialization rejects fixture secret values", () => {
  assert.throws(
    () => serializeAuditRecord(auditRecord({ errorCode: "fixture_secret_value_123" })),
    AuditSerializationError
  );
});
