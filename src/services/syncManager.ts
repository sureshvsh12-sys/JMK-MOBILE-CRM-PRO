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

async function sendBatch(apiBaseUrl: string, batch: SyncQueueItem): Promise<void> {
  await postJson(apiBaseUrl, "/api/mobile/sync", {
    app: "JMK Mobile CRM PRO Enterprise",
    deviceSyncedAt: new Date().toISOString(),
    batchId: batch.id,
    attempt: batch.attempts + 1,
    data: batch.payload,
  });
}

export async function syncNow(): Promise<SyncResult> {
  const config = await getSyncConfig();
  const apiBaseUrl = config.apiBaseUrl.trim().replace(/\/$/, "");

  if (!apiBaseUrl) {
    return { success: false, queued: false, message: "API URL configure nahi hai." };
  }

  const queued = await getSyncQueue();
  const currentBatch = createQueueItem(await collectPayload());
  const batches = [...queued, currentBatch];
  const failedBatches: SyncQueueItem[] = [];
  let successfulBatches = 0;
  let firstError = "";

  for (const batch of batches) {
    try {
      await sendBatch(apiBaseUrl, batch);
      successfulBatches += 1;
    } catch (error) {
      if (!firstError) {
        firstError = error instanceof Error ? error.message : "Sync request fail hua";
      }
      failedBatches.push({ ...batch, attempts: batch.attempts + 1 });
    }
  }

  await replaceSyncQueue(failedBatches);

  if (failedBatches.length === 0) {
    const syncedAt = new Date().toISOString();
    await saveSyncConfig({ ...config, apiBaseUrl, lastSyncAt: syncedAt });
    return {
      success: true,
      queued: false,
      message: `${successfulBatches} sync batch successfully complete hue.`,
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
    queued: true,
    message: `${firstError}. ${failedBatches.length} batch offline queue me safe hain.`,
  };
}
