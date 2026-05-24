import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runCli } from "../../src/cli/index.js";

async function invokeCli(input: string, options?: { command?: "run" | "demo-run"; flags?: string[]; cwd?: string }) {
  return runCli({
    args: [options?.command ?? "run", ...(options?.flags ?? [])],
    cwd: options?.cwd ?? process.cwd(),
    stdin: input
  });
}

async function invokeManifest(options?: { cwd?: string }) {
  return runCli({
    args: ["manifest"],
    cwd: options?.cwd ?? process.cwd(),
    stdin: ""
  });
}

async function invokeValidate(options?: { cwd?: string }) {
  return runCli({
    args: ["validate"],
    cwd: options?.cwd ?? process.cwd(),
    stdin: ""
  });
}

async function invokeDoctor(options?: { cwd?: string }) {
  return runCli({
    args: ["doctor"],
    cwd: options?.cwd ?? process.cwd(),
    stdin: ""
  });
}

function readAuditLog(cwd: string): Array<Record<string, unknown>> {
  const path = join(cwd, ".privenv", "audit.log.jsonl");
  return readFileSync(path, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
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

test("run does not use fixture fallback", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-run-no-fallback-"));
  const child = await invokeCli(
    JSON.stringify({
      id: "req_cli_no_fallback",
      type: "effect.request",
      capabilityId: "cmd.npm.test"
    }),
    { command: "run", cwd }
  );

  assert.equal(child.exitCode, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.requestId, "req_cli_no_fallback");
  assert.equal(response.ok, false);
  assert.equal(response.error.code, "policy.unknown_capability");
});

test("run defaults to simulate", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-run-simulate-default-"));
  writeHostConfigWithRequiredEnv(cwd);
  mkdirSync(join(cwd, ".privenv"));
  writeFileSync(
    join(cwd, ".privenv", "vault.json"),
    JSON.stringify({ version: "0.1", secrets: { DATABASE_URL: { value: "fixture-db-url", classification: "secret" } } }),
    "utf8"
  );

  const child = await invokeCli(
    JSON.stringify({ id: "req_run_sim_default", type: "effect.request", capabilityId: "cmd.needs.db" }),
    { command: "run", cwd }
  );

  assert.equal(child.exitCode, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.ok, true);
  const [audit] = readAuditLog(cwd);
  assert.equal(audit.executionMode, "simulate");
  assert.equal(audit.simulated, true);
});

test("demo-run defaults to simulate", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-demo-simulate-default-"));
  const child = await invokeCli(
    JSON.stringify({ id: "req_demo_sim_default", type: "effect.request", capabilityId: "cmd.npm.test" }),
    { command: "demo-run", cwd }
  );

  assert.equal(child.exitCode, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.ok, true);
  const [audit] = readAuditLog(cwd);
  assert.equal(audit.executionMode, "simulate");
  assert.equal(audit.simulated, true);
});

test("--simulate works", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-simulate-flag-"));
  const child = await invokeCli(
    JSON.stringify({ id: "req_sim_flag", type: "effect.request", capabilityId: "cmd.npm.test" }),
    { command: "demo-run", flags: ["--simulate"], cwd }
  );

  assert.equal(child.exitCode, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.ok, true);
  const [audit] = readAuditLog(cwd);
  assert.equal(audit.executionMode, "simulate");
  assert.equal(audit.simulated, true);
});

test("--execute returns execution.not_implemented", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-execute-flag-"));
  const child = await invokeCli(
    JSON.stringify({ id: "req_execute_flag", type: "effect.request", capabilityId: "cmd.npm.test" }),
    { command: "demo-run", flags: ["--execute"], cwd }
  );

  assert.equal(child.exitCode, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.ok, false);
  assert.equal(response.error.code, "execution.not_implemented");
  const [audit] = readAuditLog(cwd);
  assert.equal(audit.executionMode, "execute");
  assert.equal(audit.simulated, false);
});

test("demo-run can use fixture fallback", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-demo-fallback-"));
  const child = await invokeCli(
    JSON.stringify({
      id: "req_cli_demo",
      type: "effect.request",
      capabilityId: "cmd.fixture.leaky"
    }),
    { command: "demo-run", cwd }
  );

  assert.equal(child.exitCode, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.requestId, "req_cli_demo");
  assert.equal(response.ok, true);
  assert.match(response.result.stdout, /\[REDACTED\]/);
  assert.match(response.result.stderr, /\[REDACTED\]/);
  assert.doesNotMatch(JSON.stringify(response), /fixture_secret_value_123|test_only_token_do_not_use/);
});

