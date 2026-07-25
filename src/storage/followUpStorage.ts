import AsyncStorage from "@react-native-async-storage/async-storage";

export type FollowUpStatus = "Pending" | "Completed" | "Cancelled";
export type FollowUpPriority = "Low" | "Medium" | "High";
export type FollowUpMode = "Call" | "WhatsApp" | "Meeting" | "Visit";

export type FollowUp = {
  id: string;
  customerId: string;
  customerName: string;
  mobile: string;
  subject: string;
  notes: string;
  dueAt: string;
  status: FollowUpStatus;
  priority: FollowUpPriority;
  mode: FollowUpMode;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

export type FollowUpInput = Omit<FollowUp, "id" | "createdAt" | "updatedAt">;

const STORAGE_KEY = "jmk_mobile_followups";

const LEGACY_DEMO_IDS = new Set(["followup-1"]);

function createId(): string {
  return `followup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(value: Partial<FollowUp>): FollowUp {
  const now = new Date().toISOString();
  return {
    id: value.id || createId(),
    customerId: String(value.customerId || ""),
    customerName: String(value.customerName || "").trim(),
    mobile: String(value.mobile || "").replace(/\D/g, ""),
    subject: String(value.subject || "").trim(),
    notes: String(value.notes || "").trim(),
    dueAt: value.dueAt || now,
    status: value.status || "Pending",
    priority: value.priority || "Medium",
    mode: value.mode || "Call",
    assignedTo: String(value.assignedTo || "Admin").trim() || "Admin",
    createdAt: value.createdAt || now,
    updatedAt: now,
  };
}

async function write(items: FollowUp[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function getFollowUps(): Promise<FollowUp[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const followUps = parsed
      .map((item) => normalize(item as Partial<FollowUp>))
      .filter((item) => !LEGACY_DEMO_IDS.has(item.id));

    if (followUps.length !== parsed.length) {
      await write(followUps);
    }

    return followUps;
  } catch (error) {
    console.error("Unable to read follow-ups:", error);
    return [];
  }
}

export async function getFollowUpById(id: string): Promise<FollowUp | null> {
  const items = await getFollowUps();
  return items.find((item) => item.id === id) || null;
}

export async function addFollowUp(input: FollowUpInput): Promise<FollowUp> {
  const items = await getFollowUps();
  const followUp = normalize(input);
  await write([followUp, ...items]);
  return followUp;
}

export async function updateFollowUp(
  id: string,
  updates: Partial<FollowUpInput>
): Promise<FollowUp | null> {
  const items = await getFollowUps();
  let updated: FollowUp | null = null;
  const next = items.map((item) => {
    if (item.id !== id) return item;
    updated = normalize({ ...item, ...updates, id: item.id, createdAt: item.createdAt });
    return updated;
  });
  if (!updated) return null;
  await write(next);
  return updated;
}

export async function setFollowUpStatus(
  id: string,
  status: FollowUpStatus
): Promise<FollowUp | null> {
  return updateFollowUp(id, { status });
}

export async function deleteFollowUp(id: string): Promise<boolean> {
  const items = await getFollowUps();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return false;
  await write(next);
  return true;
}
