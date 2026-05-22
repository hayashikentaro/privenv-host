import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function runCli(input: string) {
  return spawnSync(process.execPath, ["dist/src/cli/index.js", "run"], {
    cwd: process.cwd(),
    input,
    encoding: "utf8"
  });
}

test("CLI returns ok EffectResponse for valid request", () => {
  const child = runCli(JSON.stringify({
    id: "req_cli_ok",
    type: "effect.request",
    capabilityId: "cmd.npm.test"
  }));

  assert.equal(child.status, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.requestId, "req_cli_ok");
  assert.equal(response.type, "effect.response");
  assert.equal(response.ok, true);
});

test("CLI returns error EffectResponse for invalid protocol", () => {
  const child = runCli(JSON.stringify({
    id: "req_cli_bad",
    type: "secret.request",
    name: "DEPLOY_TOKEN"
  }));

  assert.equal(child.status, 1);
  const response = JSON.parse(child.stdout);
  assert.equal(response.requestId, "unknown");
  assert.equal(response.type, "effect.response");
  assert.equal(response.ok, false);
  assert.equal(response.error.code, "protocol.parse_error");
});

test("CLI redacts fixture secrets from fake execution output", () => {
  const child = runCli(JSON.stringify({
    id: "req_cli_redact",
    type: "effect.request",
    capabilityId: "cmd.fixture.leaky"
  }));

  assert.equal(child.status, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.ok, true);
  assert.match(response.result.stdout, /\[REDACTED\]/);
  assert.match(response.result.stderr, /\[REDACTED\]/);
  assert.doesNotMatch(response.result.stdout, /fixture_secret_value_123/);
  assert.doesNotMatch(response.result.stderr, /test_only_token_do_not_use/);
});
