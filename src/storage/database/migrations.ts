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

const LEGACY_DEMO_NOTIFICATION_TITLES = new Set([
  "Today Follow-ups",
  "Booking Collection",
  "Finance Summary",
]);

const EXTRA_COLLECTION_KEYS = [
  "jmk_mobile_booking_payments",
  "jmk_mobile_booking_installments",
  "jmk_mobile_customer_activities",
  "jmk_mobile_customer_documents",
  "jmk_mobile_solar_projects",
  "jmk_mobile_employees",
];

const PENDING_OPERATION_KEYS = [
  "jmk_mobile_followups_pending_operations",
  "jmk_mobile_customer_pending_operations",
  "jmk_mobile_sync_queue",
];

function stringField(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return "";
}

function referencesLegacyDemo(record: Record<string, unknown>): boolean {
  const candidateIds = [
    stringField(record, ["id"]),
    stringField(record, ["leadId", "lead_id"]),
    stringField(record, ["customerId", "customer_id"]),
    stringField(record, ["followUpId", "followup_id"]),
    stringField(record, ["bookingId", "booking_id"]),
    stringField(record, ["rawContactId", "raw_contact_id"]),
  ];

  return candidateIds.some((id) => LEGACY_DEMO_IDS.has(id));
}

async function readMeta(): Promise<DatabaseMeta | null> {
  try {
    const raw = await AsyncStorage.getItem(DATABASE_META_KEY);
    return raw ? (JSON.parse(raw) as DatabaseMeta) : null;
  } catch {
    return null;
  }
}

async function cleanCollection(key: string): Promise<void> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    const cleaned = parsed.filter((item) => {
      if (!item || typeof item !== "object") return false;
      return !referencesLegacyDemo(item as Record<string, unknown>);
    });

    if (cleaned.length !== parsed.length) {
      await AsyncStorage.setItem(key, JSON.stringify(cleaned));
    }
  } catch {
    // Leave unreadable local data untouched so backup/restore can recover it.
  }
}

async function cleanLegacyDemoRows(): Promise<void> {
  const collectionKeys = [
    STORAGE_KEYS.leads,
    STORAGE_KEYS.customers,
    STORAGE_KEYS.followUps,
    STORAGE_KEYS.bookings,
    STORAGE_KEYS.financeEntries,
    ...EXTRA_COLLECTION_KEYS,
  ];

  await Promise.all(collectionKeys.map(cleanCollection));
}

async function cleanPendingOperations(): Promise<void> {
  await Promise.all(PENDING_OPERATION_KEYS.map(cleanCollection));
}

async function removeLegacyNotificationSeeds(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.notifications);
  if (!raw) return;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    const cleaned = parsed.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      const id = stringField(record, ["id"]);
      const title = stringField(record, ["title"]);
      return !LEGACY_DEMO_IDS.has(id) && !LEGACY_DEMO_NOTIFICATION_TITLES.has(title);
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

  if (!currentMeta || currentMeta.version < 3) {
    await cleanLegacyDemoRows();
    await cleanPendingOperations();
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
