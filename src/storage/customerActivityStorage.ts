import AsyncStorage from "@react-native-async-storage/async-storage";

export type CustomerActivityType =
  | "created"
  | "updated"
  | "call"
  | "whatsapp"
  | "note"
  | "followup"
  | "document";

export type CustomerActivity = {
  id: string;
  customerId: string;
  type: CustomerActivityType;
  title: string;
  description: string;
  createdAt: string;
};

const STORAGE_KEY = "jmk_mobile_customer_activities";

function createId(): string {
  return `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readAll(): Promise<CustomerActivity[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomerActivity[]) : [];
  } catch (error) {
    console.error("Unable to read customer activities:", error);
    return [];
  }
}

async function writeAll(items: CustomerActivity[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function getCustomerActivities(
  customerId: string
): Promise<CustomerActivity[]> {
  const items = await readAll();
  return items
    .filter((item) => item.customerId === customerId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function addCustomerActivity(
  customerId: string,
  type: CustomerActivityType,
  title: string,
  description = ""
): Promise<CustomerActivity> {
  const items = await readAll();
  const activity: CustomerActivity = {
    id: createId(),
    customerId,
    type,
    title: title.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
  };
  await writeAll([activity, ...items]);
  return activity;
}
