import type { RealtimeChannel } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "./supabase";

export const CRM_REALTIME_TABLES = [
  "raw_contacts",
  "leads",
  "customers",
  "followups",
  "bookings",
  "finance",
  "solar",
] as const;

export type CrmRealtimeTable = (typeof CRM_REALTIME_TABLES)[number];

export type CrmRealtimeChange = {
  table: CrmRealtimeTable;
  eventType: "INSERT" | "UPDATE" | "DELETE" | "*";
  occurredAt: string;
  newRecord: Record<string, unknown> | null;
  oldRecord: Record<string, unknown> | null;
};

export type RealtimeStatus =
  | "disabled"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

type ChangeListener = (change: CrmRealtimeChange) => void;
type StatusListener = (status: RealtimeStatus) => void;

const MAX_RECONNECT_DELAY_MS = 30_000;
let activeChannel: RealtimeChannel | null = null;
let subscriberCount = 0;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let generation = 0;
const changeListeners = new Set<ChangeListener>();
const statusListeners = new Set<StatusListener>();
let currentStatus: RealtimeStatus = isSupabaseConfigured
  ? "disconnected"
  : "disabled";

function publishStatus(status: RealtimeStatus): void {
  currentStatus = status;
  statusListeners.forEach((listener) => listener(status));
}

function publishChange(change: CrmRealtimeChange): void {
  changeListeners.forEach((listener) => listener(change));
}

function clearReconnectTimer(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect(): void {
  if (!isSupabaseConfigured || subscriberCount === 0 || reconnectTimer) return;

  const delay = Math.min(
    1_000 * 2 ** Math.min(reconnectAttempts, 5),
    MAX_RECONNECT_DELAY_MS
  );
  reconnectAttempts += 1;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void restartCrmRealtime();
  }, delay);
}

function normalizeRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function startChannel(): void {
  if (!isSupabaseConfigured || activeChannel) {
    if (!isSupabaseConfigured) publishStatus("disabled");
    return;
  }

  clearReconnectTimer();
  publishStatus("connecting");
  const channelGeneration = ++generation;
  const channel = supabase.channel(`jmk-mobile-crm-realtime-${channelGeneration}`);

  CRM_REALTIME_TABLES.forEach((table) => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        if (channelGeneration !== generation) return;

        publishChange({
          table,
          eventType: payload.eventType,
          occurredAt: new Date().toISOString(),
          newRecord: normalizeRecord(payload.new),
          oldRecord: normalizeRecord(payload.old),
        });
      }
    );
  });

  channel.subscribe((status) => {
    if (channelGeneration !== generation) return;

    if (status === "SUBSCRIBED") {
      reconnectAttempts = 0;
      publishStatus("connected");
      return;
    }

    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      publishStatus("error");
      scheduleReconnect();
      return;
    }

    if (status === "CLOSED") {
      publishStatus("disconnected");
      scheduleReconnect();
    }
  });

  activeChannel = channel;
}

async function stopChannel(preserveStatus = false): Promise<void> {
  clearReconnectTimer();
  generation += 1;
  const channel = activeChannel;
  activeChannel = null;

  if (channel) {
    try {
      await supabase.removeChannel(channel);
    } catch {
      // Channel cleanup failure should not block app navigation or restart.
    }
  }

  if (!preserveStatus) {
    publishStatus(isSupabaseConfigured ? "disconnected" : "disabled");
  }
}

export function subscribeToCrmRealtime(
  onChange: ChangeListener,
  onStatus?: StatusListener
): () => void {
  changeListeners.add(onChange);

  if (onStatus) {
    statusListeners.add(onStatus);
    onStatus(currentStatus);
  }

  subscriberCount += 1;
  startChannel();

  let unsubscribed = false;

  return () => {
    if (unsubscribed) return;
    unsubscribed = true;

    changeListeners.delete(onChange);
    if (onStatus) statusListeners.delete(onStatus);
    subscriberCount = Math.max(0, subscriberCount - 1);

    if (subscriberCount === 0) {
      reconnectAttempts = 0;
      void stopChannel();
    }
  };
}

export async function restartCrmRealtime(): Promise<void> {
  await stopChannel(true);

  if (subscriberCount > 0) {
    startChannel();
  } else {
    publishStatus(isSupabaseConfigured ? "disconnected" : "disabled");
  }
}

export function getRealtimeStatus(): RealtimeStatus {
  return currentStatus;
}
