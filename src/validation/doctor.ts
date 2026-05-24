import type { ValidationResult } from "./types.js";

export function formatDoctor(result: ValidationResult): string {
  const validCapabilities = result.capabilities.filter((capability) => capability.valid).length;
  const missingEnvNames = [...new Set(result.capabilities.flatMap((capability) => capability.missingEnvNames))];
  const lines = [
    `Host config: ${result.config.exists && result.config.valid ? "OK" : "NOT OK"}`,
    `Vault: ${!result.vault.exists ? "MISSING" : result.vault.valid ? "OK" : "NOT OK"}`,
    `Capabilities: ${validCapabilities} valid`,
    `Missing env: ${missingEnvNames.length === 0 ? "none" : missingEnvNames.join(", ")}`,
    "Real execution: not implemented",
    "Mode: simulate only"
  ];

  if (result.warnings.length > 0) {
    lines.push("Warnings:");
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  return `${lines.join("\n")}\n`;
}
