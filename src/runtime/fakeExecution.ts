import type { ResolvedExecutionContext } from "../execution/index.js";
import type { ExecutionMode } from "./executionMode.js";

export interface FakeExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function fakeExecute(context: ResolvedExecutionContext, executionMode: ExecutionMode): FakeExecutionResult {
  // TODO: Replace with approved Host-side execution in a future implementation.
  // This intentionally does not spawn a shell, mutate process.env, or read process.env.
  if (executionMode !== "simulate") {
    throw new Error("fakeExecute only supports simulate mode.");
  }

  if (context.capability.id === "cmd.fixture.leaky") {
    return {
      exitCode: 0,
      stdout: "fake stdout contains fixture_secret_value_123\n",
      stderr: "fake stderr contains test_only_token_do_not_use\n"
    };
  }

  if (context.capability.id === "cmd.fixture.vaulted") {
    return {
      exitCode: 0,
      stdout: `fake execution received ${Object.keys(context.env).length} injected env value(s) internally\n`,
      stderr: ""
    };
  }

  return {
    exitCode: 0,
    stdout: `fake execution completed for ${context.capability.id}\n`,
    stderr: ""
  };
}
