export class ExecutionContextResolutionError extends Error {
  readonly code = "execution.unresolved_env";

  constructor(readonly envName: string) {
    super(`Unable to resolve required env reference "${envName}".`);
  }
}
