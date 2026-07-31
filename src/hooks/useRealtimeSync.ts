import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { handleRealtimeAlert } from "../services/notificationAlertService";
import {
  subscribeToCrmRealtime,
  type CrmRealtimeChange,
  type RealtimeStatus,
} from "../services/realtimeService";
import { syncNow } from "../services/syncManager";
import { getSyncConfig } from "../storage/syncStorage";

const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const REALTIME_SYNC_DEBOUNCE_MS = 1500;

export type RealtimeSyncState = {
  realtimeStatus: RealtimeStatus;
  syncing: boolean;
  lastChange: CrmRealtimeChange | null;
  lastSyncAt: string;
  error: string | null;
};

export function useRealtimeSync(): RealtimeSyncState {
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>("disconnected");
  const [syncing, setSyncing] = useState(false);
  const [lastChange, setLastChange] =
    useState<CrmRealtimeChange | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const syncInFlightRef = useRef(false);
  const realtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runAutomaticSync = useCallback(async () => {
    if (syncInFlightRef.current) return;

    const config = await getSyncConfig();
    if (!config.autoSyncEnabled || !config.apiBaseUrl.trim()) return;

    syncInFlightRef.current = true;

    if (mountedRef.current) {
      setSyncing(true);
      setError(null);
    }

    try {
      const result = await syncNow();
      if (!mountedRef.current) return;

      if (result.success) {
        setLastSyncAt(result.syncedAt ?? new Date().toISOString());
      } else if (!result.queued) {
        setError(result.message);
      }
    } catch (reason) {
      if (mountedRef.current) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Automatic sync complete nahi ho saka."
        );
      }
    } finally {
      syncInFlightRef.current = false;
      if (mountedRef.current) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribeRealtime = subscribeToCrmRealtime(
      (change) => {
        if (!mountedRef.current) return;
        setLastChange(change);

        void handleRealtimeAlert(change).catch((reason) => {
          console.error("Realtime notification failed:", reason);
        });

        if (realtimeTimerRef.current) {
          clearTimeout(realtimeTimerRef.current);
        }

        realtimeTimerRef.current = setTimeout(() => {
          void runAutomaticSync();
        }, REALTIME_SYNC_DEBOUNCE_MS);
      },
      (status) => {
        if (mountedRef.current) setRealtimeStatus(status);
      }
    );

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        void runAutomaticSync();
      }
    };

    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    const interval = setInterval(() => {
      if (AppState.currentState === "active") {
        void runAutomaticSync();
      }
    }, AUTO_SYNC_INTERVAL_MS);

    void runAutomaticSync();

    return () => {
      mountedRef.current = false;
      unsubscribeRealtime();
      appStateSubscription.remove();
      clearInterval(interval);

      if (realtimeTimerRef.current) {
        clearTimeout(realtimeTimerRef.current);
      }
    };
  }, [runAutomaticSync]);

  return {
    realtimeStatus,
    syncing,
    lastChange,
    lastSyncAt,
    error,
  };
}
