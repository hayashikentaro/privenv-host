import type { ManifestCommand } from "../manifest/types.js";

export interface CommandPolicyDecision {
  allowed: boolean;
  reason?: string;
}

const ALLOWED_COMMANDS = new Set(["npm test", "npm run lint", "npm run typecheck"]);
const DENIED_PROGRAMS = new Set(["curl", "wget", "ssh"]);
const DENIED_EXACT_COMMANDS = new Set(["git push", "rm -rf"]);

export function commandToPolicyKey(command: ManifestCommand): string {
  return [command.program, ...command.args].join(" ").trim();
}

export function validateCommandAllowlist(command: ManifestCommand): CommandPolicyDecision {
  const key = commandToPolicyKey(command);

  if (DENIED_PROGRAMS.has(command.program)) {
    return { allowed: false, reason: `Command program "${command.program}" is explicitly denied.` };
  }

  for (const denied of DENIED_EXACT_COMMANDS) {
    if (key === denied || key.startsWith(`${denied} `)) {
      return { allowed: false, reason: `Command "${denied}" is explicitly denied.` };
    }
  }

  if (!ALLOWED_COMMANDS.has(key)) {
    return { allowed: false, reason: `Command "${key}" is not in the static allowlist.` };
  }

  return { allowed: true };
}
