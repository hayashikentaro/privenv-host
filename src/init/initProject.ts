import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { HOST_CONFIG_FILENAME } from "../config/index.js";
import { REQUIRED_GITIGNORE_PATTERNS, serializeStarterJson, STARTER_HOST_CONFIG, STARTER_VAULT_EXAMPLE } from "./starterFiles.js";
import type { InitFileResult, InitResult } from "./types.js";

const VAULT_EXAMPLE_FILENAME = "privenv.vault.example.json";
const GITIGNORE_FILENAME = ".gitignore";

export async function initProject(input: { cwd?: string; force?: boolean } = {}): Promise<InitResult> {
  const cwd = input.cwd ?? process.cwd();
  const force = input.force ?? false;
  const hostConfig = await writeStarterFile({
    path: join(cwd, HOST_CONFIG_FILENAME),
    displayPath: HOST_CONFIG_FILENAME,
    content: serializeStarterJson(STARTER_HOST_CONFIG),
    force
  });
  const vaultExample = await writeStarterFile({
    path: join(cwd, VAULT_EXAMPLE_FILENAME),
    displayPath: VAULT_EXAMPLE_FILENAME,
    content: serializeStarterJson(STARTER_VAULT_EXAMPLE),
    force
  });
  const gitignore = await updateGitignore(join(cwd, GITIGNORE_FILENAME));

  return {
    ok: true,
    type: "init.result",
    files: {
      hostConfig,
      vaultExample,
      gitignore,
      vault: {
        path: ".privenv/vault.json",
        created: false
      }
    },
    warnings: ["init does not read .env or import secrets; create .privenv/vault.json manually when needed."]
  };
}

async function writeStarterFile(input: {
  path: string;
  displayPath: string;
  content: string;
  force: boolean;
}): Promise<InitFileResult> {
  const exists = await fileExists(input.path);
  if (exists && !input.force) {
    return fileResult(input.displayPath, { skipped: true });
  }

  await mkdir(dirname(input.path), { recursive: true });
  await writeFile(input.path, input.content, "utf8");
  return fileResult(input.displayPath, exists ? { overwritten: true } : { created: true });
}

async function updateGitignore(path: string): Promise<InitFileResult> {
  const exists = await fileExists(path);
  const current = exists ? await readFile(path, "utf8") : "";
  const lines = current.split(/\r?\n/);
  const present = new Set(lines.map((line) => line.trim()).filter(Boolean));
  const missing = REQUIRED_GITIGNORE_PATTERNS.filter((pattern) => !present.has(pattern));

  if (exists && missing.length === 0) {
    return fileResult(GITIGNORE_FILENAME, { skipped: true });
  }

  const prefix = current.length === 0 || current.endsWith("\n") ? current : `${current}\n`;
  const separator = prefix.length === 0 ? "" : "\n";
  await writeFile(path, `${prefix}${separator}${missing.join("\n")}\n`, "utf8");
  return fileResult(GITIGNORE_FILENAME, exists ? { updated: true } : { created: true });
}

function fileResult(
  path: string,
  state: Partial<Pick<InitFileResult, "created" | "updated" | "overwritten" | "skipped">>
): InitFileResult {
  return {
    path,
    created: state.created ?? false,
    updated: state.updated ?? false,
    overwritten: state.overwritten ?? false,
    skipped: state.skipped ?? false
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path, "utf8");
    return true;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
