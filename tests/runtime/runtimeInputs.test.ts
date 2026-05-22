import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadHostRuntimeInputs } from "../../src/runtime/index.js";

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "privenv-host-runtime-inputs-"));
}

test("fixture/demo fallback is explicit when config and vault are missing", async () => {
  const inputs = await loadHostRuntimeInputs({ cwd: await tempDir(), allowFixtureFallback: true });

  assert.equal(inputs.fallbackMode, "fixture-config-and-vault");
  assert.ok(inputs.vault);
});

test("missing vault is not silently replaced when Host config exists", async () => {
  const dir = await tempDir();
  await writeFile(
    join(dir, "privenv.host.json"),
    JSON.stringify({
      version: "0.1",
      capabilities: [
        {
          id: "cmd.npm.test",
          kind: "command",
          description: "Run npm test",
          command: { program: "npm", args: ["test"] },
          env: [{ name: "DATABASE_URL", source: "secret", exposedToGuest: false }],
          timeoutMs: 30000,
          redactionPolicy: "default"
        }
      ]
    }),
    "utf8"
  );

  const inputs = await loadHostRuntimeInputs({ cwd: dir, allowFixtureFallback: true });

  assert.equal(inputs.fallbackMode, "none");
  assert.equal(inputs.vault, undefined);
});

test("loads local Host vault when present", async () => {
  const dir = await tempDir();
  await mkdir(join(dir, ".privenv"));
  await writeFile(
    join(dir, ".privenv", "vault.json"),
    JSON.stringify({
      version: "0.1",
      secrets: {
        DATABASE_URL: { value: "fixture-db-url", classification: "secret" }
      }
    }),
    "utf8"
  );

  const inputs = await loadHostRuntimeInputs({ cwd: dir, allowFixtureFallback: true });

  assert.equal(inputs.vault?.get("DATABASE_URL"), "fixture-db-url");
  assert.equal(inputs.vault?.getClassification?.("DATABASE_URL"), "secret");
});

test("normal mode does not use fixture config or fixture vault when files are missing", async () => {
  const inputs = await loadHostRuntimeInputs({ cwd: await tempDir(), allowFixtureFallback: false });

  assert.equal(inputs.fallbackMode, "none");
  assert.deepEqual(inputs.hostConfig.capabilities, []);
  assert.equal(inputs.vault, undefined);
});
