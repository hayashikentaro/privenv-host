import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadVaultFile, validateVault, VaultValidationError } from "../../src/vault/index.js";

function validVault() {
  return {
    version: "0.1",
    secrets: {
      DATABASE_URL: {
        value: "fixture-db-url",
        classification: "secret"
      }
    }
  };
}

async function writeVault(vault: unknown): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "privenv-host-vault-"));
  const path = join(dir, "vault.json");
  await writeFile(path, JSON.stringify(vault), "utf8");
  return path;
}

test("loads valid vault file", async () => {
  const vault = await loadVaultFile(await writeVault(validVault()));

  assert.equal(vault.version, "0.1");
  assert.equal(vault.secrets.DATABASE_URL?.value, "fixture-db-url");
  assert.equal(vault.secrets.DATABASE_URL?.classification, "secret");
});

test("rejects invalid vault version", () => {
  assert.throws(() => validateVault({ ...validVault(), version: "0.2" }), VaultValidationError);
});

test("rejects invalid secret shape", () => {
  assert.throws(
    () =>
      validateVault({
        version: "0.1",
        secrets: {
          DATABASE_URL: {
            value: 123,
            classification: "secret"
          }
        }
      }),
    VaultValidationError
  );

  assert.throws(
    () =>
      validateVault({
        version: "0.1",
        secrets: {
          DATABASE_URL: {
            value: "fixture-db-url",
            classification: "public"
          }
        }
      }),
    VaultValidationError
  );
});
