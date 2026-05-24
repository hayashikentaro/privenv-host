# Codex Operating Contract

This contract records standing rules for Codex agents working in `hayashikentaro/privenv-host`.

Future task prompts may be short. These fixed rules still apply unless the user explicitly changes them for the current task.

## Repository Boundary

- Work only in `hayashikentaro/privenv-host`.
- Do not inspect sibling repositories.
- Do not inspect `privenv-guest`.
- Do not inspect `privenv-protocol`.
- Do not infer requirements from sibling repositories or unrelated projects.
- If protocol details are needed, use the published `@privenv/protocol` package and explicit copied specs or release notes.

## Host/Guest Boundary

- The Host is trusted.
- The Host owns `privenv.host.json`, `.privenv/vault.json`, `.privenv/audit.log.jsonl`, redaction, policy, execution context, and protected execution decisions.
- The Guest is untrusted.
- The Guest reads generated safe manifests only.
- The Guest sends `EffectRequest` only.
- The Guest must never read Host config, vault files, audit logs, `.env`, `.env.*`, raw secrets, PII, API tokens, OAuth tokens, SSH keys, browser sessions, or Host-internal execution context.
- Guest-facing responses, manifests, logs, docs, and tests must never expose raw secret values.

## Forbidden APIs

Never add Guest-facing APIs named or equivalent to:

- `getSecret()`
- `getEnv()`
- `rawEnv()`
- raw secret-value readers
- raw vault readers
- raw `.env` readers

## Forbidden Behavior

Do not implement or introduce:

- real command execution
- `child_process`
- unrestricted shell execution
- external API gateway behavior
- passthrough mode in `privenv-host`
- automatic `.env` import
- production vault integration
- Unix domain sockets unless explicitly requested

`simulate` is the only implemented execution mode. `--execute` must continue to return `execution.not_implemented` until real execution is explicitly designed and requested.

## npm, Tokens, and Publishing

- Do not run `npm publish` unless explicitly requested.
- Do not add npm tokens.
- Do not commit npm tokens.
- Do not add publish automation.
- Do not add GitHub Actions publishing.
- Do not add repository secrets for publication.

## Required Checks

Before reporting completion after code, docs, package, or test changes, run:

```sh
npm test
npm run typecheck
npm run pack:check
```

If a check cannot be run, report why.

## Stop-And-Report Conditions

Stop and report instead of continuing when:

- the current directory is not `hayashikentaro/privenv-host`
- the task requires inspecting a sibling repository
- the task requires inspecting `privenv-guest`
- the task requires inspecting the `privenv-protocol` repository
- the task requires Host or Guest details not present in this repository, the published protocol package, or an explicit copied spec
- the task requires real command execution but does not explicitly authorize designing or implementing it
- a requested change would expose raw secrets or raw environment values to the Guest
- npm publish, token handling, or release automation is needed but not explicitly requested

## Expected Final Report

Final responses should summarize:

- files changed
- whether runtime behavior changed
- tests/checks run and pass/fail status
- any skipped checks with reasons
- commit and push status when git actions were performed

Keep the report concise and state clearly if the Host/Guest boundary remains preserved.
