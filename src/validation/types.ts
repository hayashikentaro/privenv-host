export interface CapabilityValidationResult {
  id: string;
  valid: boolean;
  envNames: string[];
  missingEnvNames: string[];
  errors: string[];
  warnings: string[];
}

export interface ValidationResult {
  ok: boolean;
  type: "validation.result";
  config: {
    exists: boolean;
    valid: boolean;
    error?: string;
  };
  vault: {
    exists: boolean;
    valid: boolean;
    error?: string;
  };
  capabilities: CapabilityValidationResult[];
  warnings: string[];
}
