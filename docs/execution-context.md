# Execution Context

`ResolvedExecutionContext` is a Host-internal object. It represents the point where a declared capability becomes an execution-ready Host plan.

It contains:

- resolved capability
- validated command
- internally resolved env values
- timeout
- redaction policy

It must never appear in Guest-facing protocol types, `EffectResponse`, safe manifest generation, or audit logs with raw values.

## Host-Only Materialization

Secret materialization happens only after:

1. the Guest sends an `EffectRequest` containing `capabilityId`
2. the Host resolves the capability from `HostConfig`
3. the Host validates command policy
4. the Host resolves env references through a vault lookup

The Guest can name a capability. The Guest cannot request raw env values.

## Late Env Resolution

Env values are resolved late so the Host can keep secret ownership separate from capability declaration.

`privenv.host.json` may contain env names such as `DATABASE_URL`, but it must not contain the database URL value. The vault owns values. The execution context receives those values only immediately before the simulated execution step.

## No Global process.env Mutation

The execution context stores env values in a plain Host-internal object. The skeleton does not mutate `process.env`, read real `.env`, or expose `process.env` to Guest responses.

Future real execution should pass an explicit env map to an approved executor without `shell=true` and without unrestricted command strings.

## Audit and Response Safety

Audit records may include env names, because names help explain which references were involved. Audit records must not include env values.

Effect responses must not include env values. If fake execution emits fixture secrets for tests, redaction must replace them before the response is returned.
