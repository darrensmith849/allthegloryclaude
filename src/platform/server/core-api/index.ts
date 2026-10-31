import "server-only";
import { serverEnv } from "../env";
import { DisabledCoreApi, HttpCoreApi } from "./http";
import type { CoreApi } from "./types";

let instance: CoreApi | undefined;

export async function coreApi(): Promise<CoreApi> {
  if (instance) return instance;
  const env = serverEnv();
  switch (env.coreApiMode) {
    case "http":
      instance = new HttpCoreApi(env.coreApiUrl!, env.coreApiToken!, env.coreApiSigningSecret!);
      break;
    case "dev-file": {
      // Loaded on demand so the Node file-system module never enters the edge bundle path in production.
      const { DevFileCoreApi } = await import("./dev-store");
      instance = new DevFileCoreApi(env.devStorePath);
      break;
    }
    default:
      instance = new DisabledCoreApi();
  }
  return instance;
}

export * from "./types";
