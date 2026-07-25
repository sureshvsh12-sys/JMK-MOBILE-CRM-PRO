import { useCallback, useEffect, useState } from "react";

import { syncNow } from "../services/syncManager";
import { getSyncConfig, getSyncQueue, saveSyncConfig } from "../storage/syncStorage";
import type { SyncConfig, SyncResult } from "../types/sync";

export function useSync() {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const [nextConfig, queue] = await Promise.all([getSyncConfig(), getSyncQueue()]);
    setConfig(nextConfig);
    setQueueCount(queue.length);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveConfig = useCallback(async (nextConfig: SyncConfig) => {
    await saveSyncConfig(nextConfig);
    setConfig(nextConfig);
  }, []);

  const runSync = useCallback(async (): Promise<SyncResult> => {
    setSyncing(true);
    try {
      const result = await syncNow();
      await refresh();
      return result;
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  return { config, queueCount, syncing, saveConfig, runSync, refresh };
}
