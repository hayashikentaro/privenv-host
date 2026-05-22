import type { HostConfigCapability } from "../config/index.js";
import { ExecutionContextResolutionError } from "./errors.js";
import type { ResolvedExecutionContext, VaultLookup } from "./types.js";

export function resolveExecutionContext(input: {
  capability: HostConfigCapability;
  vault: VaultLookup;
}): ResolvedExecutionContext {
  const env: Record<string, string> = {};

  for (const reference of input.capability.env) {
    const value = input.vault.get(reference.name);
    if (value === undefined) {
      throw new ExecutionContextResolutionError(reference.name);
    }
    env[reference.name] = value;
  }

  return {
    capability: input.capability,
    command: input.capability.command,
    env,
    timeoutMs: input.capability.timeoutMs,
    redactionPolicy: input.capability.redactionPolicy
  };
}
