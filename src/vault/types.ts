export type VaultSecretClassification = "secret" | "pii" | "token";

export interface VaultSecret {
  value: string;
  classification: VaultSecretClassification;
}

export interface Vault {
  version: "0.1";
  secrets: Record<string, VaultSecret>;
}
