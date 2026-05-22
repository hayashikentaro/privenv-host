import type { RedactionFixture } from "./redact.js";

export const FIXTURE_SECRETS: RedactionFixture[] = [
  {
    label: "fixture-primary",
    value: "fixture_secret_value_123"
  },
  {
    label: "fixture-token",
    value: "test_only_token_do_not_use"
  },
  {
    label: "fixture-ssh-material",
    value: "fake_ssh_key_material_for_tests_only"
  }
];
