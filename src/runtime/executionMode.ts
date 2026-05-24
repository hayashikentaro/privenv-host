export type ExecutionMode = "simulate" | "execute";

export function isExecutionMode(value: string): value is ExecutionMode {
  return value === "simulate" || value === "execute";
}
