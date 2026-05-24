import { access } from "node:fs/promises";
import { join } from "node:path";
import { HOST_CONFIG_FILENAME, loadHostConfigFile } from "../config/index.js";
import type { HostConfig } from "../config/index.js";
import { validateCapabilityExecutionPolicy } from "../policy/index.js";
import { VAULT_FILE_PATH, loadVaultFile } from "../vault/index.js";
import type { Vault } from "../vault/index.js";
import type { CapabilityValidationResult, ValidationResult } from "./types.js";

export async function validateHostSetup(cwd: string = process.cwd()): Promise<ValidationResult> {
  const configPath = join(cwd, HOST_CONFIG_FILENAME);
  const vaultPath = join(cwd, VAULT_FILE_PATH);
  const configExists = await fileExists(configPath);
  const vaultExists = await fileExists(vaultPath);
  const result: ValidationResult = {
    ok: false,
    type: "validation.result",
    config: {
      exists: configExists,
      valid: false
    },
    vault: {
      exists: vaultExists,
      valid: !vaultExists
    },
    capabilities: [],
    warnings: []
  };

  let config: HostConfig | undefined;
  if (!configExists) {
    result.config.error = "Missing privenv.host.json.";
    result.warnings.push("Host config is missing.");
    return result;
  }

  try {
    config = await loadHostConfigFile(configPath);
    result.config.valid = true;
  } catch (error) {
    result.config.error = safeErrorMessage(error);
    return result;
  }

  let vault: Vault | undefined;
  if (vaultExists) {
    try {
      vault = await loadVaultFile(vaultPath);
      result.vault.valid = true;
    } catch (error) {
      result.vault.valid = false;
      result.vault.error = safeErrorMessage(error);
    }
  }

  result.capabilities = validateCapabilities(config, vault);
  const duplicateIds = findDuplicateIds(config.capabilities.map((capability) => capability.id));
  for (const duplicateId of duplicateIds) {
    const matches = result.capabilities.filter((capability) => capability.id === duplicateId);
    for (const capability of matches) {
      capability.valid = false;
      capability.errors.push("Duplicate capability id.");
    }
  }

  for (const capability of result.capabilities) {
    if (capability.missingEnvNames.length > 0) {
      result.warnings.push(`Capability ${capability.id} is missing env: ${capability.missingEnvNames.join(", ")}.`);
    }
  }

  result.ok = result.config.valid && result.vault.valid && result.capabilities.every((capability) => capability.valid);
  return result;
}

function validateCapabilities(config: HostConfig, vault: Vault | undefined): CapabilityValidationResult[] {
  return config.capabilities.map((capability) => {
    const envNames = capability.env.map((entry) => entry.name);
    const missingEnvNames = envNames.filter((name) => !vault || !vault.secrets[name]);
    const policy = validateCapabilityExecutionPolicy(capability);
    const errors: string[] = [];

    if (!policy.allowed) {
      errors.push(policy.reason ?? "Command policy validation failed.");
    }
    if (missingEnvNames.length > 0) {
      errors.push("Missing vault entries for env names.");
    }

    return {
      id: capability.id,
      valid: errors.length === 0,
      envNames,
      missingEnvNames,
      errors,
      warnings: []
    };
  });
}

function findDuplicateIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }
  return [...duplicates];
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown validation error.";
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
