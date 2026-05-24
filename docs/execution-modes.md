# Execution Modes

`privenv-host` defines an explicit `ExecutionMode` before any real command execution exists.

Supported values:

- `simulate`
- `execute`

## Simulate

`simulate` is the default and the only implemented mode.

Both normal mode and demo mode use simulation unless explicitly told otherwise:

```sh
privenv-host run
privenv-host run --simulate
privenv-host demo-run
privenv-host demo-run --simulate
```

In simulate mode, the Host resolves config, policy, vault references, and execution context, then calls the fake executor. No process is spawned.

## Execute

`execute` is reserved for a future carefully reviewed real execution implementation.

```sh
privenv-host run --execute
privenv-host demo-run --execute
```

Today, `--execute` returns a structured error with code:

```text
execution.not_implemented
```

It does not spawn processes, use a shell, import process execution APIs, or perform real command execution.

## Audit

Audit records include:

- `executionMode`
- `simulated`

For now:

- `simulate` records `simulated: true`
- `execute` is denied with `execution.not_implemented` and records `simulated: false`
