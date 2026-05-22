import type { HostConfig, HostConfigCapability } from "./types.js";

const DEFAULT_TIMEOUT_MS = 30_000;

function commandCapability(input: {
  id: string;
  description: string;
  program: string;
  args: string[];
  env?: HostConfigCapability["env"];
  timeoutMs?: number;
}): HostConfigCapability {
  return {
    id: input.id,
    kind: "command",
    description: input.description,
    command: {
      program: input.program,
      args: input.args
    },
    env: input.env ?? [],
    timeoutMs: input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    redactionPolicy: "default"
  };
}

export const FIXTURE_HOST_CONFIG: HostConfig = {
  version: "0.1",
  capabilities: [
    commandCapability({
      id: "cmd.npm.test",
      description: "Run the project test script.",
      program: "npm",
      args: ["test"]
    }),
    commandCapability({
      id: "cmd.npm.lint",
      description: "Run the project lint script.",
      program: "npm",
      args: ["run", "lint"]
    }),
    commandCapability({
      id: "cmd.npm.typecheck",
      description: "Run the project typecheck script.",
      program: "npm",
      args: ["run", "typecheck"]
    }),
    commandCapability({
      id: "cmd.fixture.vaulted",
      description: "Fixture command that requires Host vault resolution.",
      program: "npm",
      args: ["test"],
      env: [
        {
          name: "FIXTURE_TOKEN",
          source: "secret",
          exposedToGuest: false
        }
      ]
    }),
    commandCapability({
      id: "cmd.fixture.leaky",
      description: "Fixture command that emits fixture secrets for redaction tests.",
      program: "npm",
      args: ["test"]
    }),
    commandCapability({
      id: "cmd.fixture.denied.curl",
      description: "Fixture command that is declared but denied by Host policy.",
      program: "curl",
      args: ["https://example.test"]
    })
  ]
};
