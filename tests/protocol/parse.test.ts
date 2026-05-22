import assert from "node:assert/strict";
import test from "node:test";
import { parseEffectRequest, ProtocolParseError } from "../../src/protocol/index.js";

test("parses a valid EffectRequest", () => {
  const request = parseEffectRequest(
    JSON.stringify({
      id: "req_001",
      type: "effect.request",
      capabilityId: "cmd.npm.test",
      params: {
        cwd: "/workspace/project"
      },
      metadata: {
        guestName: "codex",
        guestRunId: "run_abc",
        reason: "run fixture test"
      }
    })
  );

  assert.equal(request.id, "req_001");
  assert.equal(request.type, "effect.request");
  assert.equal(request.capabilityId, "cmd.npm.test");
  assert.equal(request.metadata?.guestName, "codex");
});

test("rejects invalid protocol JSON", () => {
  assert.throws(() => parseEffectRequest("{"), ProtocolParseError);
});

test("rejects non-effect requests", () => {
  assert.throws(
    () =>
      parseEffectRequest(
        JSON.stringify({
          id: "req_002",
          type: "secret.request",
          name: "DEPLOY_TOKEN"
        })
      ),
    ProtocolParseError
  );
});
