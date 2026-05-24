import type { HostConfig } from "../config/index.js";

export const STARTER_HOST_CONFIG: HostConfig = {
  version: "0.1",
  capabilities: [
    {
      id: "cmd.npm.test",
      kind: "command",
      description: "Run npm test.",
      command: { program: "npm", args: ["test"] },
      env: [],
      timeoutMs: 30000,
      redactionPolicy: "default"
    },
    {
      id: "cmd.npm.lint",
      kind: "command",
      description: "Run npm run lint.",
      command: { program: "npm", args: ["run", "lint"] },
      env: [],
      timeoutMs: 30000,
      redactionPolicy: "default"
    },
    {
      id: "cmd.npm.typecheck",
      kind: "command",
      description: "Run npm run typecheck.",
      command: { program: "npm", args: ["run", "typecheck"] },
      env: [],
      timeoutMs: 30000,
      redactionPolicy: "default"
    }
  ]
};

export const STARTER_VAULT_EXAMPLE = {
  version: "0.1",
  secrets: {
    EXAMPLE_DATABASE_URL: {
      value: "example-secret-placeholder-not-real",
      classification: "secret"
    },
    EXAMPLE_USER_EMAIL: {
      value: "example-pii-placeholder-not-real",
      classification: "pii"
    },
    EXAMPLE_SERVICE_TOKEN: {
      value: "example-token-placeholder-not-real",
      classification: "token"
    }
  }
};

export const REQUIRED_GITIGNORE_PATTERNS = [
  ".env",
  ".env.*",
  "!.env.example",
  ".privenv/",
  "privenv.manifest.json",
  "audit.log.jsonl"
];

export function serializeStarterJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
