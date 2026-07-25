import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "jmk_mobile_settings";

export type AppSettings = {
  companyName: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  defaultSegment: "Finance" | "Assets" | "Solar";
  notificationsEnabled: boolean;
  darkMode: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  companyName: "JMK Group",
  ownerName: "Suresh Vishwakarma",
  mobile: "9753109732",
  email: "",
  address: "37-B, Tilak Nagar, AB Road, Dewas 455001",
  defaultSegment: "Finance",
  notificationsEnabled: true,
  darkMode: true,
};

const CRM_KEYS = [
  "jmk_mobile_settings",
  "jmk_mobile_notifications",
  "jmk_mobile_customers",
  "jmk_mobile_customer_activities",
  "jmk_mobile_customer_documents",
  "jmk_mobile_leads",
  "jmk_mobile_followups",
  "jmk_mobile_bookings",
  "jmk_mobile_booking_payments",
  "jmk_mobile_booking_installments",
  "jmk_mobile_finance",
  "jmk_mobile_solar",
  "jmk_mobile_employees",
  "jmk_mobile_inventory",
];

export async function getSettings(): Promise<AppSettings> {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!value) {
      await saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...(JSON.parse(value) as Partial<AppSettings>),
    };
  } catch (error) {
    console.error("Unable to load settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(
  settings: AppSettings
): Promise<void> {
  await AsyncStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
  );
}

export async function createBackup(): Promise<string> {
  const entries = await AsyncStorage.multiGet(CRM_KEYS);

  const data = entries.reduce<Record<string, unknown>>(
    (result, [key, value]) => {
      if (value === null) {
        result[key] = null;
        return result;
      }

      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }

      return result;
    },
    {}
  );

  return JSON.stringify(
    {
      app: "JMK Mobile CRM PRO Enterprise",
      version: 2,
      createdAt: new Date().toISOString(),
      data,
    },
    null,
    2
  );
}

export async function restoreBackup(
  backupText: string
): Promise<void> {
  const parsed = JSON.parse(backupText) as {
    app?: string;
    data?: Record<string, unknown>;
  };

  if (!parsed.data || typeof parsed.data !== "object") {
    throw new Error("Invalid backup file");
  }

  const entries: [string, string][] = [];

  for (const [key, value] of Object.entries(parsed.data)) {
    if (!CRM_KEYS.includes(key) || value === null) {
      continue;
    }

    entries.push([
      key,
      typeof value === "string"
        ? value
        : JSON.stringify(value),
    ]);
  }

  if (!entries.length) {
    throw new Error("Backup me restore karne layak data nahi mila");
  }

  await AsyncStorage.multiSet(entries);
}

export async function clearAllCrmData(): Promise<void> {
  await AsyncStorage.multiRemove(CRM_KEYS);
  await saveSettings(DEFAULT_SETTINGS);
}
