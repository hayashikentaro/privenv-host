import { access } from "node:fs/promises";
import { join } from "node:path";
import { FIXTURE_HOST_CONFIG, HOST_CONFIG_FILENAME, loadHostConfigFile } from "../config/index.js";
import type { HostConfig } from "../config/index.js";
import { FIXTURE_VAULT } from "../execution/index.js";
import type { VaultLookup } from "../execution/index.js";
import { loadVaultFromCwd, vaultLookupFromVault } from "../vault/index.js";

export interface HostRuntimeInputs {
  hostConfig: HostConfig;
  vault?: VaultLookup;
  fallbackMode: "none" | "fixture-config" | "fixture-config-and-vault";
}

const EMPTY_HOST_CONFIG: HostConfig = {
  version: "0.1",
  capabilities: []
};

export async function loadHostRuntimeInputs(input: {
  cwd?: string;
  allowFixtureFallback: boolean;
}): Promise<HostRuntimeInputs> {
  const cwd = input.cwd ?? process.cwd();
  const hostConfigPath = join(cwd, HOST_CONFIG_FILENAME);
  const hasHostConfig = await fileExists(hostConfigPath);
  const hostConfig = hasHostConfig
    ? await loadHostConfigFile(hostConfigPath)
    : input.allowFixtureFallback
      ? FIXTURE_HOST_CONFIG
      : EMPTY_HOST_CONFIG;
  const vault = await loadVaultFromCwd(cwd);
  const configIsFixture = hostConfig === FIXTURE_HOST_CONFIG;

  if (vault) {
    return {
      hostConfig,
      vault: vaultLookupFromVault(vault),
      fallbackMode: configIsFixture ? "fixture-config" : "none"
    };
  }

  if (input.allowFixtureFallback && configIsFixture) {
    return {
      hostConfig,
      vault: FIXTURE_VAULT,
      fallbackMode: "fixture-config-and-vault"
    };
  }

  return {
    hostConfig,
    vault: undefined,
    fallbackMode: configIsFixture ? "fixture-config" : "none"
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
