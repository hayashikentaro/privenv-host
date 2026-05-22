import assert from "node:assert/strict";
import test from "node:test";
import { handleEffectRequest } from "../../src/runtime/index.js";

test("returns fake structured response for allowed capability", () => {
  const result = handleEffectRequest({
    request: {
      id: "req_001",
      type: "effect.request",
      capabilityId: "cmd.npm.test"
    }
  });

  assert.equal(result.response.requestId, "req_001");
  assert.equal(result.response.type, "effect.response");
  assert.equal(result.response.ok, true);
  assert.equal(result.response.result?.exitCode, 0);
  assert.match(result.response.result?.stdout ?? "", /fake execution completed/);
  assert.equal(result.audit.capabilityId, "cmd.npm.test");
});

test("rejects unknown capabilities before execution", () => {
  const result = handleEffectRequest({
    request: {
      id: "req_002",
      type: "effect.request",
      capabilityId: "cmd.unknown"
    }
  });

  assert.equal(result.response.ok, false);
  assert.equal(result.response.error?.code, "policy.unknown_capability");
  assert.equal(result.audit.decision, "denied");
});

test("rejects declared capabilities with denied commands", () => {
  const result = handleEffectRequest({
    request: {
      id: "req_denied",
      type: "effect.request",
      capabilityId: "cmd.fixture.denied.curl"
    }
  });

  assert.equal(result.response.ok, false);
  assert.equal(result.response.error?.code, "policy.command_denied");
  assert.equal(result.audit.capabilityId, "cmd.fixture.denied.curl");
  assert.equal(result.audit.decision, "denied");
});

test("redacts fixture secrets emitted by fake execution", () => {
  const result = handleEffectRequest({
    request: {
      id: "req_leaky",
      type: "effect.request",
      capabilityId: "cmd.fixture.leaky"
    }
  });

  assert.equal(result.response.ok, true);
  assert.match(result.response.result?.stdout ?? "", /\[REDACTED\]/);
  assert.match(result.response.result?.stderr ?? "", /\[REDACTED\]/);
  assert.doesNotMatch(result.response.result?.stdout ?? "", /fixture_secret_value_123/);
  assert.doesNotMatch(result.response.result?.stderr ?? "", /test_only_token_do_not_use/);
  assert.equal(result.audit.capabilityId, "cmd.fixture.leaky");
  assert.doesNotMatch(JSON.stringify(result.audit), /fixture_secret_value_123|test_only_token_do_not_use/);
});


test("rejects Guest-provided arbitrary command fields", () => {
  const result = handleEffectRequest({
    request: {
      id: "req_arbitrary_command",
      type: "effect.request",
      capabilityId: "cmd.npm.test",
      params: {
        command: "npm test -- --watch"
      }
    }
  });

  assert.equal(result.response.ok, false);
  assert.equal(result.response.error?.code, "policy.guest_execution_fields_denied");
  assert.equal(result.audit.decision, "denied");
});


test("resolves capability from supplied Host config", () => {
  const result = handleEffectRequest({
    hostConfig: {
      version: "0.1",
      capabilities: [
        {
          id: "cmd.custom.test",
          kind: "command",
          description: "Custom test capability.",
          command: {
            program: "npm",
            args: ["test"]
          },
          env: [],
          timeoutMs: 30000,
          redactionPolicy: "default"
        }
      ]
    },
    request: {
      id: "req_custom_config",
      type: "effect.request",
      capabilityId: "cmd.custom.test"
    }
  });

  assert.equal(result.response.ok, true);
  assert.equal(result.audit.capabilityId, "cmd.custom.test");
});
