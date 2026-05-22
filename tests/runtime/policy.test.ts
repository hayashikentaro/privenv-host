import assert from "node:assert/strict";
import test from "node:test";
import { commandEquals, validateCapabilityExecutionPolicy, validateCommandAllowlist } from "../../src/policy/index.js";

function capability(command: { program: string; args: string[] }) {
  return {
    id: "cmd.fixture.policy",
    kind: "command" as const,
    description: "Policy fixture capability.",
    command,
    env: [],
    timeoutMs: 30_000,
    redactionPolicy: "default" as const
  };
}

test("allows exact static npm command matches", () => {
  assert.equal(validateCommandAllowlist({ program: "npm", args: ["test"] }).allowed, true);
  assert.equal(validateCommandAllowlist({ program: "npm", args: ["run", "lint"] }).allowed, true);
  assert.equal(validateCommandAllowlist({ program: "npm", args: ["run", "typecheck"] }).allowed, true);
});

test("denies commands that only partially match the allowlist", () => {
  assert.equal(validateCommandAllowlist({ program: "npm", args: ["test", "--", "--watch"] }).allowed, false);
  assert.equal(validateCommandAllowlist({ program: "npm", args: ["run", "lint", "--", "--fix"] }).allowed, false);
});

test("denies explicitly forbidden commands", () => {
  assert.equal(validateCommandAllowlist({ program: "rm", args: ["-rf", "."] }).allowed, false);
  assert.equal(validateCommandAllowlist({ program: "curl", args: ["https://example.test"] }).allowed, false);
  assert.equal(validateCommandAllowlist({ program: "wget", args: ["https://example.test"] }).allowed, false);
  assert.equal(validateCommandAllowlist({ program: "ssh", args: ["example.test"] }).allowed, false);
  assert.equal(validateCommandAllowlist({ program: "git", args: ["push"] }).allowed, false);
});

test("validates capability-bound timeout and command policy", () => {
  assert.equal(validateCapabilityExecutionPolicy(capability({ program: "npm", args: ["test"] })).allowed, true);
  assert.equal(validateCapabilityExecutionPolicy({ ...capability({ program: "npm", args: ["test"] }), timeoutMs: 0 }).allowed, false);
  assert.equal(validateCapabilityExecutionPolicy(capability({ program: "curl", args: ["https://example.test"] })).allowed, false);
});

test("compares command definitions without concatenating command strings", () => {
  assert.equal(commandEquals({ program: "npm", args: ["test"] }, { program: "npm", args: ["test"] }), true);
  assert.equal(commandEquals({ program: "npm", args: ["test", "--watch"] }, { program: "npm", args: ["test"] }), false);
});
