import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import { RELEASE_INFO } from "../constants/release";
import { getAuthAccount, getAuthSession } from "../storage/authStorage";
import { initializeDatabase } from "../storage/database";
import { getSyncConfig, getSyncQueue } from "../storage/syncStorage";
import { getRealtimeStatus } from "./realtimeService";
import { isSupabaseConfigured, supabase } from "./supabase";

export type HealthStatus = "healthy" | "warning" | "error";

export type HealthCheck = {
  id: string;
  label: string;
  detail: string;
  status: HealthStatus;
};

export type AppHealthReport = {
  checkedAt: string;
  appVersion: string;
  overallStatus: HealthStatus;
  checks: HealthCheck[];
};

const HEALTH_STORAGE_KEY = "@jmk/health-check";
const SUPABASE_TIMEOUT_MS = 8_000;

function resolveOverallStatus(checks: HealthCheck[]): HealthStatus {
  if (checks.some((item) => item.status === "error")) return "error";
  if (checks.some((item) => item.status === "warning")) return "warning";
  return "healthy";
}

function pluralize(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Health check request timed out")),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function checkOfflineStorage(): Promise<HealthCheck> {
  try {
    const value = new Date().toISOString();
    await AsyncStorage.setItem(HEALTH_STORAGE_KEY, value);
    const storedValue = await AsyncStorage.getItem(HEALTH_STORAGE_KEY);
    await AsyncStorage.removeItem(HEALTH_STORAGE_KEY);

    if (storedValue !== value) {
      return {
        id: "storage",
        label: "Offline Storage",
        detail: "AsyncStorage write completed but verification failed",
        status: "error",
      };
    }

    return {
      id: "storage",
      label: "Offline Storage",
      detail: "AsyncStorage read, write and cleanup working",
      status: "healthy",
    };
  } catch (error) {
    return {
      id: "storage",
      label: "Offline Storage",
      detail: error instanceof Error ? error.message : "Local storage access failed",
      status: "error",
    };
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await initializeDatabase();
    return {
      id: "database",
      label: "CRM Database",
      detail: "Database schema and migrations initialized",
      status: "healthy",
    };
  } catch (error) {
    return {
      id: "database",
      label: "CRM Database",
      detail: error instanceof Error ? error.message : "Database initialization failed",
      status: "error",
    };
  }
}

async function checkSupabase(): Promise<HealthCheck> {
  if (!isSupabaseConfigured) {
    return {
      id: "supabase",
      label: "Supabase Cloud",
      detail: "EXPO_PUBLIC_SUPABASE_URL or anon key is not configured",
      status: "warning",
    };
  }

  try {
    const startedAt = Date.now();
    const response = await withTimeout(
      supabase.from("raw_contacts").select("id", { count: "exact", head: true }),
      SUPABASE_TIMEOUT_MS
    );

    if (response.error) {
      return {
        id: "supabase",
        label: "Supabase Cloud",
        detail: response.error.message,
        status: "error",
      };
    }

    return {
      id: "supabase",
      label: "Supabase Cloud",
      detail: `Connected • ${Date.now() - startedAt} ms response • ${pluralize(
        response.count ?? 0,
        "raw contact"
      )}`,
      status: "healthy",
    };
  } catch (error) {
    return {
      id: "supabase",
      label: "Supabase Cloud",
      detail: error instanceof Error ? error.message : "Cloud connection failed",
      status: "error",
    };
  }
}

function checkRealtime(): HealthCheck {
  const realtimeStatus = getRealtimeStatus();

  if (!isSupabaseConfigured || realtimeStatus === "disabled") {
    return {
      id: "realtime",
      label: "Realtime Sync",
      detail: "Realtime is disabled because Supabase is not configured",
      status: "warning",
    };
  }

  if (realtimeStatus === "connected") {
    return {
      id: "realtime",
      label: "Realtime Sync",
      detail: "CRM realtime channel connected",
      status: "healthy",
    };
  }

  if (realtimeStatus === "connecting") {
    return {
      id: "realtime",
      label: "Realtime Sync",
      detail: "CRM realtime channel is connecting",
      status: "warning",
    };
  }

  if (realtimeStatus === "error") {
    return {
      id: "realtime",
      label: "Realtime Sync",
      detail: "CRM realtime channel reported an error",
      status: "error",
    };
  }

  return {
    id: "realtime",
    label: "Realtime Sync",
    detail: "Realtime channel is currently disconnected",
    status: "warning",
  };
}

export async function runAppHealthCheck(): Promise<AppHealthReport> {
  const [storageCheck, databaseCheck, supabaseCheck, account, session, syncConfig, queue] =
    await Promise.all([
      checkOfflineStorage(),
      checkDatabase(),
      checkSupabase(),
      getAuthAccount(),
      getAuthSession(),
      getSyncConfig(),
      getSyncQueue(),
    ]);

  const checks: HealthCheck[] = [storageCheck, databaseCheck, supabaseCheck, checkRealtime()];

  checks.push({
    id: "auth",
    label: "Admin Account",
    detail: account
      ? session
        ? `Signed in as ${session.user.name}`
        : "Admin account exists; current session is signed out"
      : "Owner admin account setup is required",
    status: account ? (session ? "healthy" : "warning") : "warning",
  });

  checks.push({
    id: "sync",
    label: "Offline Sync Queue",
    detail: syncConfig.apiBaseUrl
      ? queue.length > 0
        ? `${pluralize(queue.length, "offline change")} waiting to sync`
        : "No offline changes are waiting to sync"
      : isSupabaseConfigured
        ? `${pluralize(queue.length, "offline change")} pending • Supabase mode active`
        : "Backend API URL and Supabase are not configured",
    status:
      queue.length > 25
        ? "error"
        : queue.length > 0 || (!syncConfig.apiBaseUrl && !isSupabaseConfigured)
          ? "warning"
          : "healthy",
  });

  const appVersion =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    RELEASE_INFO.version;
  const configuredVersionCode = Constants.expoConfig?.android?.versionCode;
  const releaseMatches =
    appVersion === RELEASE_INFO.version &&
    (configuredVersionCode == null || configuredVersionCode === RELEASE_INFO.androidVersionCode);

  checks.push({
    id: "release",
    label: "Release Configuration",
    detail: `${RELEASE_INFO.androidPackage} • v${appVersion} (${configuredVersionCode ?? RELEASE_INFO.androidVersionCode})`,
    status: releaseMatches ? "healthy" : "warning",
  });

  return {
    checkedAt: new Date().toISOString(),
    appVersion,
    overallStatus: resolveOverallStatus(checks),
    checks,
  };
}