test("normal run with required env and missing vault fails safely", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-missing-vault-"));
  writeHostConfigWithRequiredEnv(cwd);

  const child = await invokeCli(
    JSON.stringify({
      id: "req_cli_missing_vault",
      type: "effect.request",
      capabilityId: "cmd.needs.db"
    }),
    { command: "run", cwd }
  );

  assert.equal(child.exitCode, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.requestId, "req_cli_missing_vault");
  assert.equal(response.ok, false);
  assert.equal(response.error.code, "execution.unresolved_env");
  assert.match(response.error.message, /DATABASE_URL/);
  assert.doesNotMatch(JSON.stringify(response), /fixture_secret_value_123|fixture-db-url|test_only_token_do_not_use/);
});

test("CLI returns error EffectResponse for invalid protocol", async () => {
  const child = await invokeCli(JSON.stringify({ id: "req_cli_bad", type: "secret.request", name: "DEPLOY_TOKEN" }));

  assert.equal(child.exitCode, 1);
  const response = JSON.parse(child.stdout);
  assert.equal(response.requestId, "unknown");
  assert.equal(response.type, "effect.response");
  assert.equal(response.ok, false);
  assert.equal(response.error.code, "protocol.parse_error");
});

test("run can load local Host config and vault", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-local-vault-"));
  mkdirSync(join(cwd, ".privenv"));
  writeHostConfigWithRequiredEnv(cwd);
  writeFileSync(
    join(cwd, ".privenv", "vault.json"),
    JSON.stringify({ version: "0.1", secrets: { DATABASE_URL: { value: "fixture-db-url", classification: "secret" } } }),
    "utf8"
  );

  const child = await invokeCli(
    JSON.stringify({ id: "req_cli_local_vault", type: "effect.request", capabilityId: "cmd.needs.db" }),
    { command: "run", cwd }
  );

  assert.equal(child.exitCode, 0);
  const response = JSON.parse(child.stdout);
  assert.equal(response.ok, true);
  assert.doesNotMatch(JSON.stringify(response), /fixture-db-url/);
});

test("manifest command works with fixture config", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-manifest-fixture-"));
  const child = await invokeManifest({ cwd });

  assert.equal(child.exitCode, 0);
  const manifest = JSON.parse(child.stdout);
  assert.equal(manifest.version, "0.1");
  assert.equal(manifest.capabilities.some((capability: { id: string }) => capability.id === "cmd.npm.test"), true);
  assert.doesNotMatch(child.stdout, /fixture_secret_value_123|test_only_token_do_not_use|fixture-db-url/);
});

test("manifest command works with privenv.host.json and does not require vault", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-manifest-config-"));
  writeHostConfigWithRequiredEnv(cwd);

  const child = await invokeManifest({ cwd });

  assert.equal(child.exitCode, 0);
  const manifest = JSON.parse(child.stdout);
  assert.equal(manifest.capabilities[0].id, "cmd.needs.db");
  assert.equal(manifest.capabilities[0].env[0].name, "DATABASE_URL");
  assert.equal(manifest.capabilities[0].env[0].exposedToGuest, false);
  assert.doesNotMatch(child.stdout, /fixture-db-url|postgres:\/\/|fixture_secret_value_123|test_only_token_do_not_use/);
});

test("manifest command returns structured error for invalid config", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-manifest-invalid-"));
  writeFileSync(
    join(cwd, "privenv.host.json"),
    JSON.stringify({
      version: "0.1",
      capabilities: [
        {
          id: "cmd.bad",
          kind: "command",
          description: "Bad config",
          command: { program: "npm", args: ["test"] },
          env: [{ name: "DATABASE_URL", source: "secret", exposedToGuest: true }],
          timeoutMs: 30000,
          redactionPolicy: "default"
        }
      ]
    }),
    "utf8"
  );

  const child = await invokeManifest({ cwd });

  assert.equal(child.exitCode, 1);
  const response = JSON.parse(child.stdout);
  assert.equal(response.ok, false);
  assert.equal(response.error.code, "manifest.config_error");
  assert.doesNotMatch(child.stdout, /fixture_secret_value_123|test_only_token_do_not_use/);
});

