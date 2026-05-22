import type { HostManifest, ManifestCapability } from "./types.js";

export const STATIC_CAPABILITIES: ManifestCapability[] = [
  {
    id: "cmd.npm.test",
    kind: "command",
    description: "Run the project test script.",
    command: {
      program: "npm",
      args: ["test"]
    }
  },
  {
    id: "cmd.npm.lint",
    kind: "command",
    description: "Run the project lint script.",
    command: {
      program: "npm",
      args: ["run", "lint"]
    }
  },
  {
    id: "cmd.npm.typecheck",
    kind: "command",
    description: "Run the project typecheck script.",
    command: {
      program: "npm",
      args: ["run", "typecheck"]
    }
  }
];

export const FIXTURE_POLICY_CAPABILITIES: ManifestCapability[] = [
  ...STATIC_CAPABILITIES,
  {
    id: "cmd.fixture.leaky",
    kind: "command",
    description: "Fixture command that emits fixture secrets for redaction tests.",
    command: {
      program: "npm",
      args: ["test"]
    }
  },
  {
    id: "cmd.fixture.denied.curl",
    kind: "command",
    description: "Fixture command that is declared but denied by Host policy.",
    command: {
      program: "curl",
      args: ["https://example.test"]
    }
  }
];

export function createSafeManifest(): HostManifest {
  return {
    version: "0.1",
    capabilities: STATIC_CAPABILITIES
  };
}

export function findCapability(capabilityId: string): ManifestCapability | undefined {
  return FIXTURE_POLICY_CAPABILITIES.find((capability) => capability.id === capabilityId);
}
