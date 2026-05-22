import type { RedactionSummary } from "../protocol/types.js";

export const REDACTION_TOKEN = "[REDACTED]";

export interface RedactionFixture {
  label: string;
  value: string;
}

export interface RedactedStreams {
  stdout: string;
  stderr: string;
  redactions: RedactionSummary[];
}

export function redactStreams(input: {
  stdout: string;
  stderr: string;
  fixtureSecrets: RedactionFixture[];
}): RedactedStreams {
  const stdout = redactOneStream("stdout", input.stdout, input.fixtureSecrets);
  const stderr = redactOneStream("stderr", input.stderr, input.fixtureSecrets);

  return {
    stdout: stdout.value,
    stderr: stderr.value,
    redactions: [...stdout.redactions, ...stderr.redactions]
  };
}

function redactOneStream(
  stream: "stdout" | "stderr",
  value: string,
  fixtureSecrets: RedactionFixture[]
): { value: string; redactions: RedactionSummary[] } {
  let redacted = value;
  let count = 0;

  for (const fixture of fixtureSecrets) {
    if (fixture.value.length === 0) {
      continue;
    }

    const parts = redacted.split(fixture.value);
    count += parts.length - 1;
    redacted = parts.join(REDACTION_TOKEN);
  }

  return {
    value: redacted,
    redactions:
      count > 0
        ? [
            {
              stream,
              count,
              reason: "secret"
            }
          ]
        : []
  };
}
