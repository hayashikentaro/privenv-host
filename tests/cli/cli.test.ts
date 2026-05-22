import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const CLI_PATH = join(process.cwd(), "dist/src/cli/index.js");

function runCli(input: string, options?: { command?: "run" | "demo-run"; cwd?: string }) {
  return spawnSync(process.execPath, [CLI_PATH, options?.command ?? "run"], {
    cwd: options?.cwd ?? process.cwd(),
    input,
    encoding: "utf8"
  });
}

function writeHostConfigWithRequiredEnv(cwd: string): void {
  writeFileSync(
    join(cwd, "privenv.host.json"),
    JSON.stringify({
      version: "0.1",
      capabilities: [
        {
          id: "cmd.needs.db",
          kind: "command",
          description: "Needs database URL",
          command: { program: "npm", args: ["test"] },
          env: [{ name: "DATABASE_URL", source: "secret", exposedToGuest: false }],
          timeoutMs: 30000,
          redactionPolicy: "default"
        }
      ]
    }),
    "utf8"
  );
}

test("run does not use fixture fallback", () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-run-no-fallback-"));
  const child = runCli(
    JSON.stringify({
      id: "req_cli_no_fallback",
      type: "effect.request",
      capabilityId: "cmd.npm.test"
    }),
    { command: "run", cwd }
  );

  assert.equal(child.status, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.requestId, "req_cli_no_fallback");
  assert.equal(response.ok, false);
  assert.equal(response.error.code, "policy.unknown_capability");
});

test("demo-run can use fixture fallback", () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-demo-fallback-"));
  const child = runCli(
    JSON.stringify({
      id: "req_cli_demo",
      type: "effect.request",
      capabilityId: "cmd.fixture.leaky"
    }),
    { command: "demo-run", cwd }
  );

  assert.equal(child.status, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.requestId, "req_cli_demo");
  assert.equal(response.ok, true);
  assert.match(response.result.stdout, /\[REDACTED\]/);
  assert.match(response.result.stderr, /\[REDACTED\]/);
  assert.doesNotMatch(JSON.stringify(response), /fixture_secret_value_123|test_only_token_do_not_use/);
});

test("normal run with required env and missing vault fails safely", () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-missing-vault-"));
  writeHostConfigWithRequiredEnv(cwd);

  const child = runCli(
    JSON.stringify({
      id: "req_cli_missing_vault",
      type: "effect.request",
      capabilityId: "cmd.needs.db"
    }),
    { command: "run", cwd }
  );

  assert.equal(child.status, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.requestId, "req_cli_missing_vault");
  assert.equal(response.ok, false);
  assert.equal(response.error.code, "execution.unresolved_env");
  assert.match(response.error.message, /DATABASE_URL/);
  assert.doesNotMatch(JSON.stringify(response), /fixture_secret_value_123|fixture-db-url|test_only_token_do_not_use/);
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

test("run can load local Host config and vault", () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-local-vault-"));
  mkdirSync(join(cwd, ".privenv"));
  writeHostConfigWithRequiredEnv(cwd);
  writeFileSync(
    join(cwd, ".privenv", "vault.json"),
    JSON.stringify({
      version: "0.1",
      secrets: {
        DATABASE_URL: { value: "fixture-db-url", classification: "secret" }
      }
    }),
    "utf8"
  );

  const child = runCli(
    JSON.stringify({
      id: "req_cli_local_vault",
      type: "effect.request",
      capabilityId: "cmd.needs.db"
    }),
    { command: "run", cwd }
  );

  assert.equal(child.status, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.ok, true);
  assert.doesNotMatch(JSON.stringify(response), /fixture-db-url/);
});
