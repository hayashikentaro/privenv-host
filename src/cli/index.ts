#!/usr/bin/env node

import { appendAuditRecord } from "../audit/index.js";
import { loadHostConfigFromCwd } from "../config/index.js";
import { createSafeManifest } from "../manifest/index.js";
import { parseEffectRequest, ProtocolParseError } from "../protocol/index.js";
import { handleEffectRequest, loadHostRuntimeInputs } from "../runtime/index.js";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<void> {
  const [, , command] = process.argv;

  if (command !== "run" && command !== "demo-run" && command !== "manifest") {
    process.stderr.write("Usage: privenv-host run | privenv-host demo-run | privenv-host manifest\n");
    process.exitCode = 1;
    return;
  }

  if (command === "manifest") {
    await emitManifest();
    return;
  }

  const input = await readStdin();

  try {
    const runtimeInputs = await loadHostRuntimeInputs({ allowFixtureFallback: command === "demo-run" });
    const request = parseEffectRequest(input);
    const { response, audit } = handleEffectRequest({
      request,
      hostConfig: runtimeInputs.hostConfig,
      vault: runtimeInputs.vault
    });
    await appendAuditSafely(audit);
    process.stdout.write(`${JSON.stringify(response)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    const code = error instanceof ProtocolParseError ? error.code : "runtime.error";

    process.stdout.write(`${JSON.stringify(errorResponse(code, message))}\n`);
    process.exitCode = 1;
  }
}

async function appendAuditSafely(audit: Parameters<typeof appendAuditRecord>[0]): Promise<void> {
  try {
    await appendAuditRecord(audit);
  } catch {
    process.stderr.write("Warning: failed to write Host audit log.\n");
  }
}

async function emitManifest(): Promise<void> {
  try {
    const hostConfig = await loadHostConfigFromCwd();
    process.stdout.write(`${JSON.stringify(createSafeManifest(hostConfig))}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    const code = "manifest.config_error";
    process.stdout.write(`${JSON.stringify(errorResponse(code, message))}\n`);
    process.exitCode = 1;
  }
}

function errorResponse(code: string, message: string): object {
  return {
    requestId: "unknown",
    type: "effect.response",
    ok: false,
    error: {
      code,
      message
    },
    auditId: "audit_unavailable"
  };
}

await main();
