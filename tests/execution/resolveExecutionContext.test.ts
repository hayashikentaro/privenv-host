import assert from "node:assert/strict";
import test from "node:test";
import { FIXTURE_HOST_CONFIG } from "../../src/config/index.js";
import { ExecutionContextResolutionError, resolveExecutionContext } from "../../src/execution/index.js";

test("resolves env references through Host vault lookup", () => {
  const capability = FIXTURE_HOST_CONFIG.capabilities.find((item) => item.id === "cmd.fixture.vaulted");
  assert.ok(capability);

  const context = resolveExecutionContext({
    capability,
    vault: {
      get(name) {
        return name === "FIXTURE_TOKEN" ? "fixture_secret_value_123" : undefined;
      }
    }
  });

  assert.equal(context.capability.id, "cmd.fixture.vaulted");
  assert.equal(context.command.program, "npm");
  assert.equal(context.env.FIXTURE_TOKEN, "fixture_secret_value_123");
  assert.equal(context.timeoutMs, 30_000);
  assert.equal(context.redactionPolicy, "default");
});

test("unresolved env references fail safely", () => {
  const capability = FIXTURE_HOST_CONFIG.capabilities.find((item) => item.id === "cmd.fixture.vaulted");
  assert.ok(capability);

  assert.throws(
    () =>
      resolveExecutionContext({
        capability,
        vault: {
          get() {
            return undefined;
          }
        }
      }),
    ExecutionContextResolutionError
  );
});
