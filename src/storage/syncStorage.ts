import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SyncConfig, SyncQueueItem } from "../types/sync";

const CONFIG_KEY = "jmk_mobile_sync_config";
const QUEUE_KEY = "jmk_mobile_sync_queue";

const DEFAULT_CONFIG: SyncConfig = {
  apiBaseUrl: "",
  autoSyncEnabled: false,
  lastSyncAt: "",
};

export async function getSyncConfig(): Promise<SyncConfig> {
  try {
    const value = await AsyncStorage.getItem(CONFIG_KEY);
    if (!value) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(value) as Partial<SyncConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveSyncConfig(config: SyncConfig): Promise<void> {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const value = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? (parsed as SyncQueueItem[]) : [];
  } catch {
    return [];
  }
}

export async function enqueueSync(item: SyncQueueItem): Promise<void> {
  const queue = await getSyncQueue();
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, item].slice(-10)));
}

export async function replaceSyncQueue(queue: SyncQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
