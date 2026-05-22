import type { VaultLookup } from "./types.js";

export const FIXTURE_VAULT_VALUES: Record<string, string> = {
  FIXTURE_TOKEN: "fixture_secret_value_123",
  FIXTURE_SECONDARY_TOKEN: "test_only_token_do_not_use",
  DATABASE_URL: "fixture_database_url_value"
};

export const FIXTURE_VAULT: VaultLookup = {
  get(name: string): string | undefined {
    return FIXTURE_VAULT_VALUES[name];
  }
};
