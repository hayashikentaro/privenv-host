import assert from "node:assert/strict";
import test from "node:test";
import { createAuditId, createAuditRecord } from "../../src/audit/index.js";
import { FIXTURE_SECRET_VALUES } from "../fixtures/secrets.js";

test("audit records capability IDs and never raw fixture secret values", () => {
  const audit = createAuditRecord({
    auditId: createAuditId(),
    request: {
      id: "req_001",
      capabilityId: "cmd.npm.test",
      metadata: {
        guestName: "codex",
        guestRunId: "run_abc"
      }
    },
    decision: "approved",
    status: "success",
    exitCode: 0,
    redactions: [
      {
        stream: "stdout",
        count: 1,
        reason: "secret"
      }
    ]
  });

  const auditText = JSON.stringify(audit);

  assert.match(auditText, /cmd\.npm\.test/);

  for (const secret of FIXTURE_SECRET_VALUES) {
    assert.doesNotMatch(auditText, new RegExp(secret));
  }
});
