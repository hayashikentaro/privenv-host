import type { HostConfig, HostConfigCapability } from "../config/index.js";
import { FIXTURE_HOST_CONFIG } from "../config/index.js";
import type { HostManifest, ManifestCapability } from "./types.js";

export function createSafeManifest(config: HostConfig = FIXTURE_HOST_CONFIG): HostManifest {
  return {
    version: config.version,
    capabilities: config.capabilities.map(toSafeManifestCapability)
  };
}

export function findCapability(config: HostConfig, capabilityId: string): HostConfigCapability | undefined {
  return config.capabilities.find((capability) => capability.id === capabilityId);
}

function toSafeManifestCapability(capability: HostConfigCapability): ManifestCapability {
  return {
    id: capability.id,
    kind: capability.kind,
    description: capability.description,
    command: {
      program: capability.command.program,
      args: [...capability.command.args]
    },
    env: capability.env.map((entry) => ({
      name: entry.name,
      source: "secret",
      exposedToGuest: false
    }))
  };
}
