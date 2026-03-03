import { HttpAgent } from "@icp-sdk/core/agent";
import { useEffect, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { useInternetIdentity } from "./useInternetIdentity";

let anonStorageClient: StorageClient | null = null;
let anonStoragePromise: Promise<StorageClient> | null = null;

export async function getAnonymousStorageClient(): Promise<StorageClient> {
  if (anonStorageClient) return anonStorageClient;
  if (anonStoragePromise) return anonStoragePromise;

  anonStoragePromise = (async () => {
    const config = await loadConfig();
    const agent = new HttpAgent({ host: config.backend_host });
    const client = new StorageClient(
      config.bucket_name,
      config.storage_gateway_url,
      config.backend_canister_id,
      config.project_id,
      agent,
    );
    anonStorageClient = client;
    return client;
  })();

  return anonStoragePromise;
}

export function useStorageClient(): StorageClient | null {
  const { identity } = useInternetIdentity();
  const [client, setClient] = useState<StorageClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const config = await loadConfig();
      const agentOptions = identity ? { identity } : {};
      const agent = new HttpAgent({
        ...agentOptions,
        host: config.backend_host,
      });
      if (!cancelled) {
        setClient(
          new StorageClient(
            config.bucket_name,
            config.storage_gateway_url,
            config.backend_canister_id,
            config.project_id,
            agent,
          ),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [identity]);

  return client;
}
