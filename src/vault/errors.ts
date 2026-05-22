export class VaultLoadError extends Error {
  readonly code = "vault.load_error";
}

export class VaultValidationError extends Error {
  readonly code = "vault.validation_error";
}
