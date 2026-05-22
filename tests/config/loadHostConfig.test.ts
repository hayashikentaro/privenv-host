import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ConfigValidationError, HOST_CONFIG_FILENAME, loadHostConfigFile, loadHostConfigFromCwd } from "../../src/config/index.js";

function validConfig() {
  return {
    version: "0.1",
    capabilities: [
      {
        id: "cmd.npm.test",
        kind: "command",
        description: "Run npm test",
        command: {
          program: "npm",
          args: ["test"]
        },
        env: [
          {
            name: "DATABASE_URL",
            source: "secret",
            exposedToGuest: false
          }
        ],
        timeoutMs: 30000,
        redactionPolicy: "default"
      }
    ]
  };
}

async function writeConfig(config: unknown): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "privenv-host-config-"));
  const path = join(dir, HOST_CONFIG_FILENAME);
  await writeFile(path, JSON.stringify(config), "utf8");
  return path;
}

test("loads valid privenv.host.json", async () => {
  const config = await loadHostConfigFile(await writeConfig(validConfig()));

  assert.equal(config.version, "0.1");
  assert.equal(config.capabilities[0]?.id, "cmd.npm.test");
  assert.equal(config.capabilities[0]?.env[0]?.name, "DATABASE_URL");
});

test("rejects env entries exposed to Guest", async () => {
  const config = validConfig();
  config.capabilities[0]!.env[0]!.exposedToGuest = true;

  await assert.rejects(loadHostConfigFile(await writeConfig(config)), ConfigValidationError);
});

test("rejects config containing obvious secret-like values", async () => {
  const config = validConfig();
  config.capabilities[0]!.description = "token=fixture_secret_value_123";

  await assert.rejects(loadHostConfigFile(await writeConfig(config)), ConfigValidationError);
});

test("missing config falls back to fixture config", async () => {
  const dir = await mkdtemp(join(tmpdir(), "privenv-host-missing-config-"));
  const config = await loadHostConfigFromCwd(dir);

  assert.equal(config.capabilities.some((capability) => capability.id === "cmd.npm.test"), true);
});
