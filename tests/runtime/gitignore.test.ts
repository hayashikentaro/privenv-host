import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("gitignore contains Host secret and local artifact patterns", () => {
  const lines = new Set(readFileSync(".gitignore", "utf8").split(/\r?\n/));

  for (const pattern of [".env", ".env.*", "!.env.example", ".privenv/", "privenv.manifest.json", "audit.log.jsonl"]) {
    assert.equal(lines.has(pattern), true, `missing ${pattern}`);
  }
});
