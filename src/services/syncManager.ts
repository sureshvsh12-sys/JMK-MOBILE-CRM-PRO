import AsyncStorage from "@react-native-async-storage/async-storage";

import { postJson } from "./apiClient";
import { enqueueSync, getSyncConfig, getSyncQueue, replaceSyncQueue, saveSyncConfig } from "../storage/syncStorage";
import type { SyncEntity, SyncQueueItem, SyncResult } from "../types/sync";

const ENTITY_KEYS: Record<SyncEntity, string> = {
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

export async function syncNow(): Promise<SyncResult> {
  const config = await getSyncConfig();
  const payload = await collectPayload();

  if (!config.apiBaseUrl.trim()) {
    return { success: false, queued: false, message: "API URL configure nahi hai." };
  }

  try {
    const queued = await getSyncQueue();
    const batches = [...queued, createQueueItem(payload)];

    for (const batch of batches) {
      await postJson(config.apiBaseUrl, "/api/mobile/sync", {
        app: "JMK Mobile CRM PRO Enterprise",
        deviceSyncedAt: new Date().toISOString(),
        batchId: batch.id,
        data: batch.payload,
      });
    }

    await replaceSyncQueue([]);
    const syncedAt = new Date().toISOString();
    await saveSyncConfig({ ...config, lastSyncAt: syncedAt });

    return { success: true, queued: false, message: "CRM data successfully sync ho gaya.", syncedAt };
  } catch (error) {
    await enqueueSync(createQueueItem(payload));
    return {
      success: false,
      queued: true,
      message: error instanceof Error ? `${error.message}. Data offline queue me save hai.` : "Sync fail hua. Data offline queue me save hai.",
    };
  }
}
