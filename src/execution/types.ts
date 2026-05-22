import type { HostConfigCapability, HostConfigCommand } from "../config/index.js";

export interface ResolvedExecutionContext {
  capability: HostConfigCapability;
  command: HostConfigCommand;
  env: Record<string, string>;
  timeoutMs: number;
  redactionPolicy: "default";
}

export interface VaultLookup {
  get(name: string): string | undefined;
  getClassification?(name: string): string | undefined;
}