test("run writes safe audit JSONL records", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-audit-success-"));
  mkdirSync(join(cwd, ".privenv"));
  writeHostConfigWithRequiredEnv(cwd);
  writeFileSync(
    join(cwd, ".privenv", "vault.json"),
    JSON.stringify({ version: "0.1", secrets: { DATABASE_URL: { value: "fixture-db-url", classification: "secret" } } }),
    "utf8"
  );

  const child = await invokeCli(
    JSON.stringify({ id: "req_cli_audit_success", type: "effect.request", capabilityId: "cmd.needs.db" }),
    { command: "run", cwd }
  );

  assert.equal(child.exitCode, 0);
  const records = readAuditLog(cwd);
  assert.equal(records.length, 1);
  assert.equal(records[0].requestId, "req_cli_audit_success");
  assert.equal(records[0].capabilityId, "cmd.needs.db");
  assert.equal(typeof records[0].timestamp, "string");
  assert.equal(records[0].executionMode, "simulate");
  assert.equal(records[0].simulated, true);
  assert.deepEqual(records[0].envNames, ["DATABASE_URL"]);
  assert.doesNotMatch(JSON.stringify(records[0]), /fixture-db-url|fixture_secret_value_123|test_only_token_do_not_use/);
});

test("denied requests are audited", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-audit-denied-"));
  const child = await invokeCli(
    JSON.stringify({ id: "req_cli_audit_denied", type: "effect.request", capabilityId: "cmd.npm.test" }),
    { command: "run", cwd }
  );

  assert.equal(child.exitCode, 0);
  const records = readAuditLog(cwd);
  assert.equal(records.length, 1);
  assert.equal(records[0].decision, "denied");
  assert.equal(records[0].status, "denied");
  assert.equal(records[0].errorCode, "policy.unknown_capability");
});

test("manifest command does not create audit log", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-manifest-no-audit-"));
  writeHostConfigWithRequiredEnv(cwd);

  const child = await invokeManifest({ cwd });

  assert.equal(child.exitCode, 0);
  assert.equal(existsSync(join(cwd, ".privenv", "audit.log.jsonl")), false);
});

test("validate succeeds with valid config and vault", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-validate-valid-"));
  writeHostConfigWithRequiredEnv(cwd);
  mkdirSync(join(cwd, ".privenv"));
  writeFileSync(
    join(cwd, ".privenv", "vault.json"),
    JSON.stringify({ version: "0.1", secrets: { DATABASE_URL: { value: "fixture-db-url", classification: "secret" } } }),
    "utf8"
  );

  const child = await invokeValidate({ cwd });

  assert.equal(child.exitCode, 0);
  const result = JSON.parse(child.stdout);
  assert.equal(result.ok, true);
  assert.equal(result.type, "validation.result");
  assert.deepEqual(result.config, { exists: true, valid: true });
  assert.deepEqual(result.vault, { exists: true, valid: true });
  assert.equal(result.capabilities[0].id, "cmd.needs.db");
  assert.equal(result.capabilities[0].valid, true);
  assert.deepEqual(result.capabilities[0].envNames, ["DATABASE_URL"]);
  assert.deepEqual(result.capabilities[0].missingEnvNames, []);
  assert.doesNotMatch(child.stdout, /fixture-db-url|fixture_secret_value_123|test_only_token_do_not_use/);
});

test("validate reports missing config", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-validate-missing-config-"));

  const child = await invokeValidate({ cwd });

  assert.equal(child.exitCode, 1);
  const result = JSON.parse(child.stdout);
  assert.equal(result.ok, false);
  assert.equal(result.config.exists, false);
  assert.equal(result.config.valid, false);
  assert.match(result.config.error, /Missing privenv\.host\.json/);
});

test("validate reports missing vault entries by env name only", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-validate-missing-env-"));
  writeHostConfigWithRequiredEnv(cwd);
  mkdirSync(join(cwd, ".privenv"));
  writeFileSync(
    join(cwd, ".privenv", "vault.json"),
    JSON.stringify({ version: "0.1", secrets: {} }),
    "utf8"
  );

  const child = await invokeValidate({ cwd });

  assert.equal(child.exitCode, 1);
  const result = JSON.parse(child.stdout);
  assert.equal(result.ok, false);
  assert.deepEqual(result.capabilities[0].envNames, ["DATABASE_URL"]);
  assert.deepEqual(result.capabilities[0].missingEnvNames, ["DATABASE_URL"]);
  assert.match(child.stdout, /DATABASE_URL/);
  assert.doesNotMatch(child.stdout, /fixture-db-url|fixture_secret_value_123|test_only_token_do_not_use/);
});

