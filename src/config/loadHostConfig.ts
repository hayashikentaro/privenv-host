import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isJsonObject } from "../types/json.js";
import { ConfigLoadError, ConfigValidationError } from "./errors.js";
import { FIXTURE_HOST_CONFIG } from "./fixtureConfig.js";
import type { HostConfig, HostConfigCapability, HostConfigEnvReference } from "./types.js";

export const HOST_CONFIG_FILENAME = "privenv.host.json";

export async function loadHostConfigFromCwd(cwd: string = process.cwd()): Promise<HostConfig> {
  const path = join(cwd, HOST_CONFIG_FILENAME);

  try {
    return await loadHostConfigFile(path);
  } catch (error) {
    if (isMissingFileError(error)) {
      return FIXTURE_HOST_CONFIG;
    }
    throw error;
  }
}

export async function loadHostConfigFile(path: string): Promise<HostConfig> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (isMissingFileError(error)) {
      throw error;
    }
    throw new ConfigLoadError("Host config must be readable JSON.");
  }

  return validateHostConfig(parsed);
}

export function validateHostConfig(value: unknown): HostConfig {
  if (!isJsonObject(value)) {
    throw new ConfigValidationError("Host config must be a JSON object.");
  }

  if (typeof value.version !== "string") {
    throw new ConfigValidationError("Host config version must be a string.");
  }

  if (containsSuspiciousSecretLikeString(value.version)) {
    throw new ConfigValidationError("Host config version contains a suspicious secret-like value.");
  }

  if (!Array.isArray(value.capabilities)) {
    throw new ConfigValidationError("Host config capabilities must be an array.");
  }

  return {
    version: value.version,
    capabilities: value.capabilities.map((capability, index) => validateCapability(capability, index))
  };
}

function validateCapability(value: unknown, index: number): HostConfigCapability {
  if (!isJsonObject(value)) {
    throw new ConfigValidationError(`Capability at index ${index} must be an object.`);
  }

  const id = readSafeString(value.id, `capabilities[${index}].id`);
  const description = readSafeString(value.description, `capabilities[${index}].description`);

  if (value.kind !== "command") {
    throw new ConfigValidationError(`Capability ${id} kind must be "command".`);
  }

  if (!isJsonObject(value.command)) {
    throw new ConfigValidationError(`Capability ${id} command must be an object.`);
  }

  const program = readSafeString(value.command.program, `capabilities[${index}].command.program`);
  if (!Array.isArray(value.command.args)) {
    throw new ConfigValidationError(`Capability ${id} command.args must be an array.`);
  }

  const args = value.command.args.map((arg, argIndex) =>
    readSafeString(arg, `capabilities[${index}].command.args[${argIndex}]`)
  );

  if (!Array.isArray(value.env)) {
    throw new ConfigValidationError(`Capability ${id} env must be an array.`);
  }

  const env = value.env.map((entry, envIndex) => validateEnvReference(entry, id, envIndex));

  const timeoutMs = value.timeoutMs;
  if (typeof timeoutMs !== "number" || !Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new ConfigValidationError(`Capability ${id} timeoutMs must be a positive integer.`);
  }

  if (value.redactionPolicy !== "default") {
    throw new ConfigValidationError(`Capability ${id} redactionPolicy must be "default".`);
  }

  return {
    id,
    kind: "command",
    description,
    command: { program, args },
    env,
    timeoutMs,
    redactionPolicy: "default"
  };
}

function validateEnvReference(value: unknown, capabilityId: string, index: number): HostConfigEnvReference {
  if (!isJsonObject(value)) {
    throw new ConfigValidationError(`Capability ${capabilityId} env[${index}] must be an object.`);
  }

  if (typeof value.name !== "string" || value.name.length === 0) {
    throw new ConfigValidationError(`Capability ${capabilityId} env[${index}].name must be a non-empty string.`);
  }

  if (value.source !== "secret") {
    throw new ConfigValidationError(`Capability ${capabilityId} env[${index}].source must be "secret".`);
  }

  if (value.exposedToGuest !== false) {
    throw new ConfigValidationError(`Capability ${capabilityId} env[${index}].exposedToGuest must be false.`);
  }

  const allowedKeys = new Set(["name", "source", "exposedToGuest"]);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw new ConfigValidationError(`Capability ${capabilityId} env[${index}] contains unsupported field "${key}".`);
    }
  }

  return {
    name: value.name,
    source: "secret",
    exposedToGuest: false
  };
}

function readSafeString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ConfigValidationError(`${path} must be a non-empty string.`);
  }

  if (containsSuspiciousSecretLikeString(value)) {
    throw new ConfigValidationError(`${path} contains a suspicious secret-like value.`);
  }

  return value;
}

function containsSuspiciousSecretLikeString(value: string): boolean {
  return [
    /fixture_secret_value_\d+/i,
    /test_only_token_do_not_use/i,
    /fake_ssh_key_material/i,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\bsk-[A-Za-z0-9_-]{8,}/,
    /bearer\s+[A-Za-z0-9._-]{8,}/i,
    /password\s*[:=]\s*[^\s]+/i,
    /token\s*[:=]\s*[^\s]+/i,
    /secret\s*[:=]\s*[^\s]+/i
  ].some((pattern) => pattern.test(value));
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
