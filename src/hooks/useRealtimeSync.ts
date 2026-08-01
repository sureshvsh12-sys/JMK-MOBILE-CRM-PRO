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
const REALTIME_SYNC_DEBOUNCE_MS = 1400;
const RETRY_DELAYS_MS = [5000, 15000, 30000, 60000] as const;

export type RealtimeSyncState = {
  realtimeStatus: RealtimeStatus;
  syncing: boolean;
  lastChange: CrmRealtimeChange | null;
  lastSyncAt: string;
  error: string | null;
};

function toErrorMessage(reason: unknown) {
  return reason instanceof Error
    ? reason.message
    : "Automatic sync complete nahi ho saka.";
}

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
  const retryAttemptRef = useRef(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const realtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const scheduleRetry = useCallback((retry: () => void) => {
    clearRetryTimer();

    const index = Math.min(
      retryAttemptRef.current,
      RETRY_DELAYS_MS.length - 1
    );
    const delay = RETRY_DELAYS_MS[index];
    retryAttemptRef.current += 1;

    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      if (mountedRef.current && AppState.currentState === "active") {
        retry();
      }
    }, delay);
  }, [clearRetryTimer]);

  const runAutomaticSync = useCallback(async () => {
    if (syncInFlightRef.current || !mountedRef.current) return;

    let config;
    try {
      config = await getSyncConfig();
    } catch (reason) {
      if (mountedRef.current) setError(toErrorMessage(reason));
      return;
    }

    if (!config.autoSyncEnabled || !config.apiBaseUrl.trim()) {
      clearRetryTimer();
      retryAttemptRef.current = 0;
      return;
    }

    syncInFlightRef.current = true;
    setSyncing(true);
    setError(null);

    try {
      const result = await syncNow();
      if (!mountedRef.current) return;

      if (result.success) {
        clearRetryTimer();
        retryAttemptRef.current = 0;
        setLastSyncAt(result.syncedAt ?? new Date().toISOString());
        setError(null);
        return;
      }

      if (!result.queued) {
        setError(result.message);
        scheduleRetry(() => {
          void runAutomaticSync();
        });
      }
    } catch (reason) {
      if (mountedRef.current) {
        setError(toErrorMessage(reason));
        scheduleRetry(() => {
          void runAutomaticSync();
        });
      }
    } finally {
      syncInFlightRef.current = false;
      if (mountedRef.current) setSyncing(false);
    }
  }, [clearRetryTimer, scheduleRetry]);

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribeRealtime = subscribeToCrmRealtime(
      (change) => {
        if (!mountedRef.current) return;

        setLastChange(change);
        setError(null);

        void handleRealtimeAlert(change).catch((reason) => {
          console.error("Realtime notification failed:", reason);
        });

        if (realtimeTimerRef.current) {
          clearTimeout(realtimeTimerRef.current);
        }

        realtimeTimerRef.current = setTimeout(() => {
          realtimeTimerRef.current = null;
          void runAutomaticSync();
        }, REALTIME_SYNC_DEBOUNCE_MS);
      },
      (status) => {
        if (!mountedRef.current) return;
        setRealtimeStatus(status);

        if (status === "connected") {
          setError(null);
          retryAttemptRef.current = 0;
        }
      }
    );

    const handleAppStateChange = (nextState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === "active" && previousState !== "active") {
        clearRetryTimer();
        retryAttemptRef.current = 0;
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
      syncInFlightRef.current = false;
      unsubscribeRealtime();
      appStateSubscription.remove();
      clearInterval(interval);
      clearRetryTimer();

      if (realtimeTimerRef.current) {
        clearTimeout(realtimeTimerRef.current);
        realtimeTimerRef.current = null;
      }
    };
  }, [clearRetryTimer, runAutomaticSync]);

  return {
    realtimeStatus,
    syncing,
    lastChange,
    lastSyncAt,
    error,
  };
}