test("validate rejects invalid config", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-validate-invalid-config-"));
  writeFileSync(
    join(cwd, "privenv.host.json"),
    JSON.stringify({
      version: "0.1",
      capabilities: [
        {
          id: "cmd.bad",
          kind: "command",
          description: "Bad config",
          command: { program: "npm", args: ["test"] },
          env: [{ name: "DATABASE_URL", source: "secret", exposedToGuest: true }],
          timeoutMs: 30000,
          redactionPolicy: "default"
        }
      ]
    }),
    "utf8"
  );

  const child = await invokeValidate({ cwd });

  assert.equal(child.exitCode, 1);
  const result = JSON.parse(child.stdout);
  assert.equal(result.ok, false);
  assert.equal(result.config.valid, false);
  assert.match(result.config.error, /exposedToGuest/);
});

test("validate rejects invalid vault", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-validate-invalid-vault-"));
  writeHostConfigWithRequiredEnv(cwd);
  mkdirSync(join(cwd, ".privenv"));
  writeFileSync(join(cwd, ".privenv", "vault.json"), JSON.stringify({ version: "9.9", secrets: {} }), "utf8");

  const child = await invokeValidate({ cwd });

  assert.equal(child.exitCode, 1);
  const result = JSON.parse(child.stdout);
  assert.equal(result.ok, false);
  assert.equal(result.vault.exists, true);
  assert.equal(result.vault.valid, false);
  assert.match(result.vault.error, /version/);
});

test("doctor output never contains fixture secret values", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-doctor-safe-"));
  writeHostConfigWithRequiredEnv(cwd);
  mkdirSync(join(cwd, ".privenv"));
  writeFileSync(
    join(cwd, ".privenv", "vault.json"),
    JSON.stringify({ version: "0.1", secrets: { DATABASE_URL: { value: "fixture-db-url", classification: "secret" } } }),
    "utf8"
  );

  const child = await invokeDoctor({ cwd });

  assert.equal(child.exitCode, 0);
  assert.match(child.stdout, /Host config: OK/);
  assert.match(child.stdout, /Vault: OK/);
  assert.match(child.stdout, /Real execution: not implemented/);
  assert.match(child.stdout, /Mode: simulate only/);
  assert.doesNotMatch(child.stdout, /fixture-db-url|fixture_secret_value_123|test_only_token_do_not_use/);
});

test("duplicate capability IDs are reported", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-validate-duplicate-"));
  writeFileSync(
    join(cwd, "privenv.host.json"),
    JSON.stringify({
      version: "0.1",
      capabilities: [
        {
          id: "cmd.duplicate",
          kind: "command",
          description: "First duplicate",
          command: { program: "npm", args: ["test"] },
          env: [],
          timeoutMs: 30000,
          redactionPolicy: "default"
        },
        {
          id: "cmd.duplicate",
          kind: "command",
          description: "Second duplicate",
          command: { program: "npm", args: ["test"] },
          env: [],
          timeoutMs: 30000,
          redactionPolicy: "default"
        }
      ]
    }),
    "utf8"
  );

  const child = await invokeValidate({ cwd });

  assert.equal(child.exitCode, 1);
  const result = JSON.parse(child.stdout);
  assert.equal(result.ok, false);
  assert.equal(result.capabilities.length, 2);
  assert.equal(result.capabilities.every((capability: { valid: boolean }) => capability.valid === false), true);
  assert.match(child.stdout, /Duplicate capability id/);
});

test("command policy violations are reported", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "privenv-host-cli-validate-policy-"));
  writeFileSync(
    join(cwd, "privenv.host.json"),
    JSON.stringify({
      version: "0.1",
      capabilities: [
        {
          id: "cmd.bad.policy",
          kind: "command",
          description: "Blocked command",
          command: { program: "curl", args: ["https://example.invalid"] },
          env: [],
          timeoutMs: 30000,
          redactionPolicy: "default"
        }
      ]
    }),
    "utf8"
  );

  const child = await invokeValidate({ cwd });

  assert.equal(child.exitCode, 1);
  const result = JSON.parse(child.stdout);
  assert.equal(result.ok, false);
  assert.equal(result.capabilities[0].valid, false);
  assert.match(child.stdout, /not in allowlist|denied/i);
});
