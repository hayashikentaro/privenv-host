import { FIXTURE_HOST_CONFIG, loadHostConfigFromCwd } from "../config/index.js";
import type { HostConfig } from "../config/index.js";
import { FIXTURE_VAULT } from "../execution/index.js";
import type { VaultLookup } from "../execution/index.js";
import { loadVaultFromCwd, vaultLookupFromVault } from "../vault/index.js";

export interface HostRuntimeInputs {
  hostConfig: HostConfig;
  vault?: VaultLookup;
  fallbackMode: "none" | "fixture-config" | "fixture-config-and-vault";
}

export async function loadHostRuntimeInputs(input: {
  cwd?: string;
  allowFixtureFallback: boolean;
}): Promise<HostRuntimeInputs> {
  const cwd = input.cwd ?? process.cwd();
  const hostConfig = await loadHostConfigFromCwd(cwd);
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
