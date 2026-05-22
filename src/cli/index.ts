#!/usr/bin/env node

import { loadHostConfigFromCwd } from "../config/index.js";
import { parseEffectRequest, ProtocolParseError } from "../protocol/index.js";
import { handleEffectRequest } from "../runtime/index.js";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<void> {
  const [, , command] = process.argv;

  if (command !== "run") {
    process.stderr.write("Usage: privenv-host run\n");
    process.exitCode = 1;
    return;
  }

  const input = await readStdin();

  try {
    const hostConfig = await loadHostConfigFromCwd();
    const request = parseEffectRequest(input);
    const { response } = handleEffectRequest({ request, hostConfig });
    process.stdout.write(`${JSON.stringify(response)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    const code = error instanceof ProtocolParseError ? error.code : "runtime.error";

    process.stdout.write(
      `${JSON.stringify({
        requestId: "unknown",
        type: "effect.response",
        ok: false,
        error: {
          code,
          message
        },
        auditId: "audit_unavailable"
      })}\n`
    );
    process.exitCode = 1;
  }
}

await main();
