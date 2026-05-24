import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function listTestFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listTestFiles(path) : [path];
  });
}

test("tests do not import process execution APIs", () => {
  const forbidden = ["child" + "_process", "spawn" + "Sync", "exec" + "Sync", "exec" + "FileSync"];
  for (const file of listTestFiles("tests")) {
    if (!file.endsWith(".ts")) continue;
    const contents = readFileSync(file, "utf8");
    for (const token of forbidden) {
      assert.equal(contents.includes(token), false, `${file} contains ${token}`);
    }
  }
});
