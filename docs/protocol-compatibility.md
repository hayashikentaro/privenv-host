# Protocol Compatibility

`privenv-host` and `privenv-guest` must agree on the JSON shapes for `EffectRequest`, `EffectResponse`, and safe manifests.

`privenv-host` now depends on `@privenv/protocol` for shared protocol types and validators. This reduces protocol drift while keeping Host-specific behavior local.

## Current Process

Protocol changes should be handled through package version updates:

- update the `@privenv/protocol` dependency version deliberately
- read package release notes or an explicit copied spec
- update local fixtures when the shared protocol shape changes
- keep Host-specific config, vault, audit, redaction, execution context, policy, runtime, and CLI behavior in this repository
- `privenv-host` must not inspect `privenv-guest` to verify compatibility
- `privenv-host` must not inspect the `privenv-protocol` repository to verify compatibility

If Host-side work needs Guest-side or protocol implementation details, stop and request an explicit copied spec or package release information instead of inspecting sibling repositories.

## Shared Package

`@privenv/protocol` owns:

- `EffectRequest`
- `EffectResponse`
- `RedactionSummary`
- safe manifest types
- protocol validators

Local protocol fixtures remain as compatibility examples and regression tests.

## Boundary Reminder

Protocol compatibility does not loosen the Host/Guest boundary. `privenv-host` must still protect Host-owned config, vault files, audit logs, redaction, execution context, and secret material from Guest access.
