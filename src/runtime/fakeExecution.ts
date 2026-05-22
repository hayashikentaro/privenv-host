import type { ManifestCapability } from "../manifest/types.js";

export interface FakeExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function fakeExecuteCapability(capability: ManifestCapability): FakeExecutionResult {
  // TODO: Replace with approved Host-side execution in a future implementation.
  // This intentionally does not spawn a shell or read process.env.
  if (capability.id === "cmd.fixture.leaky") {
    return {
      exitCode: 0,
      stdout: "fake stdout contains fixture_secret_value_123\n",
      stderr: "fake stderr contains test_only_token_do_not_use\n"
    };
  }

  return {
    exitCode: 0,
    stdout: `fake execution completed for ${capability.id}\n`,
    stderr: ""
  };
}
