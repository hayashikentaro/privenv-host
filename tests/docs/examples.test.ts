import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const examples = readFileSync(join(process.cwd(), "docs", "examples.md"), "utf8");

test("docs examples JSON blocks are parseable", () => {
  const jsonBlocks = [...examples.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => match[1]);

  assert.equal(jsonBlocks.length, 7);
  for (const block of jsonBlocks) {
    JSON.parse(block);
  }
});

test("docs examples contain no realistic credential-looking values", () => {
  assert.doesNotMatch(examples, /fixture_secret_value_123|test_only_token_do_not_use|fixture-db-url/);
  assert.doesNotMatch(examples, /sk-[A-Za-z0-9_-]{8,}|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|postgres:\/\/|Bearer\s+[A-Za-z0-9._-]+/i);
});
