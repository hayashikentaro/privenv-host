import assert from "node:assert/strict";
import test from "node:test";
import { createSafeManifest } from "../../src/manifest/index.js";
import { FIXTURE_SECRET_VALUES } from "../fixtures/secrets.js";

test("manifest generated from config does not contain fixture secret values", () => {
  const manifestText = JSON.stringify(createSafeManifest({
    version: "0.1",
    capabilities: [
      {
        id: "cmd.npm.test",
        kind: "command",
        description: "Run npm test",
        command: {
          program: "npm",
          args: ["test"]
        },
        env: [
          {
            name: "DATABASE_URL",
            source: "secret",
            exposedToGuest: false
          }
        ],
        timeoutMs: 30000,
        redactionPolicy: "default"
      }
    ]
  }));

  assert.match(manifestText, /cmd\.npm\.test/);
  assert.match(manifestText, /DATABASE_URL/);
  assert.doesNotMatch(manifestText, /postgres:\/\//);

  for (const secret of FIXTURE_SECRET_VALUES) {
    assert.doesNotMatch(manifestText, new RegExp(secret));
  }
});
