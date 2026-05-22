export interface ManifestEnvReference {
  name: string;
  source: "secret";
  exposedToGuest: false;
}

export interface ManifestCommand {
  program: string;
  args: string[];
}

export interface ManifestCapability {
  id: string;
  kind: "command";
  description: string;
  env?: ManifestEnvReference[];
  command: ManifestCommand;
}

export interface HostManifest {
  version: string;
  capabilities: ManifestCapability[];
}
