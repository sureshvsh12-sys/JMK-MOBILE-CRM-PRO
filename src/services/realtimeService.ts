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

let activeChannel: RealtimeChannel | null = null;
let subscriberCount = 0;
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

function startChannel(): void {
  if (!isSupabaseConfigured || activeChannel) {
    if (!isSupabaseConfigured) publishStatus("disabled");
    return;
  }

  publishStatus("connecting");
  const channel = supabase.channel("jmk-mobile-crm-realtime");

  CRM_REALTIME_TABLES.forEach((table) => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        publishChange({
          table,
          eventType: payload.eventType,
          occurredAt: new Date().toISOString(),
          newRecord:
            payload.new && typeof payload.new === "object"
              ? (payload.new as Record<string, unknown>)
              : null,
          oldRecord:
            payload.old && typeof payload.old === "object"
              ? (payload.old as Record<string, unknown>)
              : null,
        });
      }
    );
  });

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      publishStatus("connected");
      return;
    }

    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      publishStatus("error");
      return;
    }

    if (status === "CLOSED") {
      publishStatus("disconnected");
    }
  });

  activeChannel = channel;
}

async function stopChannel(): Promise<void> {
  const channel = activeChannel;
  activeChannel = null;

  if (channel) {
    await supabase.removeChannel(channel);
  }

  publishStatus(isSupabaseConfigured ? "disconnected" : "disabled");
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
      void stopChannel();
    }
  };
}

export async function restartCrmRealtime(): Promise<void> {
  await stopChannel();
  if (subscriberCount > 0) startChannel();
}

export function getRealtimeStatus(): RealtimeStatus {
  return currentStatus;
}
