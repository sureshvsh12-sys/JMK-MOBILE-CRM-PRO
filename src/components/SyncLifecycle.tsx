import { useEffect, useRef } from "react";

import { useRealtimeSync } from "../hooks/useRealtimeSync";

/**
 * Single app-level controller for background sync and Supabase realtime.
 * It intentionally renders no UI and should be mounted only once.
 */
export default function SyncLifecycle() {
  const state = useRealtimeSync();
  const previousStatusRef = useRef(state.realtimeStatus);
  const previousErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousStatusRef.current !== state.realtimeStatus) {
      previousStatusRef.current = state.realtimeStatus;
      console.info(
        `[JMK Sync] Realtime status: ${state.realtimeStatus}`
      );
    }
  }, [state.realtimeStatus]);

  useEffect(() => {
    if (!state.error || previousErrorRef.current === state.error) return;

    previousErrorRef.current = state.error;
    console.warn(`[JMK Sync] ${state.error}`);
  }, [state.error]);

  useEffect(() => {
    if (!state.lastSyncAt) return;
    console.info(`[JMK Sync] Last successful sync: ${state.lastSyncAt}`);
  }, [state.lastSyncAt]);

  return null;
}
