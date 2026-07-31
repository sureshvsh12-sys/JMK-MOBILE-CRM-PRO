import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SyncConfig, SyncQueueItem } from "../types/sync";

const CONFIG_KEY = "jmk_mobile_sync_config";
const QUEUE_KEY = "jmk_mobile_sync_queue";
const MAX_QUEUE_ITEMS = 10;

const DEFAULT_CONFIG: SyncConfig = {
  apiBaseUrl: "",
  autoSyncEnabled: false,
  lastSyncAt: "",
};

export async function getSyncConfig(): Promise<SyncConfig> {
  try {
    const value = await AsyncStorage.getItem(CONFIG_KEY);
    if (!value) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...(JSON.parse(value) as Partial<SyncConfig>) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveSyncConfig(config: SyncConfig): Promise<void> {
  const normalized: SyncConfig = {
    ...config,
    apiBaseUrl: config.apiBaseUrl.trim().replace(/\/$/, ""),
  };
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(normalized));
}

function isQueueItem(value: unknown): value is SyncQueueItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SyncQueueItem>;
  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.attempts === "number" &&
    !!item.payload &&
    typeof item.payload === "object"
  );
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const value = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter(isQueueItem) : [];
  } catch {
    return [];
  }
}

export async function enqueueSync(item: SyncQueueItem): Promise<void> {
  const queue = await getSyncQueue();
  const withoutDuplicate = queue.filter((queuedItem) => queuedItem.id !== item.id);
  const nextQueue = [...withoutDuplicate, item].slice(-MAX_QUEUE_ITEMS);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(nextQueue));
}

export async function replaceSyncQueue(queue: SyncQueueItem[]): Promise<void> {
  const validQueue = queue.filter(isQueueItem).slice(-MAX_QUEUE_ITEMS);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(validQueue));
}

export async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
