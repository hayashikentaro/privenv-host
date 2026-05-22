import assert from "node:assert/strict";
import test from "node:test";
import { redactStreams, REDACTION_TOKEN } from "../../src/redact/index.js";
import { FIXTURE_SECRETS, FIXTURE_SECRET_VALUES } from "../fixtures/secrets.js";

test("redacts fixture secrets from stdout and stderr", () => {
  const result = redactStreams({
    stdout: `token=${FIXTURE_SECRET_VALUES[0]}\n`,
    stderr: `debug=${FIXTURE_SECRET_VALUES[1]}\n`,
    fixtureSecrets: FIXTURE_SECRETS
  });

  assert.equal(result.stdout, `token=${REDACTION_TOKEN}\n`);
  assert.equal(result.stderr, `debug=${REDACTION_TOKEN}\n`);
  assert.equal(result.redactions.length, 2);
  assert.equal(result.redactions[0]?.stream, "stdout");
  assert.equal(result.redactions[1]?.stream, "stderr");
});
