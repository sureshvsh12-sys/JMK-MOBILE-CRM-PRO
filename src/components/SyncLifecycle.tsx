import { useRealtimeSync } from "../hooks/useRealtimeSync";

/**
 * App-level sync controller.
 *
 * This component intentionally renders nothing. Keeping it mounted under the
 * authentication provider enables automatic sync on app launch/resume,
 * scheduled retries, and one shared Supabase realtime subscription.
 */
export default function SyncLifecycle() {
  useRealtimeSync();
  return null;
}
