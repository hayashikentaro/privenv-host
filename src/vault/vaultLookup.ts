import type { VaultLookup } from "../execution/index.js";
import type { Vault } from "./types.js";

export function vaultLookupFromVault(vault: Vault): VaultLookup {
  return {
    get(name: string): string | undefined {
      return vault.secrets[name]?.value;
    },
    getClassification(name: string): string | undefined {
      return vault.secrets[name]?.classification;
    }
  };
}
