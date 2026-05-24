import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  PROTOCOL_VERSION,
  validateEffectRequest,
  validateEffectResponse,
  validateGuestManifest,
  validateRequestParams
} from "@privenv/protocol";
import { parseEffectRequest } from "../../src/protocol/index.js";

const fixtureDir = join(process.cwd(), "tests", "fixtures", "protocol");
const forbiddenGuestExecutionFields = ["command", "program", "args", "argv", "shell", "env", "timeout", "timeoutMs", "secret", "token", "credential"];

const fixtureFiles = [
  "effect-request.valid.json",
  "effect-response.success.json",
  "effect-response.error.json",
  "manifest.valid.json"
];

test("shared protocol version is available", () => {
  assert.equal(PROTOCOL_VERSION.startsWith("0.1"), true);
});

test("valid EffectRequest fixture parses successfully", () => {
  const raw = readFixtureText("effect-request.valid.json");
  const request = parseEffectRequest(raw);
  const sharedRequest = validateEffectRequest(JSON.parse(raw));

  assert.equal(request.id, "req_fixture_001");
  assert.equal(request.type, "effect.request");
  assert.equal(request.capabilityId, "cmd.npm.test");
  assert.equal(request.metadata?.guestName, "fixture-guest");
  assert.deepEqual(request, sharedRequest);
});

test("EffectResponse success fixture validates through shared protocol", () => {
  const response = validateEffectResponse(readFixture("effect-response.success.json"));

  assert.equal(response.ok, true);
  assert.equal(response.type, "effect.response");
  assert.equal(response.result?.exitCode, 0);
});

test("EffectResponse error fixture validates through shared protocol", () => {
  const response = validateEffectResponse(readFixture("effect-response.error.json"));

  assert.equal(response.ok, false);
  assert.equal(response.type, "effect.response");
  assert.equal(response.error?.code, "fixture.error");
});

test("manifest fixture validates through shared protocol", () => {
  const manifest = validateGuestManifest(readFixture("manifest.valid.json"));

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

  validateRequestParams(request.params);
  assert.equal("params" in request, false);
  const serialized = JSON.stringify(request.params ?? {});
  for (const forbidden of forbiddenGuestExecutionFields) {
    assert.equal(serialized.includes(`"${forbidden}"`), false);
  }
});

test("shared request validation rejects forbidden Guest execution fields", () => {
  assert.throws(
    () => validateRequestParams({ nested: { env: { EXAMPLE_TOKEN: "fake-placeholder" } } }),
    /request params must not include env/
  );
});

function readFixtureText(name: string): string {
  return readFileSync(join(fixtureDir, name), "utf8");
}

function readFixture(name: string): unknown {
  return JSON.parse(readFixtureText(name));
}
