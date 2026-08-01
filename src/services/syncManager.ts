import AsyncStorage from "@react-native-async-storage/async-storage";

import { postJson } from "./apiClient";
import {
  getSyncConfig,
  getSyncQueue,
  replaceSyncQueue,
  saveSyncConfig,
} from "../storage/syncStorage";
import type { SyncEntity, SyncQueueItem, SyncResult } from "../types/sync";

const ENTITY_KEYS: Record<SyncEntity, string> = {
  rawContacts: "jmk_mobile_raw_contacts",
  customers: "jmk_mobile_customers",
  leads: "jmk_mobile_leads",
  followups: "jmk_mobile_followups",
  bookings: "jmk_mobile_bookings",
  bookingPayments: "jmk_mobile_booking_payments",
  bookingInstallments: "jmk_mobile_booking_installments",
  finance: "jmk_mobile_finance",
  solar: "jmk_mobile_solar",
  employees: "jmk_mobile_employees",
  notifications: "jmk_mobile_notifications",
};

const MAX_ATTEMPTS = 5;
const MAX_BATCHES_PER_RUN = 6;
let syncInFlight: Promise<SyncResult> | null = null;

async function collectPayload(): Promise<Record<SyncEntity, unknown[]>> {
  const entries = await AsyncStorage.multiGet(Object.values(ENTITY_KEYS));
  const byKey = new Map(entries);
  const payload = {} as Record<SyncEntity, unknown[]>;

  (Object.keys(ENTITY_KEYS) as SyncEntity[]).forEach((entity) => {
    const value = byKey.get(ENTITY_KEYS[entity]);

    try {
      const parsed = value ? JSON.parse(value) : [];
      payload[entity] = Array.isArray(parsed) ? parsed : [];
    } catch {
      payload[entity] = [];
    }
  });

  return payload;
}

function createQueueItem(payload: Record<SyncEntity, unknown[]>): SyncQueueItem {
  return {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
    payload,
  };
}

function hasSyncData(payload: Record<SyncEntity, unknown[]>): boolean {
  return (Object.keys(payload) as SyncEntity[]).some(
    (entity) => payload[entity].length > 0
  );
}

function payloadFingerprint(payload: Record<SyncEntity, unknown[]>): string {
  return (Object.keys(payload) as SyncEntity[])
    .map((entity) => `${entity}:${payload[entity].length}`)
    .join("|");
}

function dedupeBatches(batches: SyncQueueItem[]): SyncQueueItem[] {
  const seen = new Set<string>();

  return batches.filter((batch) => {
    const fingerprint = payloadFingerprint(batch.payload);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

async function sendBatch(apiBaseUrl: string, batch: SyncQueueItem): Promise<void> {
  await postJson(apiBaseUrl, "/api/mobile/sync", {
    app: "JMK Mobile CRM PRO Enterprise",
    deviceSyncedAt: new Date().toISOString(),
    batchId: batch.id,
    attempt: batch.attempts + 1,
    data: batch.payload,
  });
}

async function performSync(): Promise<SyncResult> {
  const config = await getSyncConfig();
  const apiBaseUrl = config.apiBaseUrl.trim().replace(/\/$/, "");

  if (!apiBaseUrl) {
    return {
      success: false,
      queued: false,
      message: "API URL configure nahi hai.",
    };
  }

  const queued = (await getSyncQueue()).filter(
    (batch) => batch.attempts < MAX_ATTEMPTS
  );
  const currentPayload = await collectPayload();
  const batches = dedupeBatches([
    ...queued,
    ...(hasSyncData(currentPayload) ? [createQueueItem(currentPayload)] : []),
  ]).slice(0, MAX_BATCHES_PER_RUN);

  if (batches.length === 0) {
    const syncedAt = new Date().toISOString();
    await saveSyncConfig({ ...config, apiBaseUrl, lastSyncAt: syncedAt });
    return {
      success: true,
      queued: false,
      message: "Sync ke liye koi pending data nahi hai.",
      syncedAt,
    };
  }

  const failedBatches: SyncQueueItem[] = [];
  let successfulBatches = 0;
  let firstError = "";

  for (const batch of batches) {
    try {
      await sendBatch(apiBaseUrl, batch);
      successfulBatches += 1;
    } catch (error) {
      if (!firstError) {
        firstError =
          error instanceof Error ? error.message : "Sync request fail hua";
      }

      const attempts = batch.attempts + 1;
      if (attempts < MAX_ATTEMPTS) {
        failedBatches.push({ ...batch, attempts });
      }
    }
  }

  const untouchedQueuedBatches = queued.slice(MAX_BATCHES_PER_RUN);
  await replaceSyncQueue([...failedBatches, ...untouchedQueuedBatches]);

  if (failedBatches.length === 0) {
    const syncedAt = new Date().toISOString();
    await saveSyncConfig({ ...config, apiBaseUrl, lastSyncAt: syncedAt });
    return {
      success: true,
      queued: untouchedQueuedBatches.length > 0,
      message:
        untouchedQueuedBatches.length > 0
          ? `${successfulBatches} batch sync hue. ${untouchedQueuedBatches.length} batch next run ke liye pending hain.`
          : `${successfulBatches} sync batch successfully complete hue.`,
      syncedAt,
    };
  }

  if (successfulBatches > 0) {
    return {
      success: false,
      queued: true,
      message: `${successfulBatches} batch sync hue aur ${failedBatches.length} pending queue me safe hain.`,
    };
  }

  return {
    success: false,
    queued: failedBatches.length > 0,
    message: `${firstError || "Sync request fail hua"}. ${failedBatches.length} batch offline queue me safe hain.`,
  };
}

export function syncNow(): Promise<SyncResult> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = performSync().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}
