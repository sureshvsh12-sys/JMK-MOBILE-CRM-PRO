import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import { RELEASE_INFO } from "../constants/release";
import {
  getAuthAccount,
  getAuthSession,
} from "../storage/authStorage";
import { initializeDatabase } from "../storage/database";
import {
  getSyncConfig,
  getSyncQueue,
} from "../storage/syncStorage";

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

function resolveOverallStatus(
  checks: HealthCheck[]
): HealthStatus {
  if (checks.some((item) => item.status === "error")) {
    return "error";
  }

  if (checks.some((item) => item.status === "warning")) {
    return "warning";
  }

  return "healthy";
}

export async function runAppHealthCheck(): Promise<AppHealthReport> {
  const checks: HealthCheck[] = [];

  try {
    const testKey = "@jmk/health-check";

    await AsyncStorage.setItem(
      testKey,
      new Date().toISOString()
    );

    await AsyncStorage.removeItem(testKey);

    checks.push({
      id: "storage",
      label: "Offline Storage",
      detail: "AsyncStorage read/write working",
      status: "healthy",
    });
  } catch {
    checks.push({
      id: "storage",
      label: "Offline Storage",
      detail: "Local storage access failed",
      status: "error",
    });
  }

  try {
    await initializeDatabase();

    checks.push({
      id: "database",
      label: "CRM Database",
      detail: "Database migrations completed",
      status: "healthy",
    });
  } catch {
    checks.push({
      id: "database",
      label: "CRM Database",
      detail: "Database initialization failed",
      status: "error",
    });
  }

  const [account, session, syncConfig, queue] =
    await Promise.all([
      getAuthAccount(),
      getAuthSession(),
      getSyncConfig(),
      getSyncQueue(),
    ]);

  checks.push({
    id: "auth",
    label: "Admin Account",
    detail: account
      ? session
        ? `Signed in as ${session.user.name}`
        : "Admin account ready; session signed out"
      : "Owner admin account setup required",
    status: account ? "healthy" : "warning",
  });

  checks.push({
    id: "sync",
    label: "Cloud Sync",
    detail: syncConfig.apiBaseUrl
      ? `${queue.length} offline batch${
          queue.length === 1 ? "" : "es"
        } pending`
      : "Backend API URL not configured",
    status: syncConfig.apiBaseUrl
      ? queue.length > 0
        ? "warning"
        : "healthy"
      : "warning",
  });

  const appVersion =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    RELEASE_INFO.version;

  checks.push({
    id: "release",
    label: "Release Configuration",
    detail: `${RELEASE_INFO.androidPackage} • v${appVersion} (${RELEASE_INFO.androidVersionCode})`,
    status:
      appVersion === RELEASE_INFO.version
        ? "healthy"
        : "warning",
  });

  return {
    checkedAt: new Date().toISOString(),
    appVersion,
    overallStatus: resolveOverallStatus(checks),
    checks,
  };
}