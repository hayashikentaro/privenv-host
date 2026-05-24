import { ProtocolValidationError, validateEffectRequest } from "@privenv/protocol";
import type { EffectRequest } from "@privenv/protocol";

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

  try {
    return validateEffectRequest(parsed);
  } catch (error) {
    if (error instanceof ProtocolValidationError) {
      throw new ProtocolParseError(error.message);
    }
    throw error;
  }
}
