import { readFileSync, unlinkSync } from "node:fs";
import { gunzipSync } from "node:zlib";

interface PackFile {
  path: string;
}

interface PackResult {
  files?: PackFile[];
}

const forbiddenPatterns: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /(^|\/)\.env($|\.)/, reason: ".env files must not be packed" },
  { pattern: /(^|\/)\.privenv\//, reason: ".privenv must not be packed" },
  { pattern: /(^|\/)audit\.log\.jsonl$/, reason: "audit logs must not be packed" },
  { pattern: /(^|\/)vault\.json$/, reason: "vault files must not be packed" },
  { pattern: /(^|\/)privenv\.vault\.example\.json$/, reason: "project-generated vault examples must not be packed" },
  { pattern: /(^|\/)node_modules\//, reason: "node_modules must not be packed" },
  { pattern: /^src\//, reason: "source files must not be packed" },
  { pattern: /^tests\//, reason: "tests must not be packed" },
  { pattern: /^dist\/tests\//, reason: "compiled tests must not be packed" }
];

const allowedTopLevel = new Set(["dist", "docs", "README.md", "LICENSE", "package.json"]);
const input = (await readStdin()).trim();
const files = readPackFileList(input).sort();
const failures: string[] = [];

for (const file of files) {
  const topLevel = file.split("/")[0] ?? file;
  if (!allowedTopLevel.has(topLevel)) {
    failures.push(`${file}: top-level package entry is not allowed`);
  }

  for (const forbidden of forbiddenPatterns) {
    if (forbidden.pattern.test(file)) {
      failures.push(`${file}: ${forbidden.reason}`);
    }
  }
}

for (const required of ["package.json", "README.md", "LICENSE", "dist/src/cli/index.js", "dist/scripts/check-package-files.js"]) {
  if (!files.includes(required)) {
    failures.push(`${required}: required package file is missing`);
  }
}

if (failures.length > 0) {
  console.error("Package file check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Package file check passed (${files.length} files).`);
}

function readPackFileList(input: string): string[] {
  if (input.startsWith("[")) {
    const packResults = JSON.parse(input) as PackResult[];
    return packResults.flatMap((result) => result.files ?? []).map((file) => file.path);
  }

  const tarballPath = input.split(/\r?\n/).filter(Boolean).at(-1);
  if (!tarballPath || !tarballPath.endsWith(".tgz")) {
    throw new Error("Expected npm pack JSON or .tgz filename on stdin.");
  }

  try {
    return listTarballFiles(tarballPath);
  } finally {
    unlinkSync(tarballPath);
  }
}

function listTarballFiles(path: string): string[] {
  const bytes = gunzipSync(readFileSync(path));
  const files: string[] = [];
  let offset = 0;

  while (offset + 512 <= bytes.length) {
    const header = bytes.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      break;
    }

    const rawName = readNullTerminatedString(header.subarray(0, 100));
    const rawPrefix = readNullTerminatedString(header.subarray(345, 500));
    const name = [rawPrefix, rawName].filter(Boolean).join("/");
    const sizeText = readNullTerminatedString(header.subarray(124, 136)).trim();
    const size = Number.parseInt(sizeText || "0", 8);
    const typeFlag = readNullTerminatedString(header.subarray(156, 157));

    if (name.length > 0 && typeFlag !== "5") {
      files.push(name.replace(/^package\//, ""));
    }

    offset += 512 + Math.ceil(size / 512) * 512;
  }

  return files;
}

function readNullTerminatedString(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  return Buffer.from(end === -1 ? bytes : bytes.subarray(0, end)).toString("utf8");
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}
