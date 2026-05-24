import type { GuestManifest, ManifestCapability as SharedManifestCapability, ManifestEnvReference } from "@privenv/protocol";

export interface ManifestCommand {
  program: string;
  args: string[];
}

export type ManifestCapability = SharedManifestCapability & {
  command: ManifestCommand;
};

export type HostManifest = GuestManifest & {
  capabilities: ManifestCapability[];
};

export type { ManifestEnvReference };
