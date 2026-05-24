# AGENTS.md

Guidance for future Codex agents working in `privenv-host`.

## Repository Boundary

- Work only in this repository: `privenv-host`.
- Do not inspect sibling repositories.
- Do not infer requirements from sibling repositories or unrelated existing projects.
- Do not inspect `privenv-guest`.
- If you are not in `privenv-host`, stop and report it.
- If you need information from `privenv-guest`, stop and report that need instead of inspecting it.
- Do not inspect `privenv-guest` to compare protocol compatibility. Request an explicit copied spec or shared protocol package instead.

## Current Stage

- This repository has a minimal TypeScript Host-side skeleton.
- Real command execution is not implemented.
- `simulate` is the only implemented execution mode.
- Protected `run`, explicit `demo-run`, `manifest`, `validate`, `doctor`, and `init` are the expected CLI surface.

## Scope Discipline

- Do not add runtime features unless explicitly asked.
- Do not implement real command execution unless explicitly requested.
- Do not import `child_process` unless explicitly requested.
- Do not implement passthrough mode in `privenv-host`.
- Do not implement external API gateway behavior.
- Do not implement Unix domain sockets unless explicitly requested.
- Do not install dependencies unless explicitly asked.
- Keep documentation changes consistent with the current implementation stage.

## Host/Guest Boundary

- Preserve the Host/Guest boundary in every document, type, test, and design change.
- The Host is trusted and owns config, vault, audit logs, redaction, policy, and execution context.
- The Guest is untrusted and reads generated safe manifests only.
- The Guest sends `EffectRequest` only.
- The Guest must never read `privenv.host.json`, `.privenv/vault.json`, `.privenv/audit.log.jsonl`, `.env`, or `.env.*`.
- Do not introduce APIs that expose raw secrets to the Guest.
- Never introduce `getSecret()`, `getEnv()`, `rawEnv()`, or any raw secret-value API.

## Secrets Safety

- Never commit real `.env` files.
- Never commit realistic credentials, tokens, SSH keys, OAuth tokens, PII, or production-looking secrets.
- Keep examples fixture-only and obviously fake.
- Use placeholder values that are clearly not usable credentials.
- Ensure manifests, logs, responses, tests, and examples do not contain secret values.
