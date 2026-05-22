# AGENTS.md

Guidance for future Codex agents working in `privenv-host`.

## Repository Boundary

- Work only in this repository: `privenv-host`.
- Do not inspect sibling repositories.
- Do not infer requirements from sibling repositories or unrelated existing projects.
- If you are not in `privenv-host`, stop and report it.
- If you need information from `privenv-guest`, stop and report that need instead of inspecting it.

## Scope Discipline

- Do not add runtime implementation unless explicitly asked.
- Do not create `package.json` unless explicitly asked.
- Do not install dependencies unless explicitly asked.
- Keep initial work documentation-first.

## Host/Guest Boundary

- Preserve the Host/Guest boundary in every document and design change.
- The Host is trusted and owns secrets, effect execution, redaction, and audit logging.
- The Guest is untrusted and must never read secrets directly.
- Do not introduce APIs that expose raw secrets to the Guest.
- `privenv-host` must not expose `getSecret()`, `getEnv()`, or raw secret-value APIs to the Guest.

## Secrets Safety

- Never commit real `.env` files.
- Never commit realistic credentials, tokens, SSH keys, OAuth tokens, PII, or production-looking secrets.
- Use fixture-only placeholder secrets in examples and tests.
- Ensure manifests, logs, and examples do not contain secret values.
