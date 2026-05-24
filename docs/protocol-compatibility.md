# Protocol Compatibility

`privenv-host` and `privenv-guest` must agree on the JSON shapes for `EffectRequest`, `EffectResponse`, and safe manifests.

For now, the protocol is duplicated in both repositories as documentation and local TypeScript types. This keeps the early packages independent while the protocol is still small.

## Current Process

Until a shared protocol package exists:

- changes to `docs/protocol.md` must be mirrored manually across repositories
- changes should be coordinated through an explicit copied spec, issue, PR text, release note, or future shared protocol package
- local fixtures in this repository should reflect the copied protocol shape
- `privenv-host` must not inspect `privenv-guest` to verify compatibility

If Host-side work needs Guest-side details, stop and request an explicit copied spec or a shared package instead of inspecting the Guest repository.

## Future Shared Package

Future work may introduce a shared package such as `@privenv/protocol`.

That package could own:

- `EffectRequest`
- `EffectResponse`
- `RedactionSummary`
- safe manifest types
- protocol conformance fixtures

Until then, duplicated local specs are intentional.

## Boundary Reminder

Protocol compatibility does not loosen the Host/Guest boundary. `privenv-host` must still protect Host-owned config, vault files, audit logs, redaction, execution context, and secret material from Guest access.
