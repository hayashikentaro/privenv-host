import assert from "node:assert/strict";
import test from "node:test";
import { validateCommandAllowlist } from "../../src/policy/index.js";

test("allows static npm commands", () => {
  assert.equal(validateCommandAllowlist({ program: "npm", args: ["test"] }).allowed, true);
  assert.equal(validateCommandAllowlist({ program: "npm", args: ["run", "lint"] }).allowed, true);
  assert.equal(validateCommandAllowlist({ program: "npm", args: ["run", "typecheck"] }).allowed, true);
});

test("denies explicitly forbidden commands", () => {
  assert.equal(validateCommandAllowlist({ program: "rm", args: ["-rf", "."] }).allowed, false);
  assert.equal(validateCommandAllowlist({ program: "curl", args: ["https://example.test"] }).allowed, false);
  assert.equal(validateCommandAllowlist({ program: "wget", args: ["https://example.test"] }).allowed, false);
  assert.equal(validateCommandAllowlist({ program: "ssh", args: ["example.test"] }).allowed, false);
  assert.equal(validateCommandAllowlist({ program: "git", args: ["push"] }).allowed, false);
});
