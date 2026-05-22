import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isJsonObject } from "../types/json.js";
import { VaultLoadError, VaultValidationError } from "./errors.js";
import type { Vault, VaultSecret, VaultSecretClassification } from "./types.js";

export const VAULT_FILE_PATH = ".privenv/vault.json";

export async function loadVaultFromCwd(cwd: string = process.cwd()): Promise<Vault | undefined> {
  const path = join(cwd, VAULT_FILE_PATH);

  try {
    return await loadVaultFile(path);
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }
    throw error;
  }
}

export async function loadVaultFile(path: string): Promise<Vault> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (isMissingFileError(error)) {
      throw error;
    }
    throw new VaultLoadError("Vault file must be readable JSON.");
  }

  return validateVault(parsed);
}

export function validateVault(value: unknown): Vault {
  if (!isJsonObject(value)) {
    throw new VaultValidationError("Vault must be a JSON object.");
  }

  if (value.version !== "0.1") {
    throw new VaultValidationError('Vault version must be "0.1".');
  }

  if (!isJsonObject(value.secrets)) {
    throw new VaultValidationError("Vault secrets must be an object.");
  }

  const secrets: Record<string, VaultSecret> = {};
  for (const [name, secret] of Object.entries(value.secrets)) {
    secrets[name] = validateVaultSecret(secret, name);
  }

  return {
    version: "0.1",
    secrets
  };
}

function validateVaultSecret(value: unknown, name: string): VaultSecret {
  if (!isJsonObject(value)) {
    throw new VaultValidationError(`Vault secret ${name} must be an object.`);
  }

  if (typeof value.value !== "string") {
    throw new VaultValidationError(`Vault secret ${name}.value must be a string.`);
  }

  if (!isClassification(value.classification)) {
    throw new VaultValidationError(`Vault secret ${name}.classification is invalid.`);
  }

  return {
    value: value.value,
    classification: value.classification
  };
}

function isClassification(value: unknown): value is VaultSecretClassification {
  return value === "secret" || value === "pii" || value === "token";
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
