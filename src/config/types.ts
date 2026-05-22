export interface HostConfigEnvReference {
  name: string;
  source: "secret";
  exposedToGuest: false;
}

export interface HostConfigCommand {
  program: string;
  args: string[];
}

export interface HostConfigCapability {
  id: string;
  kind: "command";
  description: string;
  command: HostConfigCommand;
  env: HostConfigEnvReference[];
  timeoutMs: number;
  redactionPolicy: "default";
}

export interface HostConfig {
  version: string;
  capabilities: HostConfigCapability[];
}
