import { isJsonObject } from "../types/json.js";
import type { EffectRequest } from "./types.js";

export class ProtocolParseError extends Error {
  readonly code = "protocol.parse_error";
}

export function parseEffectRequest(input: string): EffectRequest {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch {
    throw new ProtocolParseError("Request must be valid JSON.");
  }

  if (!isJsonObject(parsed)) {
    throw new ProtocolParseError("Request must be a JSON object.");
  }

  if (parsed.type !== "effect.request") {
    throw new ProtocolParseError('Request type must be "effect.request".');
  }

  if (typeof parsed.id !== "string" || parsed.id.length === 0) {
    throw new ProtocolParseError("Request id must be a non-empty string.");
  }

  if (typeof parsed.capabilityId !== "string" || parsed.capabilityId.length === 0) {
    throw new ProtocolParseError("Request capabilityId must be a non-empty string.");
  }

  if (parsed.params !== undefined && !isJsonObject(parsed.params)) {
    throw new ProtocolParseError("Request params must be an object when provided.");
  }

  if (parsed.metadata !== undefined) {
    if (!isJsonObject(parsed.metadata)) {
      throw new ProtocolParseError("Request metadata must be an object when provided.");
    }

    for (const key of ["guestName", "guestRunId", "reason"] as const) {
      if (parsed.metadata[key] !== undefined && typeof parsed.metadata[key] !== "string") {
        throw new ProtocolParseError(`Request metadata.${key} must be a string when provided.`);
      }
    }
  }

  return parsed as unknown as EffectRequest;
}
