import AsyncStorage from "@react-native-async-storage/async-storage";

import { runDatabaseMigrations } from "./migrations";
import { STORAGE_KEYS, type StorageCollectionName } from "./schema";

export { DATABASE_NAME, DATABASE_VERSION, STORAGE_KEYS } from "./schema";
export type { DatabaseMeta, StorageCollectionName } from "./schema";

let initializationPromise: Promise<void> | null = null;

export function initializeDatabase(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = runDatabaseMigrations().then(() => undefined);
  }
  return initializationPromise;
}

export async function readCollection<T>(name: StorageCollectionName): Promise<T[]> {
  await initializeDatabase();
  const raw = await AsyncStorage.getItem(STORAGE_KEYS[name]);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export async function writeCollection<T>(
  name: StorageCollectionName,
  rows: readonly T[]
): Promise<void> {
  await initializeDatabase();
  await AsyncStorage.setItem(STORAGE_KEYS[name], JSON.stringify(rows));
}
