export class ConfigLoadError extends Error {
  readonly code = "config.load_error";
}

export class ConfigValidationError extends Error {
  readonly code = "config.validation_error";
}
