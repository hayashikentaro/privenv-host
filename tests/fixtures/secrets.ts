import type { RedactionFixture } from "../../src/redact/index.js";

export const FIXTURE_SECRET_VALUES = [
  "fixture_secret_value_123",
  "test_only_token_do_not_use",
  "fake_ssh_key_material_for_tests_only"
] as const;

export const FIXTURE_SECRETS: RedactionFixture[] = FIXTURE_SECRET_VALUES.map((value, index) => ({
  label: `fixture_${index + 1}`,
  value
}));
