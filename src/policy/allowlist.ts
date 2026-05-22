import type { HostConfigCapability, HostConfigCommand } from "../config/index.js";

export interface CommandPolicyDecision {
  allowed: boolean;
  reason?: string;
}

export interface AllowedCommandDefinition {
  program: string;
  args: string[];
}

const ALLOWED_COMMANDS: AllowedCommandDefinition[] = [
  { program: "npm", args: ["test"] },
  { program: "npm", args: ["run", "lint"] },
  { program: "npm", args: ["run", "typecheck"] }
];

const DENIED_PROGRAMS = new Set(["curl", "wget", "ssh"]);
const DENIED_COMMANDS: AllowedCommandDefinition[] = [
  { program: "git", args: ["push"] },
  { program: "rm", args: ["-rf"] }
];

export function validateCapabilityExecutionPolicy(capability: HostConfigCapability): CommandPolicyDecision {
  if (!Number.isInteger(capability.timeoutMs) || capability.timeoutMs <= 0) {
    return { allowed: false, reason: "Capability timeout must be a positive integer." };
  }

  if (!Array.isArray(capability.env)) {
    return { allowed: false, reason: "Capability env must be an array." };
  }

  if (capability.redactionPolicy !== "default") {
    return { allowed: false, reason: "Capability redactionPolicy must be default." };
  }

  return validateCommandAllowlist(capability.command);
}

export function validateCommandAllowlist(command: HostConfigCommand): CommandPolicyDecision {
  if (DENIED_PROGRAMS.has(command.program)) {
    return { allowed: false, reason: `Command program "${command.program}" is explicitly denied.` };
  }

  if (DENIED_COMMANDS.some((denied) => commandStartsWith(command, denied))) {
    return { allowed: false, reason: "Command is explicitly denied by Host policy." };
  }

  if (!ALLOWED_COMMANDS.some((allowed) => commandEquals(command, allowed))) {
    return { allowed: false, reason: "Command does not exactly match the Host allowlist." };
  }

  return { allowed: true };
}

export function commandEquals(command: HostConfigCommand, allowed: AllowedCommandDefinition): boolean {
  return command.program === allowed.program && arrayEquals(command.args, allowed.args);
}

function commandStartsWith(command: HostConfigCommand, denied: AllowedCommandDefinition): boolean {
  return command.program === denied.program && denied.args.every((arg, index) => command.args[index] === arg);
}

function arrayEquals(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
