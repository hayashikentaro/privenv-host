#!/usr/bin/env node

import { appendAuditRecord } from "../audit/index.js";
import { loadHostConfigFromCwd } from "../config/index.js";
import { createSafeManifest } from "../manifest/index.js";
import { parseEffectRequest, ProtocolParseError } from "../protocol/index.js";
import { handleEffectRequest, isExecutionMode, loadHostRuntimeInputs } from "../runtime/index.js";
import { formatDoctor, validateHostSetup } from "../validation/index.js";
import type { ExecutionMode } from "../runtime/index.js";

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<void> {
  const result = await runCli({ args: process.argv.slice(2), stdin: await readStdin(), cwd: process.cwd() });
  if (result.stderr.length > 0) {
    process.stderr.write(result.stderr);
  }
  process.stdout.write(result.stdout);
  process.exitCode = result.exitCode;
}

export async function runCli(input: { args: string[]; stdin?: string; cwd: string }): Promise<CliResult> {
  const parsed = parseArgs(input.args);

  if (!parsed.ok) {
    return {
      stdout: "",
      stderr: `${parsed.message}\n`,
      exitCode: 1
    };
  }

  if (parsed.command === "manifest") {
    return emitManifest(input.cwd);
  }

  if (parsed.command === "validate") {
    return emitValidation(input.cwd);
  }

  if (parsed.command === "doctor") {
    return emitDoctor(input.cwd);
  }

  try {
    const runtimeInputs = await loadHostRuntimeInputs({ cwd: input.cwd, allowFixtureFallback: parsed.command === "demo-run" });
    const request = parseEffectRequest(input.stdin ?? "");
    const { response, audit } = handleEffectRequest({
      request,
      hostConfig: runtimeInputs.hostConfig,
      vault: runtimeInputs.vault,
      executionMode: parsed.executionMode
    });
    const stderr = await appendAuditSafely(audit, input.cwd);
    return {
      stdout: `${JSON.stringify(response)}\n`,
      stderr,
      exitCode: 0
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    const code = error instanceof ProtocolParseError ? error.code : "runtime.error";

    return {
      stdout: `${JSON.stringify(errorResponse(code, message))}\n`,
      stderr: "",
      exitCode: 1
    };
  }
}

function parseArgs(args: string[]):
  | { ok: true; command: "run" | "demo-run" | "manifest" | "validate" | "doctor"; executionMode: ExecutionMode }
  | { ok: false; message: string } {
  const [command, ...flags] = args;
  if (command !== "run" && command !== "demo-run" && command !== "manifest" && command !== "validate" && command !== "doctor") {
    return { ok: false, message: "Usage: privenv-host run [--simulate] | privenv-host demo-run [--simulate] | privenv-host manifest | privenv-host validate | privenv-host doctor" };
  }

  let executionMode: ExecutionMode = "simulate";
  for (const flag of flags) {
    if (flag === "--simulate") {
      executionMode = "simulate";
      continue;
    }
    if (flag === "--execute") {
      executionMode = "execute";
      continue;
    }
    return { ok: false, message: `Unknown flag: ${flag}` };
  }

  if (!isExecutionMode(executionMode)) {
    return { ok: false, message: "Invalid execution mode." };
  }

  return { ok: true, command, executionMode };
}

async function appendAuditSafely(audit: Parameters<typeof appendAuditRecord>[0], cwd: string): Promise<string> {
  try {
    await appendAuditRecord(audit, { cwd });
    return "";
  } catch {
    return "Warning: failed to write Host audit log.\n";
  }
}

async function emitValidation(cwd: string): Promise<CliResult> {
  const result = await validateHostSetup(cwd);
  return {
    stdout: `${JSON.stringify(result)}\n`,
    stderr: "",
    exitCode: result.ok ? 0 : 1
  };
}

async function emitDoctor(cwd: string): Promise<CliResult> {
  const result = await validateHostSetup(cwd);
  return {
    stdout: formatDoctor(result),
    stderr: "",
    exitCode: result.ok ? 0 : 1
  };
}

async function emitManifest(cwd: string): Promise<CliResult> {
  try {
    const hostConfig = await loadHostConfigFromCwd(cwd);
    return {
      stdout: `${JSON.stringify(createSafeManifest(hostConfig))}\n`,
      stderr: "",
      exitCode: 0
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    const code = "manifest.config_error";
    return {
      stdout: `${JSON.stringify(errorResponse(code, message))}\n`,
      stderr: "",
      exitCode: 1
    };
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

if (process.argv[1]?.endsWith("dist/src/cli/index.js") || process.argv[1]?.endsWith("src/cli/index.ts")) {
  await main();
}
