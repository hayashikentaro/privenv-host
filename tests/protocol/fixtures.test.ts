import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import type { HostManifest } from "../../src/manifest/index.js";
import { parseEffectRequest } from "../../src/protocol/index.js";
import type { EffectResponse, RedactionSummary } from "../../src/protocol/index.js";

const fixtureDir = join(process.cwd(), "tests", "fixtures", "protocol");
const forbiddenGuestExecutionFields = ["command", "program", "args", "argv", "shell", "env", "timeout", "timeoutMs", "secret", "token", "credential"];

const fixtureFiles = [
  "effect-request.valid.json",
  "effect-response.success.json",
  "effect-response.error.json",
  "manifest.valid.json"
];

test("valid EffectRequest fixture parses successfully", () => {
  const raw = readFixtureText("effect-request.valid.json");
  const request = parseEffectRequest(raw);

  assert.equal(request.id, "req_fixture_001");
  assert.equal(request.type, "effect.request");
  assert.equal(request.capabilityId, "cmd.npm.test");
  assert.equal(request.metadata?.guestName, "fixture-guest");
});

test("EffectResponse success fixture matches local protocol shape", () => {
  const response = assertEffectResponse(readFixture("effect-response.success.json"));

  assert.equal(response.ok, true);
  assert.equal(response.type, "effect.response");
  assert.equal(response.result?.exitCode, 0);
});

test("EffectResponse error fixture matches local protocol shape", () => {
  const response = assertEffectResponse(readFixture("effect-response.error.json"));

  assert.equal(response.ok, false);
  assert.equal(response.type, "effect.response");
  assert.equal(response.error?.code, "fixture.error");
});

test("manifest fixture can be treated as safe manifest shape", () => {
  const manifest = assertHostManifest(readFixture("manifest.valid.json"));

  assert.equal(manifest.version, "0.1");
  assert.equal(manifest.capabilities[0]?.id, "cmd.npm.test");
  assert.equal(manifest.capabilities[1]?.env[0]?.exposedToGuest, false);
});

test("protocol fixtures contain no secret-like values", () => {
  for (const file of fixtureFiles) {
    const content = readFixtureText(file);
    assert.doesNotMatch(content, /fixture_secret_value_\d+|test_only_token_do_not_use/i);
    assert.doesNotMatch(content, /sk-[A-Za-z0-9_-]{8,}|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[A-Za-z0-9._-]+|postgres:\/\//i);
  }
});

test("request fixture contains no forbidden Guest execution fields", () => {
  const request = parseEffectRequest(readFixtureText("effect-request.valid.json"));

  assert.equal("params" in request, false);
  const serialized = JSON.stringify(request.params ?? {});
  for (const forbidden of forbiddenGuestExecutionFields) {
    assert.equal(serialized.includes(`"${forbidden}"`), false);
  }
});

function readFixtureText(name: string): string {
  return readFileSync(join(fixtureDir, name), "utf8");
}

function readFixture(name: string): unknown {
  return JSON.parse(readFixtureText(name));
}

function assertEffectResponse(value: unknown): EffectResponse {
  assertJsonObject(value);
  assert.equal(value.type, "effect.response");
  assert.equal(typeof value.requestId, "string");
  assert.equal(typeof value.ok, "boolean");
  assert.equal(typeof value.auditId, "string");

  if (value.ok === true) {
    assertJsonObject(value.result);
    if ("redactions" in value.result && value.result.redactions !== undefined) {
      assert.equal(Array.isArray(value.result.redactions), true);
      const redactions = value.result.redactions as unknown[];
      for (const redaction of redactions) {
        assertRedactionSummary(redaction);
      }
    }
  } else {
    assertJsonObject(value.error);
    assert.equal(typeof value.error.code, "string");
    assert.equal(typeof value.error.message, "string");
  }

  return value as unknown as EffectResponse;
}

function assertRedactionSummary(value: unknown): RedactionSummary {
  assertJsonObject(value);
  assert.equal(value.stream === "stdout" || value.stream === "stderr" || value.stream === "error", true);
  assert.equal(typeof value.count, "number");
  assert.equal(value.reason === "secret" || value.reason === "sensitive-pattern" || value.reason === "policy", true);
  return value as unknown as RedactionSummary;
}

function assertHostManifest(value: unknown): HostManifest {
  assertJsonObject(value);
  assert.equal(typeof value.version, "string");
  assert.equal(Array.isArray(value.capabilities), true);
  for (const capability of value.capabilities as unknown[]) {
    assertJsonObject(capability);
    assert.equal(typeof capability.id, "string");
    assert.equal(capability.kind, "command");
    assert.equal(typeof capability.description, "string");
    assertJsonObject(capability.command);
    assert.equal(typeof capability.command.program, "string");
    assert.equal(Array.isArray(capability.command.args), true);
    assert.equal(Array.isArray(capability.env), true);
    for (const entry of capability.env as unknown[]) {
      assertJsonObject(entry);
      assert.equal(typeof entry.name, "string");
      assert.equal(entry.source, "secret");
      assert.equal(entry.exposedToGuest, false);
    }
  }
  return value as unknown as HostManifest;
}

function assertJsonObject(value: unknown): asserts value is Record<string, unknown> {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
}
