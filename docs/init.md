# Project Init

`privenv-host init` creates starter Host-owned files without importing secrets.

```sh
privenv-host init
```

The command is intentionally conservative:

- it creates `privenv.host.json` only if missing
- it creates `privenv.vault.example.json` only if missing
- it creates or updates `.gitignore` with required secret-boundary patterns
- it does not create `.privenv/vault.json`
- it does not read `.env`
- it does not import real secrets
- it does not execute commands

Use `--force` only when you want to overwrite the generated starter files:

```sh
privenv-host init --force
```

`--force` overwrites `privenv.host.json` and `privenv.vault.example.json`. It does not create a real vault and does not import secrets.

## Generated Host Config

The starter `privenv.host.json` contains three no-env capabilities:

- `cmd.npm.test`
- `cmd.npm.lint`
- `cmd.npm.typecheck`

The starter config does not include env references by default and contains no secret values.

## Vault Example

`privenv.vault.example.json` is generated at the project root because `.privenv/` is gitignored. It contains clearly fake placeholder values for the supported MVP classifications:

- `secret`
- `pii`
- `token`

Do not use the example file as a real vault. When a project needs local Host secrets, create `.privenv/vault.json` manually from the example and replace placeholders locally. `.privenv/vault.json` is Host-owned and gitignored. Guests must never read it.

## Gitignore

`init` ensures `.gitignore` contains:

```text
.env
.env.*
!.env.example
.privenv/
privenv.manifest.json
audit.log.jsonl
```

These patterns keep local env files, Host vault files, generated manifests, and local audit logs out of git by default.
