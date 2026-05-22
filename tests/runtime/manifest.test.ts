import assert from "node:assert/strict";
import test from "node:test";
import { createSafeManifest } from "../../src/manifest/index.js";
import { FIXTURE_SECRET_VALUES } from "../fixtures/secrets.js";

test("manifest does not contain fixture secret values", () => {
  const manifestText = JSON.stringify(createSafeManifest());

  assert.match(manifestText, /cmd\.npm\.test/);

  for (const secret of FIXTURE_SECRET_VALUES) {
    assert.doesNotMatch(manifestText, new RegExp(secret));
  }
});
