import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DATABASE_META_KEY,
  DATABASE_NAME,
  DATABASE_VERSION,
  STORAGE_KEYS,
  type DatabaseMeta,
} from "./schema";

const LEGACY_DEMO_IDS = new Set([
  "lead-1",
  "lead-2",
  "lead-3",
  "customer-1",
  "customer-2",
  "followup-1",
  "booking-1",
  "finance-sample-income",
  "finance-sample-expense",
]);

async function readMeta(): Promise<DatabaseMeta | null> {
  try {
    const raw = await AsyncStorage.getItem(DATABASE_META_KEY);
    return raw ? (JSON.parse(raw) as DatabaseMeta) : null;
  } catch {
    return null;
  }
}

async function cleanLegacyDemoRows(): Promise<void> {
  const collectionKeys = [
    STORAGE_KEYS.leads,
    STORAGE_KEYS.customers,
    STORAGE_KEYS.followUps,
    STORAGE_KEYS.bookings,
    STORAGE_KEYS.financeEntries,
  ];

  await Promise.all(
    collectionKeys.map(async (key) => {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return;

      try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        const cleaned = parsed.filter((item) => {
          if (!item || typeof item !== "object") return false;
          const id = String((item as { id?: unknown }).id || "");
          return !LEGACY_DEMO_IDS.has(id);
        });

        if (cleaned.length !== parsed.length) {
          await AsyncStorage.setItem(key, JSON.stringify(cleaned));
        }
      } catch {
        // Keep unreadable values untouched so backup/restore can recover them.
      }
    })
  );
}

async function removeLegacyNotificationSeeds(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.notifications);
  if (!raw) return;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    const demoTitles = new Set([
      "Today Follow-ups",
      "Booking Collection",
      "Finance Summary",
    ]);

    const cleaned = parsed.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const title = String((item as { title?: unknown }).title || "");
      return !demoTitles.has(title);
    });

    if (cleaned.length !== parsed.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(cleaned));
    }
  } catch {
    // Ignore invalid legacy notification payloads.
  }
}

export async function runDatabaseMigrations(): Promise<DatabaseMeta> {
  const currentMeta = await readMeta();
  const now = new Date().toISOString();

  if (!currentMeta || currentMeta.version < 2) {
    await cleanLegacyDemoRows();
    await removeLegacyNotificationSeeds();
  }

  const nextMeta: DatabaseMeta = {
    databaseName: DATABASE_NAME,
    version: DATABASE_VERSION,
    installedAt: currentMeta?.installedAt || now,
    migratedAt: now,
  };

  await AsyncStorage.setItem(DATABASE_META_KEY, JSON.stringify(nextMeta));
  return nextMeta;
}
